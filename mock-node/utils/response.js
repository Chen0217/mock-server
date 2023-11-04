module.exports = {
  success: (data) => {
    return {
      status: true,
      code: '200',
      message: 'success',
      data: data || null
    }
  },
  fail: (code, msg, data) => {
    return {
      status: false,
      code: code || '500',
      message: msg || 'fail',
      data: data || null
    }
  }
}