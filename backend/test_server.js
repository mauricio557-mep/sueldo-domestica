// test_server.js
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Si ves esto en el navegador, el servidor funciona.\n');
});

server.listen(3000, '127.0.0.1', () => {
  console.log('--- SERVIDOR DE PRUEBA INICIADO ---');
  console.log('Este es el servidor más simple posible.');
  console.log('Si esto no se queda "colgado", el problema está en tu sistema/terminal.');
  console.log('Usa Ctrl+C para detenerlo.');
});

