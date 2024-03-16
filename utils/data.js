let flag = {
  getToken: false
}

module.exports = {
  getTokenFlag: () => {
    return flag.getToken
  },
  setTokenFlag: (boolean) => {
    flag.getToken = boolean
  }
}
