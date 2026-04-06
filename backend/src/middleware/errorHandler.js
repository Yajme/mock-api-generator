// backend/src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  
  if(process.env.NODE_ENV === 'DEVELOPMENT') console.error(err.stack);


  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'DEVELOPMENT' && { stack: err.stack }),
  })
}
