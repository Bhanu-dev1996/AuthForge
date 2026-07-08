import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { TokenPayload } from '../types';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.substring(7);
  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  if (user.isBlocked) {
    throw new ForbiddenError('Account is blocked');
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
  };
  req.sessionId = payload.sessionId;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    prisma.user.findUnique({ where: { id: payload.userId } }).then((user) => {
      if (user && !user.isBlocked) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        };
        req.sessionId = payload.sessionId;
      }
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
