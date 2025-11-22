const errorHandler = (error, req, res, next) => {
  console.error(error);
  
  let statusCode = 500;
  let message = 'Internal server error';
  
  // Prisma errors
  if (error.code === 'P2002') {
    statusCode = 400;
    message = 'Duplicate entry - this record already exists';
  } else if (error.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  } else if (error.code?.startsWith('P2')) {
    statusCode = 400;
    message = 'Database operation failed';
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = { errorHandler, notFound };