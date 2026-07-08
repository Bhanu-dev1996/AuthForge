import { prisma } from '../../config/database';
import { tokenService } from '../../services/token.service';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { excludeFields } from '../../utils/helpers';
import { UpdateProfileInput, ChangePasswordInput, DeleteAccountInput } from './users.schema';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    return excludeFields(user, ['passwordHash']);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
    });
    return excludeFields(user, ['passwordHash']);
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new ValidationError('Cannot change password for OAuth-only accounts');

    const valid = await tokenService.comparePassword(input.currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError('Current password is incorrect');

    const passwordHash = await tokenService.hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async deleteAccount(userId: string, password?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    if (user.passwordHash && password) {
      const valid = await tokenService.comparePassword(password, user.passwordHash);
      if (!valid) throw new ValidationError('Password is incorrect');
    }

    await prisma.user.delete({ where: { id: userId } });
  }
}

export const usersService = new UsersService();
