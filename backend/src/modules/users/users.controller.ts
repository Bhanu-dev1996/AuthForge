import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export class UsersController {
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await usersService.getProfile(req.user!.id);
      res.json({ status: 'success', data: { user } });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await usersService.updateProfile(req.user!.id, req.body);
      res.json({ status: 'success', data: { user } });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await usersService.changePassword(req.user!.id, req.body);
      res.json({ status: 'success', message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await usersService.deleteAccount(req.user!.id, req.body?.password);
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.json({ status: 'success', message: 'Account deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
