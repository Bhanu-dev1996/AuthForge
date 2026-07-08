import crypto from 'crypto';
import { prisma } from '../../config/database';
import { tokenService } from '../../services/token.service';
import { emailService } from '../../services/email.service';
import { auditService } from '../../services/audit.service';
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../../utils/errors';
import { generateToken, generateOTP } from '../../utils/helpers';
import { env } from '../../config/env';
import { AuthResult, AuthTokens } from '../../types';
import { RegisterInput, LoginInput, ResetPasswordInput } from './auth.schema';

export class AuthService {
  async register(input: RegisterInput, ipAddress: string, userAgent: string | undefined): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await tokenService.hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: generateToken(),
        refreshToken: generateToken(),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = tokenService.generateTokens(user.id, user.role, session.id);

    const verificationToken = generateToken(32);
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token: crypto.createHash('sha256').update(verificationToken).digest('hex'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    emailService.sendVerificationEmail(user.email, verificationToken).catch(() => {});

    return {
      user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, emailVerified: user.emailVerified },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(
    input: LoginInput,
    ipAddress: string,
    userAgent: string | undefined
  ): Promise<{ result: AuthResult } | { mfaRequired: boolean; userId: string }> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) {
      await auditService.logLoginAttempt(null, input.email, ipAddress, userAgent, false);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new ForbiddenError('Account is blocked. Contact support.');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account is temporarily locked. Try again later.');
    }

    const valid = await tokenService.comparePassword(input.password, user.passwordHash);
    if (!valid) {
      await auditService.logLoginAttempt(user.id, input.email, ipAddress, userAgent, false);

      const failedAttempts = await auditService.getRecentFailedAttempts(input.email);
      if (failedAttempts >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
        });
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    await auditService.logLoginAttempt(user.id, input.email, ipAddress, userAgent, true);
    await prisma.user.update({ where: { id: user.id }, data: { lockedUntil: null } });

    const mfaEnabled = await prisma.mFAMethod.findFirst({
      where: { userId: user.id, enabled: true },
    });

    if (mfaEnabled) {
      return { mfaRequired: true, userId: user.id };
    }

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: generateToken(),
        refreshToken: generateToken(),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = tokenService.generateTokens(user.id, user.role, session.id);

    return {
      result: {
        user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, emailVerified: user.emailVerified },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async refresh(refreshTokenStr: string): Promise<AuthTokens> {
    let payload: { userId: string; sessionId: string };
    try {
      payload = tokenService.verifyRefreshToken(refreshTokenStr) as any;
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const session = await prisma.session.findFirst({
      where: { id: payload.sessionId, isRevoked: false },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isBlocked) {
      throw new UnauthorizedError('User not found or blocked');
    }

    const newRefreshToken = generateToken();
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, lastUsedAt: new Date() },
    });

    const tokens = tokenService.generateTokens(user.id, user.role, session.id);
    return { accessToken: tokens.accessToken, refreshToken: newRefreshToken };
  }

  async logout(sessionId: string, userId: string) {
    await prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isRevoked: true },
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = generateToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: crypto.createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    emailService.sendPasswordResetEmail(email, token).catch(() => {});
  }

  async resetPassword(input: ResetPasswordInput) {
    const hashedToken = crypto.createHash('sha256').update(input.token).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({ where: { token: hashedToken } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const passwordHash = await tokenService.hashPassword(input.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.session.updateMany({ where: { userId: record.userId }, data: { isRevoked: true } }),
    ]);
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.emailVerificationToken.findUnique({ where: { token: hashedToken } });

    if (!record || record.verifiedAt || record.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { verifiedAt: new Date() } }),
    ]);
  }

  async resendVerification(userId: string, email: string) {
    const token = generateToken(32);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    emailService.sendVerificationEmail(email, token).catch(() => {});
  }

  async sendMagicLink(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = generateToken(32);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    await prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    emailService.sendMagicLinkEmail(email, token).catch(() => {});
  }

  async verifyMagicLink(
    token: string,
    ipAddress: string,
    userAgent: string | undefined
  ): Promise<AuthResult> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.magicLinkToken.findUnique({ where: { token: hashedToken } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new ValidationError('Invalid or expired magic link');
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || user.isBlocked) {
      throw new UnauthorizedError('User not found or blocked');
    }

    await prisma.magicLinkToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: generateToken(),
        refreshToken: generateToken(),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = tokenService.generateTokens(user.id, user.role, session.id);
    return {
      user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, emailVerified: user.emailVerified },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async sendOTP(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const otp = generateOTP(6);
    const now = new Date();
    await prisma.oTPCode.create({
      data: {
        userId: user.id,
        email,
        code: crypto.createHash('sha256').update(otp).digest('hex'),
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
      },
    });
    emailService.sendOTPEmail(email, otp).catch(() => {});
  }

  async verifyOTP(
    email: string,
    otp: string,
    ipAddress: string,
    userAgent: string | undefined
  ): Promise<AuthResult> {
    const hashedCode = crypto.createHash('sha256').update(otp).digest('hex');
    const record = await prisma.oTPCode.findFirst({
      where: { email, code: hashedCode, usedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || user.isBlocked) {
      throw new UnauthorizedError('User not found or blocked');
    }

    await prisma.oTPCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: generateToken(),
        refreshToken: generateToken(),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = tokenService.generateTokens(user.id, user.role, session.id);
    return {
      user: { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role, emailVerified: user.emailVerified },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logoutAll(userId: string, exceptSessionId?: string) {
    if (exceptSessionId) {
      await prisma.session.updateMany({
        where: { userId, id: { not: exceptSessionId }, isRevoked: false },
        data: { isRevoked: true },
      });
    } else {
      await prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }
  }
}

export const authService = new AuthService();
