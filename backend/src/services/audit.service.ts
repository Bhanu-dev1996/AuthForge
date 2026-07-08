import { prisma } from '../config/database';
import { logger } from '../utils/logger';

class AuditService {
  async logLoginAttempt(
    userId: string | null,
    email: string | null,
    ipAddress: string,
    userAgent: string | undefined,
    success: boolean
  ) {
    try {
      await prisma.loginAttempt.create({
        data: { userId, email, ipAddress, userAgent, success },
      });
    } catch (error) {
      logger.error('Failed to log login attempt', error);
    }
  }

  async getRecentFailedAttempts(email: string, windowMinutes = 15): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return prisma.loginAttempt.count({
      where: { email, success: false, attemptedAt: { gte: since } },
    });
  }

  async getRecentFailedAttemptsByIp(ipAddress: string, windowMinutes = 15): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return prisma.loginAttempt.count({
      where: { ipAddress, success: false, attemptedAt: { gte: since } },
    });
  }
}

export const auditService = new AuditService();
