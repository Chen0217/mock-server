var createError = require('http-errors');
var express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors')
const fs = require('fs')

var app = express();

var mockRouter = require('./routes/mock');
// 允许跨域
app.use(cors())

app.use('/api/mock', mockRouter);

let proxyUrl

try {
  proxyUrl = fs.readFileSync(`${__dirname}/public/env.proxy.ip`, 'utf8');
} catch (err) {
  console.error('读取文件时出错:', err);
}

// 代理服务器
app.use('/api', createProxyMiddleware({ target: proxyUrl, changeOrigin: true, pathRewrite: {
  "^/api": ""
} }));
app.use(express.json())

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log(`🚀🚀🚀🚀🚀🚀🚀404`, req.url)
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json('error');
}); 

// success
console.log(`{"type": "event", "code": "200", "data": {"proxyUrl": "${proxyUrl}"}}`);

module.exports = app;
