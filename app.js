var createError = require('http-errors');
var express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const cors = require('cors')
const fs = require('fs')
const utils = require('./utils/index')
const querystring = require('querystring')
// var bodyParser = require('body-parser')
const { setTokenFlag, getTokenFlag, getFlag, setFlag } = require("./utils/data");
let tokenTemp = 0 // 记录时间
let stationTemp = 0
let groupTemp = 0

var app = express();

var mockRouter = require('./routes/mock');
var serverRouter = require('./routes/server')
// 允许跨域
app.use(cors())
// mock服务
app.use('/api', mockRouter);
// app.use(bodyParser.json({ limit: '50mb' }))
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
// 单个服务代理
let singleProxy = {}
try {
  singleProxy = JSON.parse(fs.readFileSync(`${__dirname}/public/single-proxy.json`, 'utf8'))
} catch (err) {
  console.error('读取单服务代理配置时出错:', err);
  singleProxy = {}
}
Object.keys(singleProxy).forEach(key => {
  if (!(singleProxy[key] && singleProxy[key].target)) return
  if (!singleProxy[key].open) return
  if (!utils.isString(singleProxy[key].target)) return
  if (!utils.isHttpUrl(singleProxy[key].target)) return
  const rewriteKey = "^/api/" + key
  const pathRewrite = {}
  pathRewrite[rewriteKey] = ""
  app.use(`/api/${key}`, createProxyMiddleware({ target: singleProxy[key].target, changeOrigin: true, pathRewrite: pathRewrite}));
})
// 全量代理服务器
app.use(express.json())
let proxyUrl
try {
  // proxyUrl = fs.readFileSync(`${__dirname}/public/env.proxy.ip`, 'utf8');
  proxyUrl = fs.readFileSync(process.env.envProxyPath, 'utf8');
} catch (err) {
  console.error('读取全量代理配置时出错:', err);
}

const writeBody = (proxyReq, bodyData) => {
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
};
app.use('/api', createProxyMiddleware({ 
  target: proxyUrl,
  changeOrigin: true,
  onProxyReq: function(proxyReq, req, res) {
    // 劫持token
    if (Date.now() - tokenTemp >= 6 * 60 * 1000 || getTokenFlag()) {
      console.log(`{"type": "token", "code": "200", "data": {"token": "${req.headers?.['authorization']}"}}`);
      tokenTemp = Date.now()
      setTokenFlag(false)
    }
    // 劫持req.body
    // station
    if (Date.now() - stationTemp >= 6 * 60 * 1000 || getFlag('station')) {
      if (req.url.includes?.('mes-industrial/industira/message/get')) {
        const { deviceId, stationId, productLineId } = req.body || {}
        if (deviceId && stationId) {
          console.log(`{"type": "station", "code": "200", "data": {"deviceId": "${deviceId}", "stationId": "${stationId}"}}`);
          stationTemp = Date.now()
          setFlag('station', false)
        }
        if (productLineId && stationId) {
          console.log(`{"type": "station", "code": "200", "data": {"productLineId": "${productLineId}", "stationId": "${stationId}"}}`);
          stationTemp = Date.now()
          setFlag('station', false)
        }
      }
    }
    // group
    if (Date.now() - groupTemp >= 6 * 60 * 1000 || getFlag('group')) {
      if (req.url.includes?.('mes-main-data/web/stationGroupRelation/listBindForDeviceByGroupId')) {
        const { groupId } = req.body || {}
        if (groupId) {
          console.log(`{"type": "station", "code": "200", "data": {"groupId": "${groupId}"}}`);
          groupTemp = Date.now()
          setFlag('group', false)
        }
      }
    }
    // 处理express.json()与http-proxy-middleware冲突
    const contentType = proxyReq.getHeader('Content-Type');
    if (contentType && contentType.toString().includes('application/json')) {
      writeBody(proxyReq, JSON.stringify(req.body));
    }
    if (contentType && contentType.toString().includes('application/x-www-form-urlencoded')) {
      writeBody(proxyReq, querystring.stringify(req.body));
    }
  },
  pathRewrite: {
    "^/api": ""
  }
}));
// 内置服务路由
// app.use(express.json())
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
// console.log(`{"type": "event", "code": "200", "data": {"proxyUrl": "${proxyUrl}"}}`);
setTimeout(() => {
  console.log("🚀sy ~ setTimeout ~ process: 子进程告诉主进程启动成功")
  process.send(`{"type": "event", "code": "200", "data": {"proxyUrl": "${proxyUrl}"}}`)
}, 100);

module.exports = app;
