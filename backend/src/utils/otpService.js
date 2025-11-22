const crypto = require('crypto');
const prisma = require('../config/database');

class OTPService {
  // Generate a 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and store OTP for user
  static async createOTP(userId, expiresInMinutes = 10) {
    const token = this.generateOTP();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Delete any existing OTP tokens for this user
    await prisma.oTPToken.deleteMany({
      where: { userId }
    });

    // Create new OTP token
    const otpToken = await prisma.oTPToken.create({
      data: {
        userId,
        token,
        expiresAt,
      }
    });

    return otpToken.token;
  }

  // Verify OTP token
  static async verifyOTP(userId, token) {
    const otpToken = await prisma.oTPToken.findFirst({
      where: {
        userId,
        token,
        expiresAt: {
          gt: new Date() // Not expired
        }
      }
    });

    if (!otpToken) {
      return false;
    }

    return true;
  }

  // Delete OTP token after successful verification
  static async deleteOTP(userId, token) {
    await prisma.oTPToken.deleteMany({
      where: {
        userId,
        token
      }
    });
  }

  // Clean up expired OTP tokens
  static async cleanupExpiredTokens() {
    await prisma.oTPToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }
}

module.exports = OTPService;