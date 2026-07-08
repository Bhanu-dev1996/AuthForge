import crypto from 'crypto';
import { prisma } from '../../config/database';
import { tokenService } from '../../services/token.service';
import { NotFoundError, ValidationError, UnauthorizedError } from '../../utils/errors';
import { generateToken } from '../../utils/helpers';
import { AuthResult } from '../../types';

class WebAuthnService {
  private challenges = new Map<string, { challenge: string; userId?: string; email?: string }>();

  async beginRegistration(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const challenge = crypto.randomBytes(32).toString('base64url');
    const id = crypto.randomBytes(16).toString('base64url');

    this.challenges.set(userId, { challenge });

    return {
      challenge,
      rp: { name: 'AuthForge', id: 'localhost' },
      user: {
        id,
        name: user.email,
        displayName: user.name || user.email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      attestation: 'none',
    };
  }

  async completeRegistration(userId: string, credential: any) {
    const challengeData = this.challenges.get(userId);
    if (!challengeData) throw new ValidationError('No registration challenge found');

    this.challenges.delete(userId);

    const passkey = await prisma.passkey.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: JSON.stringify(credential.response?.publicKey || credential),
        counter: BigInt(credential.response?.counter || 0),
        deviceName: credential.deviceName || 'Unknown device',
        backedUp: credential.response?.backupState || false,
        transports: credential.response?.transports || [],
      },
    });

    return {
      id: passkey.id,
      deviceName: passkey.deviceName,
      createdAt: passkey.createdAt,
    };
  }

  async beginLogin(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError('User not found');

    const passkeys = await prisma.passkey.findMany({ where: { userId: user.id } });
    if (passkeys.length === 0) throw new NotFoundError('No passkeys registered');

    const challenge = crypto.randomBytes(32).toString('base64url');
    this.challenges.set(`login:${user.id}`, { challenge, email });

    return {
      challenge,
      allowCredentials: passkeys.map((pk) => ({
        id: pk.credentialId,
        type: 'public-key',
        transports: pk.transports as string[],
      })),
      userVerification: 'preferred',
    };
  }

  async completeLogin(
    credential: any,
    ipAddress: string,
    userAgent: string | undefined
  ): Promise<AuthResult> {
    const passkey = await prisma.passkey.findUnique({
      where: { credentialId: credential.id },
      include: { user: true },
    });

    if (!passkey) throw new NotFoundError('Passkey not found');
    if (passkey.user.isBlocked) throw new UnauthorizedError('Account is blocked');

    const challengeKey = `login:${passkey.userId}`;
    const challengeData = this.challenges.get(challengeKey);
    if (!challengeData) throw new ValidationError('No login challenge found');

    this.challenges.delete(challengeKey);

    await prisma.passkey.update({
      where: { id: passkey.id },
      data: { counter: passkey.counter + BigInt(1) },
    });

    const session = await prisma.session.create({
      data: {
        userId: passkey.userId,
        token: generateToken(),
        refreshToken: generateToken(),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const user = passkey.user;
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

  async getUserPasskeys(userId: string) {
    return prisma.passkey.findMany({
      where: { userId },
      select: { id: true, deviceName: true, createdAt: true, backedUp: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePasskey(passkeyId: string, userId: string) {
    const passkey = await prisma.passkey.findFirst({ where: { id: passkeyId, userId } });
    if (!passkey) throw new NotFoundError('Passkey not found');
    await prisma.passkey.delete({ where: { id: passkeyId } });
  }
}

export const webauthnService = new WebAuthnService();
