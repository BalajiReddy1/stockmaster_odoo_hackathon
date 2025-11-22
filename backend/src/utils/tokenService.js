const jwt = require('jsonwebtoken');

class TokenService {
  static generateTokens(userId, email, role) {
    const payload = { userId, email, role };
    
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  static verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
  
  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  }
  
  static getTokenFromHeader(authHeader) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}

module.exports = TokenService;