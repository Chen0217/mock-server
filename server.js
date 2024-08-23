var app = require('./app');
var http = require('http');
var server = http.createServer(app);
server.listen(3000);


// 监听 SIGINT 和 SIGTERM 信号
process.on('SIGINT', () => {
  console.log('Received SIGINT, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});