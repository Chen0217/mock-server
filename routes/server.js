var express = require('express');
var router = express.Router();
const response = require('../utils/response')
const { setTokenFlag, setFlag } = require("../utils/data");
const fs = require('fs')

function getPath(method) {
  if (method === 'post') return process.env.routerPostPath
  if (method === 'put') return process.env.routerPutPath
  if (method === 'get') return process.env.routerGetPath
  if (method === 'delete') return process.env.routerDelPath
}

router.get('/global/proxy', async(req, res) => {
  try {
    // const proxyUrl  = fs.readFileSync(`${__dirname}/../public/env.proxy.ip`, 'utf8');
    const proxyUrl  = fs.readFileSync(process.env.envProxyPath, 'utf8');
    res.json(response.success(proxyUrl))
  } catch (err) {
    res.json(response.fail(500, err))
  }
})

router.get('/apiList', async (req, res) => {
  try {
    const apiJsonPost  = fs.readFileSync(process.env.routerPostPath, 'utf8');
    const apiJsonGet  = fs.readFileSync(process.env.routerGetPath, 'utf8');
    const apiJsonPut  = fs.readFileSync(process.env.routerPutPath, 'utf8');
    const apiJsonDelete  = fs.readFileSync(process.env.routerDelPath, 'utf8');
    const apiMapPost = JSON.parse(apiJsonPost)
    const apiMapGet = JSON.parse(apiJsonGet)
    const apiMapPut = JSON.parse(apiJsonPut)
    const apiMapDelete = JSON.parse(apiJsonDelete)
    const dataPost = Object.keys(JSON.parse(apiJsonPost)).map(key => {
      return {
        url: key,
        response: apiMapPost[key],
        method: 'post'
      }
    })
    const dataGet = Object.keys(JSON.parse(apiJsonGet)).map(key => {
      return {
        url: key,
        response: apiMapGet[key],
        method: 'get'
      }
    })
    const dataPut = Object.keys(JSON.parse(apiJsonPut)).map(key => {
      return {
        url: key,
        response: apiMapPut[key],
        method: 'put'
      }
    })
    const dataDelete = Object.keys(JSON.parse(apiJsonDelete)).map(key => {
      return {
        url: key,
        response: apiMapDelete[key],
        method: 'delete'
      }
    })
    res.json(response.success([...dataPost, ...dataGet, ...dataPut, ...dataDelete]))
  } catch (err) {
    res.json(response.fail(500, err))
  }
})

router.post('/api/add', async (req, res) => {
  try {
    const { method, responseMap, url } = req.body || {}
    const path = getPath(method)
    const apiJson  = fs.readFileSync(path, 'utf8');
    const JSONApi = JSON.parse(apiJson)
    JSONApi[url] = responseMap
    fs.writeFileSync(path, JSON.stringify(JSONApi, null, 2), 'utf8');
    res.json(response.success())
  }  catch (err) {
    res.json(response.fail(500, err))
  }
})

router.get('/api/singleProxy', async(req, res) => {
  try {
    const singleProxy  = fs.readFileSync(process.env.singleProxyPath, 'utf8');
    const singleProxyMap = JSON.parse(singleProxy)
    res.json(response.success(singleProxyMap))
  } catch (err) {
    res.json(response.fail(500, err))
  }
})
router.post('/api/singleProxy', async (req, res) => {
  try {
    const { singleProxyMap } = req.body || {}
    fs.writeFileSync(process.env.singleProxyPath, JSON.stringify(singleProxyMap, null, 2), 'utf8');
    res.json(response.success())
  }  catch (err) {
    res.json(response.fail(500, err))
  }
})

router.post('/api/refreshToken', async (req, res) => {
  try {
    setTokenFlag(true)
    res.json(response.success())
  }  catch (err) {
    res.json(response.fail(500, err))
  }
})

router.post('/api/refreshFlag', async (req, res) => {
  try {
    const { key } = req.body || {}
    setFlag(key, true)
    res.json(response.success())
  }  catch (err) {
    res.json(response.fail(500, err))
  }
})

module.exports = router;