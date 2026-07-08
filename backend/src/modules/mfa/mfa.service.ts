import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../../config/database';
import { tokenService } from '../../services/token.service';
import { ValidationError, UnauthorizedError } from '../../utils/errors';
import { generateToken } from '../../utils/helpers';

class MFAService {
  async setupMFA(userId: string) {
    const existing = await prisma.mFAMethod.findFirst({ where: { userId } });
    if (existing?.enabled) {
      throw new ValidationError('MFA is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `AuthForge:${userId}`,
      issuer: 'AuthForge',
    });

    const backupCodes = Array.from({ length: 8 }, () => generateToken(4));

    if (existing) {
      await prisma.mFAMethod.update({
        where: { id: existing.id },
        data: { secret: secret.base32!, enabled: false, verifiedAt: null },
      });
    } else {
      await prisma.mFAMethod.create({
        data: { userId, secret: secret.base32!, type: 'totp' },
      });
    }

    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    return { secret: secret.base32, qrCode, backupCodes };
  }

  async verifyAndEnable(userId: string, code: string) {
    const mfa = await prisma.mFAMethod.findFirst({ where: { userId } });
    if (!mfa) throw new ValidationError('MFA not set up');

    const verified = speakeasy.totp.verify({
      secret: mfa.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) throw new ValidationError('Invalid code');

    await prisma.mFAMethod.update({
      where: { id: mfa.id },
      data: { enabled: true, verifiedAt: new Date() },
    });
  }

  async disableMFA(userId: string, code: string) {
    const mfa = await prisma.mFAMethod.findFirst({ where: { userId, enabled: true } });
    if (!mfa) throw new ValidationError('MFA is not enabled');

    const verified = speakeasy.totp.verify({
      secret: mfa.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) throw new ValidationError('Invalid code');

    await prisma.mFAMethod.update({
      where: { id: mfa.id },
      data: { enabled: false, verifiedAt: null },
    });
  }

  async verifyChallenge(userId: string, code: string, ipAddress: string, userAgent: string | undefined) {
    const mfa = await prisma.mFAMethod.findFirst({ where: { userId, enabled: true } });
    if (!mfa) throw new ValidationError('MFA is not enabled');

    const verified = speakeasy.totp.verify({
      secret: mfa.secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) throw new ValidationError('Invalid code');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isBlocked) throw new UnauthorizedError('User not found or blocked');

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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getStatus(userId: string) {
    const mfa = await prisma.mFAMethod.findFirst({ where: { userId } });
    return {
      enabled: mfa?.enabled || false,
      type: mfa?.type || null,
      verifiedAt: mfa?.verifiedAt || null,
    };
  }
}

export const mfaService = new MFAService();
