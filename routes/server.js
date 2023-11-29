var express = require('express');
var router = express.Router();
const response = require('../utils/response')
const fs = require('fs')

router.get('/global/proxy', async(req, res) => {
  try {
    const proxyUrl  = fs.readFileSync(`${__dirname}/../public/env.proxy.ip`, 'utf8');
    res.json(response.success(proxyUrl))
  } catch (err) {
    res.json(response.fail(500, err))
  }
})

router.get('/apiList', async (req, res) => {
  try {
    const apiJson  = fs.readFileSync(`${__dirname}/../public/router-post.json`, 'utf8');
    const apiMap = JSON.parse(apiJson)
    const data = Object.keys(JSON.parse(apiJson)).map(key => {
      return {
        url: key,
        response: apiMap[key]
      }
    })
    res.json(response.success(data))
  } catch (err) {
    res.json(response.fail(500, err))
  }
})

router.post('/api/add', async (req, res) => {
  try {
    const { method, responseMap, url } = req.body || {}
    const apiJson  = fs.readFileSync(`${__dirname}/../public/router-post.json`, 'utf8');
    const JSONApi = JSON.parse(apiJson)
    JSONApi[url] = responseMap
    fs.writeFileSync(`${__dirname}/../public/router-${method}.json`, JSON.stringify(JSONApi, null, 2), 'utf8');
    res.json(response.success())
  }  catch (err) {
    res.json(response.fail(500, err))
  }
})

router.get('/api/singleProxy', async(req, res) => {
  try {
    const singleProxy  = fs.readFileSync(`${__dirname}/../public/single-proxy.json`, 'utf8');
    const singleProxyMap = JSON.parse(singleProxy)
    res.json(response.success(singleProxyMap))
  } catch (err) {
    res.json(response.fail(500, err))
  }
})
router.post('/api/singleProxy', async (req, res) => {
  try {
    const { singleProxyMap } = req.body || {}
    fs.writeFileSync(`${__dirname}/../public/single-proxy.json`, JSON.stringify(singleProxyMap, null, 2), 'utf8');
    res.json(response.success())
  }  catch (err) {
    res.json(response.fail(500, err))
  }
})

module.exports = router;