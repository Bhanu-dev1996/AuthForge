import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { PaginatedResult } from '../../types';

export class AdminService {
  async listUsers(page: number, limit: number, search?: string, role?: string, isBlocked?: boolean) {
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (isBlocked !== undefined) where.isBlocked = isBlocked;

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        image: true,
        role: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundError('User not found');

    const [sessions, oauthAccounts, passkeys, mfaMethods, loginAttempts] = await Promise.all([
      prisma.session.findMany({ where: { userId }, orderBy: { lastUsedAt: 'desc' }, take: 20 }),
      prisma.oAuthAccount.findMany({ where: { userId } }),
      prisma.passkey.findMany({ where: { userId } }),
      prisma.mFAMethod.findMany({ where: { userId } }),
      prisma.loginAttempt.findMany({ where: { userId }, orderBy: { attemptedAt: 'desc' }, take: 50 }),
    ]);

    return { user, sessions, oauthAccounts, passkeys, mfaMethods, loginAttempts };
  }

  async updateUserRole(userId: string, role: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    return prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  }

  async blockUser(userId: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true, blockedAt: new Date(), blockedReason: reason },
    });
  }

  async unblockUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false, blockedAt: null, blockedReason: null, lockedUntil: null },
    });
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    await prisma.user.delete({ where: { id: userId } });
  }

  async getAnalytics(from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const [totalUsers, activeUsers, totalLogins, failedLogins, usersByRole, recentLogins, loginsByProvider] =
      await Promise.all([
        prisma.user.count(),
        prisma.session.count({ where: { isRevoked: false, expiresAt: { gte: new Date() } } }),
        prisma.loginAttempt.count({ where: { attemptedAt: { gte: fromDate, lte: toDate } } }),
        prisma.loginAttempt.count({ where: { success: false, attemptedAt: { gte: fromDate, lte: toDate } } }),
        prisma.user.groupBy({ by: ['role'], _count: true }),
        (async () => {
          const logs = await prisma.loginAttempt.findMany({
            where: { attemptedAt: { gte: fromDate, lte: toDate } },
            orderBy: { attemptedAt: 'asc' },
            select: { attemptedAt: true, success: true },
          });
          const byDay: Record<string, { total: number; failed: number }> = {};
          for (const log of logs) {
            const day = log.attemptedAt.toISOString().split('T')[0];
            if (!byDay[day]) byDay[day] = { total: 0, failed: 0 };
            byDay[day].total++;
            if (!log.success) byDay[day].failed++;
          }
          return byDay;
        })(),
        prisma.oAuthAccount.groupBy({ by: ['provider'], _count: true }),
      ]);

    return {
      totalUsers,
      activeUsers,
      totalLogins,
      failedLogins,
      usersByRole: usersByRole.reduce((acc: any, r) => {
        acc[r.role] = r._count;
        return acc;
      }, {}),
      loginsByDay: recentLogins,
      loginsByProvider: loginsByProvider.reduce((acc: any, p) => {
        acc[p.provider] = p._count;
        return acc;
      }, { email: totalLogins - loginsByProvider.reduce((s: number, p: any) => s + Number(p._count), 0) }),
    };
  }
}

export const adminService = new AdminService();
