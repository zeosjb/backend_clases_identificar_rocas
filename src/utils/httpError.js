// Error carrying an HTTP status so services can signal 400/403/409 without knowing about Express.
class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

module.exports = { HttpError }
