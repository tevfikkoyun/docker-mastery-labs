const http = require('http');
const { Client } = require('pg');

const client = new Client({
  host: 'lab06-db',
  port: 5432,
  user: 'postgres',
  password: 'mysecretpassword',
  database: 'labdb',
});

client.connect()
  .then(() => console.log('Connected to database successfully'))
  .catch(err => console.error('Database connection error:', err));

const server = http.createServer(async (req, res) => {
  try {
    const result = await client.query('SELECT NOW()');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Backend is running. Database time: ${result.rows[0].now}\n`);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Database error: ${err.message}\n`);
  }
});

server.listen(3000, () => {
  console.log('Backend server running on port 3000');
});