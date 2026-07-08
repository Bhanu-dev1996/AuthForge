import { prisma } from '../../config/database';

export class SessionsService {
  async getUserSessions(userId: string, currentSessionId: string) {
    const sessions = await prisma.session.findMany({
      where: { userId, isRevoked: false, expiresAt: { gte: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        location: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(sessionId: string, userId: string) {
    await prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isRevoked: true },
    });
  }

  async getLoginHistory(userId: string, limit = 20) {
    return prisma.loginAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      take: limit,
    });
  }
}

export const sessionsService = new SessionsService();
