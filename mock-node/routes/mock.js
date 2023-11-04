var express = require('express');
var router = express.Router();
const response = require('../utils/response')
const ipp = require('ipp');

let timer = (delay) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('ok')
    }, delay);
  })
}

/** -------------------------------- mock api --------------------------------- */

router.post(`/api/test`, async (req, res) => {
  const data = 'ok'
  res.json(response.success(data))
})

module.exports = router;
