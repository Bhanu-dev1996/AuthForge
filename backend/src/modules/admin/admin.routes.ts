import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const roleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

const blockSchema = z.object({
  reason: z.string().optional(),
});

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('admin'));

adminRouter.get('/users', adminController.listUsers);
adminRouter.get('/users/:id', adminController.getUserDetails);
adminRouter.patch('/users/:id/role', validate(roleSchema), adminController.updateRole);
adminRouter.post('/users/:id/block', validate(blockSchema), adminController.blockUser);
adminRouter.post('/users/:id/unblock', adminController.unblockUser);
adminRouter.delete('/users/:id', adminController.deleteUser);
adminRouter.get('/analytics', adminController.getAnalytics);
