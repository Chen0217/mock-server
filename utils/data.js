let flag = {
  getToken: false,
  station: false,
  group: false
}

module.exports = {
  getTokenFlag: () => {
    return flag.getToken
  },
  setTokenFlag: (boolean) => {
    flag.getToken = boolean
  },
  getFlag: (key) => {
    return flag[key]
  },
  setFlag: (key, value) => {
    flag[key] = value
  }
}
