import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { TokenPayload, RefreshTokenPayload, AuthTokens } from '../types';

export class TokenService {
  generateAccessToken(userId: string, role: string, sessionId: string): string {
    return jwt.sign({ userId, role, sessionId }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign({ userId, sessionId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  }

  generateTokens(userId: string, role: string, sessionId: string): AuthTokens {
    return {
      accessToken: this.generateAccessToken(userId, role, sessionId),
      refreshToken: this.generateRefreshToken(userId, sessionId),
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const tokenService = new TokenService();
