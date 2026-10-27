const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Local development: allow the XAMPP/Live Server ports used by this project.
// Keep credentials enabled because login uses an HTTP session cookie.
app.use(cors({
    origin(origin, callback) {
        // Requests without Origin (e.g. curl) are allowed for local testing.
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by local development CORS policy.'));
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.use(session({
    name: 'fatTurtle.sid',
    secret: process.env.SESSION_SECRET || 'fat-turtle-local-dev-change-this-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // Local HTTP only. Use secure:true behind HTTPS in production.
        maxAge: 1000 * 60 * 60 * 8
    }
}));

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fat_turtle_db',
    charset: 'utf8mb4'
});

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
    });
}

function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => err ? reject(err) : resolve(connection));
    });
}

function requireLogin(req, res, next) {
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ message: 'Please log in to continue.' });
    }
    next();
}

// Check the current role from MySQL on every admin request. Never trust a role
// sent by the browser or stored only in client-side JavaScript.
async function requireAdmin(req, res, next) {
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ message: 'Please log in to continue.' });
    }

    try {
        const rows = await query(
            'SELECT role FROM customers WHERE id = ? LIMIT 1',
            [req.session.customerId]
        );
        if (!rows.length) {
            return res.status(401).json({ message: 'Account not found. Please log in again.' });
        }
        if (rows[0].role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges are required.' });
        }
        req.userRole = rows[0].role;
        next();
    } catch (err) {
        console.error('Role verification error:', err.code || err.message);
        return res.status(500).json({ message: 'Could not verify account permissions.' });
    }
}

async function ensureRoleColumn() {
    const columns = await query("SHOW COLUMNS FROM customers LIKE 'role'");
    if (!columns.length) {
        await query("ALTER TABLE customers ADD COLUMN role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer'");
        console.log("Added customers.role column with default 'customer'.");
    }
}

async function ensureOrderTables() {
    // No foreign-key constraint is added here because existing practical databases
    // may define customers.id as INT or BIGINT. The application still validates the customer.
    await query(`CREATE TABLE IF NOT EXISTS orders (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        customer_id BIGINT UNSIGNED NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'Placed',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_orders_customer_created (customer_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await query(`CREATE TABLE IF NOT EXISTS order_items (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        order_id BIGINT UNSIGNED NOT NULL,
        food_name VARCHAR(150) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        item_total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_order_items_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}


async function ensureReviewsTable() {
    await query(`CREATE TABLE IF NOT EXISTS reviews (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        customer_id BIGINT UNSIGNED NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(25) NOT NULL,
        rating TINYINT UNSIGNED NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_reviews_created (created_at),
        INDEX idx_reviews_customer (customer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

app.get('/api/health', async (req, res) => {
    try {
        await query('SELECT 1 AS ok');
        res.json({ ok: true, database: process.env.DB_NAME || 'fat_turtle_db' });
    } catch (err) {
        console.error('Health/database check failed:', err.message);
        res.status(500).json({ ok: false, message: 'API is running but MySQL is unavailable.' });
    }
});

app.post('/api/signup', async (req, res) => {
    const firstName = String(req.body.first_name || '').trim();
    const mobile = String(req.body.mobile || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const address = String(req.body.address || '').trim();

    if (!firstName || !mobile || !email || !password || !address) {
        return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Use a password with at least 8 characters.' });
    }

    try {
        const existing = await query('SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1', [email]);
        if (existing.length) {
            return res.status(409).json({ message: 'This email is already registered. Please log in.' });
        }
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await query(
            'INSERT INTO customers (first_name, mobile, email, password, address, role) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, mobile, email, passwordHash, address, 'customer']
        );
        return res.status(201).json({ message: 'Account created successfully. Please log in.', customerId: result.insertId });
    } catch (err) {
        console.error('Signup error:', err.code || err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This email is already registered. Please log in.' });
        }
        return res.status(500).json({ message: 'Could not create the account. Check the customers table and backend terminal.' });
    }
});

app.post('/api/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    try {
        const rows = await query(
            'SELECT id, first_name, mobile, email, password, address, role FROM customers WHERE LOWER(email) = ? LIMIT 1',
            [email]
        );
        if (!rows.length) return res.status(401).json({ message: 'Invalid email or password.' });

        const customer = rows[0];
        let validPassword = false;
        if (String(customer.password).startsWith('$2')) {
            validPassword = await bcrypt.compare(password, String(customer.password));
        } else {
            // Supports old practical/demo records that stored a plaintext password.
            validPassword = password === String(customer.password);
        }
        if (!validPassword) return res.status(401).json({ message: 'Invalid email or password.' });

        // Upgrade older practical/demo plaintext passwords to bcrypt after a successful login.
        if (!String(customer.password).startsWith('$2')) {
            const upgradedHash = await bcrypt.hash(password, 12);
            await query('UPDATE customers SET password = ? WHERE id = ?', [upgradedHash, customer.id]);
        }

        req.session.regenerate((sessionError) => {
            if (sessionError) {
                console.error('Session regenerate error:', sessionError.message);
                return res.status(500).json({ message: 'Could not start a login session.' });
            }
            req.session.customerId = customer.id;
            req.session.role = customer.role || 'customer';
            req.session.save((saveError) => {
                if (saveError) {
                    console.error('Session save error:', saveError.message);
                    return res.status(500).json({ message: 'Could not save login session.' });
                }
                return res.json({
                    message: 'Login successful!',
                    user: {
                        id: customer.id,
                        firstName: customer.first_name,
                        email: customer.email,
                        mobile: customer.mobile,
                        address: customer.address,
                        role: customer.role || 'customer'
                    }
                });
            });
        });
    } catch (err) {
        console.error('Login error:', err.code || err.message);
        return res.status(500).json({ message: 'Unable to log in. Check the customers table and backend terminal.' });
    }
});

app.get('/api/me', requireLogin, async (req, res) => {
    try {
        const rows = await query(
            'SELECT id, first_name, mobile, email, address, role FROM customers WHERE id = ? LIMIT 1',
            [req.session.customerId]
        );
        if (!rows.length) {
            return req.session.destroy(() => res.status(401).json({ message: 'Customer account was not found. Please log in again.' }));
        }
        const c = rows[0];
        return res.json({ user: { id: c.id, firstName: c.first_name, mobile: c.mobile, email: c.email, address: c.address, role: c.role || 'customer' } });
    } catch (err) {
        console.error('Account lookup error:', err.code || err.message);
        return res.status(500).json({ message: 'Could not load your account.' });
    }
});

app.post('/api/logout', (req, res) => {
    if (!req.session) return res.json({ message: 'Logged out.' });
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Could not log out.' });
        res.clearCookie('fatTurtle.sid', { httpOnly: true, sameSite: 'lax', secure: false });
        return res.json({ message: 'Logged out successfully.' });
    });
});

const MENU_PRICES = {
    'Couscous Chickpea Salad': 249,
    'Fattoush Salad': 229,
    'Cheese Fatayer': 299,
    'Mezze Platter': 249,
    'Falafel Hummus Wrap': 249,
    'Vegan Avocado Toast with Beet Hummus': 279,
    'Turkish Coffee': 119,
    'Classic Kunafa': 249,
    'Turkish Affogato': 249,
    'Eggplant Moussaka': 499,
    'Baklava With IceCream': 299
};

app.post('/api/orders', requireLogin, async (req, res) => {
    const items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Add at least one item to your cart.' });
    }

    const cleanItems = [];
    for (const item of items) {
        const name = String((item && item.name) || '').trim();
        const quantity = Number(item && item.quantity);
        if (!Object.prototype.hasOwnProperty.call(MENU_PRICES, name) ||
            !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            return res.status(400).json({ message: `Invalid item or quantity in cart: ${name || 'unknown item'}.` });
        }
        cleanItems.push({ name, quantity, price: MENU_PRICES[name], total: MENU_PRICES[name] * quantity });
    }

    const total = cleanItems.reduce((sum, item) => sum + item.total, 0);
    let db;
    try {
        db = await getConnection();
        await new Promise((resolve, reject) => db.beginTransaction(err => err ? reject(err) : resolve()));
        const orderResult = await new Promise((resolve, reject) => {
            db.query('INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)',
                [req.session.customerId, total, 'Placed'], (err, result) => err ? reject(err) : resolve(result));
        });
        const values = cleanItems.map(item => [orderResult.insertId, item.name, item.price, item.quantity, item.total]);
        await new Promise((resolve, reject) => {
            db.query('INSERT INTO order_items (order_id, food_name, unit_price, quantity, item_total) VALUES ?',
                [values], err => err ? reject(err) : resolve());
        });
        await new Promise((resolve, reject) => db.commit(err => err ? reject(err) : resolve()));
        return res.status(201).json({ message: 'Your order has been placed and saved.', orderId: orderResult.insertId, totalAmount: total });
    } catch (err) {
        if (db) {
            try { await new Promise(resolve => db.rollback(() => resolve())); } catch (_) {}
        }
        console.error('Place order error:', err.code || err.message);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({ message: 'Order tables are missing. Restart the backend so it can create them.' });
        }
        return res.status(500).json({ message: 'Could not save your order. Check the backend terminal for the database error.' });
    } finally {
        if (db) db.release();
    }
});

app.get('/api/orders', requireLogin, async (req, res) => {
    try {
        const orders = await query(
            'SELECT id, total_amount, status, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC, id DESC',
            [req.session.customerId]
        );
        if (!orders.length) return res.json({ orders: [] });
        const ids = orders.map(order => order.id);
        const placeholders = ids.map(() => '?').join(',');
        const items = await query(
            `SELECT order_id, food_name, unit_price, quantity, item_total FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
            ids
        );
        const grouped = {};
        for (const item of items) {
            if (!grouped[item.order_id]) grouped[item.order_id] = [];
            grouped[item.order_id].push(item);
        }
        return res.json({ orders: orders.map(order => ({
            id: order.id,
            totalAmount: Number(order.total_amount),
            status: order.status,
            createdAt: order.created_at,
            items: grouped[order.id] || []
        })) });
    } catch (err) {
        console.error('Order history error:', err.code || err.message);
        return res.status(500).json({ message: 'Could not load your orders. Check that the orders and order_items tables exist.' });
    }
});

// Practical 9: protected admin-only routes for demonstrating role-based access.
app.get('/api/admin/dashboard', requireLogin, requireAdmin, async (req, res) => {
    try {
        const rows = await query(
            `SELECT
                (SELECT COUNT(*) FROM customers) AS totalCustomers,
                (SELECT COUNT(*) FROM orders) AS totalOrders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders) AS totalRevenue,
                (SELECT COUNT(*) FROM orders WHERE LOWER(status) NOT IN ('completed', 'cancelled')) AS pendingOrders`
        );
        const stats = {
            totalCustomers: Number(rows[0].totalCustomers),
            totalOrders: Number(rows[0].totalOrders),
            totalRevenue: Number(rows[0].totalRevenue),
            pendingOrders: Number(rows[0].pendingOrders)
        };
        return res.json({
            message: 'Admin access granted.',
            role: req.userRole,
            ...stats,
            stats
        });
    } catch (err) {
        console.error('Admin dashboard error:', err.code || err.message);
        return res.status(500).json({ message: 'Could not load the admin dashboard.' });
    }
});

app.get('/api/admin/orders', requireLogin, requireAdmin, async (req, res) => {
    try {
        const orders = await query(
            `SELECT o.id, o.customer_id, c.first_name, c.email,
                    o.total_amount, o.status, o.created_at
             FROM orders o
             LEFT JOIN customers c ON c.id = o.customer_id
             ORDER BY o.created_at DESC, o.id DESC`
        );
        return res.json({ orders });
    } catch (err) {
        console.error('Admin orders error:', err.code || err.message);
        return res.status(500).json({ message: 'Could not load all orders.' });
    }
});

app.get('/api/admin/customers', requireLogin, requireAdmin, async (req, res) => {
    try {
        const customers = await query(
            'SELECT id, first_name, mobile, email, role FROM customers ORDER BY id DESC'
        );
        return res.json({ customers });
    } catch (err) {
        console.error('Admin customers error:', err.code || err.message);
        return res.status(500).json({ message: 'Could not load customers.' });
    }
});


// Save customer feedback/reviews in MySQL. Login is optional for submitting feedback;
// when logged in, the review is associated with that customer account.
app.post('/api/reviews', async (req, res) => {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const rating = Number(req.body.rating);
    const message = String(req.body.message || '').trim();
    const customerId = req.session && req.session.customerId
        ? Number(req.session.customerId)
        : null;

    if (!name || !phone || !message || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
            message: 'Please provide your name, phone number, a rating from 1 to 5, and feedback.'
        });
    }
    if (name.length > 100 || phone.length > 25 || message.length > 3000) {
        return res.status(400).json({ message: 'Please shorten the name, phone number, or feedback.' });
    }

    try {
        const result = await query(
            `INSERT INTO reviews (customer_id, name, phone, rating, message)
             VALUES (?, ?, ?, ?, ?)`,
            [customerId, name, phone, rating, message]
        );
        return res.status(201).json({
            message: 'Thank you! Your feedback has been saved.',
            reviewId: result.insertId
        });
    } catch (err) {
        console.error('Save review error:', err.code || err.message);
        return res.status(500).json({
            message: 'Could not save your feedback. Please check the backend terminal.'
        });
    }
});

// Admin-only review listing for moderation and project demonstration.
app.get('/api/admin/reviews', requireLogin, requireAdmin, async (req, res) => {
    try {
        const reviews = await query(
            `SELECT id, customer_id, name, phone, rating, message, created_at
             FROM reviews
             ORDER BY created_at DESC, id DESC`
        );
        return res.json({ reviews });
    } catch (err) {
        console.error('Admin reviews error:', err.code || err.message);
        return res.status(500).json({ message: 'Could not load reviews.' });
    }
});

app.get('/', (req, res) => res.send('The Fat Turtle API is running. Open the website through your local web server.'));

async function startServer() {
    try {
        await new Promise((resolve, reject) => pool.getConnection((err, connection) => {
            if (err) return reject(err);
            connection.release();
            resolve();
        }));
        console.log(`Connected to MySQL database: ${process.env.DB_NAME || 'fat_turtle_db'}`);
        await ensureRoleColumn();
        await ensureOrderTables();
        await ensureReviewsTable();
        console.log('Checked/created orders, order_items, and reviews tables.');
        app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
    } catch (err) {
        console.error('Could not start backend / connect to MySQL:', err.code || err.message);
        console.error('Check that MySQL is running and fat_turtle_db and customers table exist.');
        process.exitCode = 1;
    }
}

startServer();
