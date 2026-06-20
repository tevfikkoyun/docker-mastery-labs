const http = require('http');
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'db',
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionTimeoutMillis: 5000,
});

let dbConnected = false;

client.connect()
  .then(() => {
    dbConnected = true;
    console.log('Connected to database successfully');
  })
  .catch(err => console.error('Database connection error:', err.message));

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK\n');
    return;
  }

  if (!dbConnected) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Database not connected\n');
    return;
  }

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