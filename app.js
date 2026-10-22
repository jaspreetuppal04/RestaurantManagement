const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000',
             'http://localhost:5500', 'http://127.0.0.1:5500',
             'http://localhost:5501', 'http://127.0.0.1:5501',
             'http://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true
}));
app.use(express.json());

app.use(session({
    name: 'fatTurtle.sid',
    secret: process.env.SESSION_SECRET || 'replace-this-local-development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // localhost development only; use true with HTTPS in production
        maxAge: 1000 * 60 * 60 * 8
    }
}));

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fat_turtle_db'
});

connection.connect((err) => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        return;
    }
    console.log('Connected to fat_turtle_db');
});

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

function requireLogin(req, res, next) {
    if (!req.session.customerId) {
        return res.status(401).json({ message: 'Please log in to continue.' });
    }
    next();
}

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
        const existing = await query(
            'SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1',
            [email]
        );
        if (existing.length) {
            return res.status(409).json({ message: 'This email is already registered. Please log in.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await query(
            `INSERT INTO customers (first_name, mobile, email, password, address)
             VALUES (?, ?, ?, ?, ?)`,
            [firstName, mobile, email, passwordHash, address]
        );
        res.status(201).json({
            message: 'Account created successfully. Please log in.',
            customerId: result.insertId
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This email is already registered. Please log in.' });
        }
        console.error('Signup error:', err.message);
        res.status(500).json({ message: 'Could not create the account.' });
    }
});

app.post('/api/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const rows = await query(
            `SELECT id, first_name, mobile, email, password, address
             FROM customers WHERE LOWER(email) = ? LIMIT 1`,
            [email]
        );
        if (!rows.length) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const customer = rows[0];
        let validPassword = false;
        // The plaintext comparison is only for old practical/demo rows created before password hashing.
        // New signups always use bcrypt hashes. Change old passwords to hashed passwords before production.
        if (String(customer.password).startsWith('$2')) {
            validPassword = await bcrypt.compare(password, customer.password);
        } else {
            validPassword = password === String(customer.password);
        }

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        req.session.regenerate((sessionError) => {
            if (sessionError) {
                console.error('Session error:', sessionError);
                return res.status(500).json({ message: 'Could not start a secure session.' });
            }
            req.session.customerId = customer.id;
            req.session.save((saveError) => {
                if (saveError) {
                    return res.status(500).json({ message: 'Could not save login session.' });
                }
                res.json({
                    message: 'Login successful!',
                    user: {
                        id: customer.id,
                        firstName: customer.first_name,
                        email: customer.email,
                        mobile: customer.mobile,
                        address: customer.address
                    }
                });
            });
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Unable to log in right now.' });
    }
});

app.get('/api/me', requireLogin, async (req, res) => {
    try {
        const rows = await query(
            `SELECT id, first_name, mobile, email, address
             FROM customers WHERE id = ? LIMIT 1`,
            [req.session.customerId]
        );
        if (!rows.length) {
            req.session.destroy(() => {});
            return res.status(401).json({ message: 'Customer account was not found. Please log in again.' });
        }
        const c = rows[0];
        res.json({
            user: {
                id: c.id,
                firstName: c.first_name,
                mobile: c.mobile,
                email: c.email,
                address: c.address
            }
        });
    } catch (err) {
        console.error('Account lookup error:', err.message);
        res.status(500).json({ message: 'Could not load your account.' });
    }
});

app.post('/api/logout', (req, res) => {
    if (!req.session) return res.json({ message: 'Logged out.' });
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Could not log out.' });
        res.clearCookie('fatTurtle.sid', { httpOnly: true, sameSite: 'lax', secure: false });
        res.json({ message: 'Logged out successfully.' });
    });
});

// Authoritative menu prices are set on the server; never trust prices sent by the browser.
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
        const name = String(item.name || '').trim();
        const quantity = Number(item.quantity);
        if (!Object.prototype.hasOwnProperty.call(MENU_PRICES, name) ||
            !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            return res.status(400).json({ message: 'Your cart contains an invalid item or quantity.' });
        }
        cleanItems.push({
            name,
            quantity,
            price: MENU_PRICES[name],
            total: MENU_PRICES[name] * quantity
        });
    }

    const total = cleanItems.reduce((sum, item) => sum + item.total, 0);
    connection.beginTransaction(async (transactionError) => {
        if (transactionError) {
            console.error(transactionError);
            return res.status(500).json({ message: 'Could not start the order transaction.' });
        }
        connection.query(
            'INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)',
            [req.session.customerId, total, 'Placed'],
            (orderError, orderResult) => {
                if (orderError) {
                    return connection.rollback(() => {
                        console.error(orderError);
                        res.status(500).json({ message: 'Could not save your order.' });
                    });
                }
                const orderId = orderResult.insertId;
                const values = cleanItems.map(item => [
                    orderId, item.name, item.price, item.quantity, item.total
                ]);
                connection.query(
                    'INSERT INTO order_items (order_id, food_name, unit_price, quantity, item_total) VALUES ?',
                    [values],
                    (itemsError) => {
                        if (itemsError) {
                            return connection.rollback(() => {
                                console.error(itemsError);
                                res.status(500).json({ message: 'Could not save order items.' });
                            });
                        }
                        connection.commit((commitError) => {
                            if (commitError) {
                                return connection.rollback(() => {
                                    console.error(commitError);
                                    res.status(500).json({ message: 'Could not complete your order.' });
                                });
                            }
                            res.status(201).json({
                                message: 'Your order has been placed and saved.',
                                orderId,
                                totalAmount: total
                            });
                        });
                    }
                );
            }
        );
    });
});

app.get('/api/orders', requireLogin, async (req, res) => {
    try {
        const orders = await query(
            `SELECT id, total_amount, status, created_at
             FROM orders WHERE customer_id = ? ORDER BY created_at DESC, id DESC`,
            [req.session.customerId]
        );
        if (!orders.length) return res.json({ orders: [] });

        const ids = orders.map(order => order.id);
        const placeholders = ids.map(() => '?').join(',');
        const items = await query(
            `SELECT order_id, food_name, unit_price, quantity, item_total
             FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`,
            ids
        );
        const grouped = {};
        for (const item of items) {
            if (!grouped[item.order_id]) grouped[item.order_id] = [];
            grouped[item.order_id].push(item);
        }
        res.json({
            orders: orders.map(order => ({
                id: order.id,
                totalAmount: Number(order.total_amount),
                status: order.status,
                createdAt: order.created_at,
                items: grouped[order.id] || []
            }))
        });
    } catch (err) {
        console.error('Order history error:', err.message);
        res.status(500).json({ message: 'Could not load your orders.' });
    }
});

app.get('/', (req, res) => {
    res.send('The Fat Turtle API is running. Open the website through your local web server.');
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});

