var express = require('express');
var router = express.Router();
const response = require('../utils/response')
const fs = require('fs')

let timer = (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('ok')
    }, delay);
  })
}

/** -------------------------------- mock api --------------------------------- */

fs.readFile(`${__dirname}/../public/router-post.json`, 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件时发生错误:', err)
    return
  }
  try {
    const jsonObject = JSON.parse(data)
    Object.keys(jsonObject).map(key => {
      router.post(key, async (req, res) => {
        await timer(1000)
        res.json(jsonObject[key])
      })
    })
  } catch (e) {
    console.log(e)
  }
});

fs.readFile(`${__dirname}/../public/router-get.json`, 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件时发生错误:', err)
    return
  }
  try {
    const jsonObject = JSON.parse(data)
    Object.keys(jsonObject).map(key => {
      router.get(key, async (req, res) => {
        await timer(1000)
        res.json(jsonObject[key])
      })
    })
  } catch (e) {
    console.log(e)
  }
});



module.exports = router;
