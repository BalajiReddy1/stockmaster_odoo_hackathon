const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const TokenService = require('../utils/tokenService');
const OTPService = require('../utils/otpService');
const emailService = require('../utils/emailService');
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

  // Send welcome email (optional)
  try {
    await emailService.sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
  
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

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    // Don't reveal that user doesn't exist for security
    return res.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset code.'
    });
  }
  
  if (!user.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Account is deactivated'
    });
  }
  
  try {
    // Generate and store OTP
    const otp = await OTPService.createOTP(user.id, 10); // 10 minutes expiry
    
    // Send OTP via email
    await emailService.sendOTP(user.email, otp, user.name);
    
    res.json({
      success: true,
      message: 'Password reset code has been sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset code'
    });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required'
    });
  }
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Verify OTP
  const isValidOTP = await OTPService.verifyOTP(user.id, otp);
  
  if (!isValidOTP) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }
  
  res.json({
    success: true,
    message: 'OTP verified successfully'
  });
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email, OTP, and new password are required'
    });
  }
  
  // Validate new password
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Verify OTP
  const isValidOTP = await OTPService.verifyOTP(user.id, otp);
  
  if (!isValidOTP) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }
  
  try {
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    // Delete the used OTP
    await OTPService.deleteOTP(user.id, otp);
    
    // Send password change notification
    try {
      await emailService.sendPasswordChangeNotification(user.email, user.name);
    } catch (error) {
      console.error('Failed to send password change notification:', error);
    }
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

module.exports = {
  register: [validateRequest(registerSchema), register],
  login: [validateRequest(loginSchema), login],
  refreshToken,
  logout,
  getProfile,
  forgotPassword,
  verifyOTP,
  resetPassword
};