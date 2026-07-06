const db = require('./server/config/db');

db.all("SELECT id, username, email FROM users", (err, rows) => {
    if (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
    console.log('Users in database:');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
});