// Import MySQL package
const mysql = require('mysql');

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL server:', err);
        return;
    }

    console.log('Connected to MySQL server!');

    // 1. Create database
    const createDatabase = `
        CREATE DATABASE IF NOT EXISTS fat_turtle_db
    `;

    connection.query(createDatabase, (err) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }

        console.log('Database fat_turtle_db created successfully!');

        // 2. Create table
        const createTable = `
            CREATE TABLE IF NOT EXISTS fat_turtle_db.customers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100),
                mobile VARCHAR(15),
                email VARCHAR(100),
                password VARCHAR(100),
                address VARCHAR(255)
            )
        `;

        connection.query(createTable, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                return;
            }

            console.log('Customers table created successfully!');

            // 3. Insert record
            const insertRecord = `
                INSERT INTO fat_turtle_db.customers
                (first_name, mobile, email, password, address)
                VALUES
                ('Jaspreet', '9876543210', 'jaspreet@gmail.com', 'Practical8', 'Ahmedabad')
            `;

            connection.query(insertRecord, (err) => {
                if (err) {
                    console.error('Error inserting record:', err);
                    return;
                }

                console.log('Record inserted successfully!');

                // 4. Update record
                const updateRecord = `
                    UPDATE fat_turtle_db.customers
                    SET address = 'Ahmedabad, Gujarat'
                    WHERE email = 'jaspreet@gmail.com'
                `;

                connection.query(updateRecord, (err) => {
                    if (err) {
                        console.error('Error updating record:', err);
                        return;
                    }

                    console.log('Record updated successfully!');

                    // 5. Close connection
                    connection.end((err) => {
                        if (err) {
                            console.error('Error closing connection:', err);
                            return;
                        }

                        console.log('MySQL connection closed!');
                    });
                });
            });
        });
    });
});