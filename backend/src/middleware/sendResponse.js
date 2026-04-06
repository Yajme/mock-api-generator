// src/middleware/sendResponse.js 
export const sendResponse = async (req,res,next) => {
  try {
    res.status(res.locals.status || 200).json({
    success: true,
    status: res.locals.status || 200,
    message: res.locals.message || 'OK',
    data: res.locals.data || null,
    timestamp: new Date().toISOString(),
  });
  } catch (error) {
    next(error);
  }
}
