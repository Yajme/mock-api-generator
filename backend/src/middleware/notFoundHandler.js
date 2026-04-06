// backend/src/middleware/notFoundHandler.js
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  })
}
