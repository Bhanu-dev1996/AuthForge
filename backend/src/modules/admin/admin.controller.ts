import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';

export class AdminController {
  listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const isBlocked = req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined;

      const result = await adminService.listUsers(page, limit, search, role, isBlocked);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminService.getUserDetails(req.params.id);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.updateUserRole(req.params.id, req.body.role);
      res.json({ status: 'success', data: { user } });
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.blockUser(req.params.id, req.body.reason);
      res.json({ status: 'success', message: 'User blocked' });
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await adminService.unblockUser(req.params.id);
      res.json({ status: 'success', message: 'User unblocked' });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await adminService.deleteUser(req.params.id);
      res.json({ status: 'success', message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await adminService.getAnalytics(req.query.from as string, req.query.to as string);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
