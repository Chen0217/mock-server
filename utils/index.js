module.exports = {
  isString: (val) => {
    return Object.prototype.toString.call(val) === '[object String]'
  },
  isHttpUrl: (url) => {
    return url.startsWith('http')
  }
}