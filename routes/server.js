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
    const apiJsonPost  = fs.readFileSync(`${__dirname}/../public/router-post.json`, 'utf8');
    const apiJsonGet  = fs.readFileSync(`${__dirname}/../public/router-get.json`, 'utf8');
    const apiJsonPut  = fs.readFileSync(`${__dirname}/../public/router-put.json`, 'utf8');
    const apiJsonDelete  = fs.readFileSync(`${__dirname}/../public/router-delete.json`, 'utf8');
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
    const apiJson  = fs.readFileSync(`${__dirname}/../public/router-${method}.json`, 'utf8');
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