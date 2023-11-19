var createError = require('http-errors');
var express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors')
const fs = require('fs')
const utils = require('./utils/index')
// var bodyParser = require('body-parser')

var app = express();

var mockRouter = require('./routes/mock');
var serverRouter = require('./routes/server')
// 允许跨域
app.use(cors())
app.use('/api/mock', mockRouter);

// 单个服务代理
let singleProxy = {}
try {
  singleProxy = JSON.parse(fs.readFileSync(`${__dirname}/public/single-proxy.json`, 'utf8'))
} catch (err) {
  console.error('读取单服务代理配置时出错:', err);
  singleProxy = {}
}
Object.keys(singleProxy).forEach(key => {
  if (!singleProxy[key]) return
  if (!utils.isString(singleProxy[key])) return
  if (!utils.isHttpUrl(singleProxy[key])) return
  const rewriteKey = "^/api/" + key
  const pathRewrite = {}
  pathRewrite[rewriteKey] = ""
  app.use(`/api/${key}`, createProxyMiddleware({ target: singleProxy[key], changeOrigin: true, pathRewrite: pathRewrite}));
})
// 全量代理服务器
let proxyUrl
try {
  proxyUrl = fs.readFileSync(`${__dirname}/public/env.proxy.ip`, 'utf8');
} catch (err) {
  console.error('读取全量代理配置时出错:', err);
}
app.use('/api', createProxyMiddleware({ target: proxyUrl, changeOrigin: true, pathRewrite: {
  "^/api": ""
} }));
// 内置服务路由
app.use(express.json())
app.use('/server', serverRouter);



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
