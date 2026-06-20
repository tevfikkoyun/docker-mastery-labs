const http = require('http');

const requiredVar = process.env.REQUIRED_API_KEY;

if (!requiredVar) {
  console.error('FATAL: REQUIRED_API_KEY environment variable is not set');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('App is running\n');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});