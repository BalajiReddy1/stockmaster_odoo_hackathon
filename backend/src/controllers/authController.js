const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const TokenService = require('../utils/tokenService');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation');

// Cookie options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const register = async (req, res) => {
  const { email, password, name, role } = req.body;
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }
  
  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'WAREHOUSE_STAFF'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
  
  // Generate tokens
  const { accessToken, refreshToken } = TokenService.generateTokens(
    user.id,
    user.email,
    user.role
  );
  
  // Set cookies
  res.cookie('accessToken', accessToken, {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, getCookieOptions());
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
    tokens: { accessToken, refreshToken }
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
  
  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = TokenService.generateTokens(
    user.id,
    user.email,
    user.role
  );
  
  // Set cookies
  res.cookie('accessToken', accessToken, {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, getCookieOptions());
  
  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    message: 'Login successful',
    user: userWithoutPassword,
    tokens: { accessToken, refreshToken }
  });
};

const refreshToken = async (req, res) => {
  let refreshToken;
  
  // Try to get refresh token from cookies first
  if (req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  }
  // Fallback to request body
  else if (req.body.refreshToken) {
    refreshToken = req.body.refreshToken;
  }
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }
  
  try {
    // Verify refresh token
    const decoded = TokenService.verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deactivated'
      });
    }
    
    // Generate new tokens
    const tokens = TokenService.generateTokens(user.id, user.email, user.role);
    
    // Set new cookies
    res.cookie('accessToken', tokens.accessToken, {
      ...getCookieOptions(),
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    res.cookie('refreshToken', tokens.refreshToken, getCookieOptions());
    
    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      user,
      tokens
    });
  } catch (error) {
    // Clear cookies on invalid refresh token
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

const logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    user
  });
};

module.exports = {
  register: [validateRequest(registerSchema), register],
  login: [validateRequest(loginSchema), login],
  refreshToken,
  logout,
  getProfile
};