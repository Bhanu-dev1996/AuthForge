import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateProfileSchema, changePasswordSchema, deleteAccountSchema } from './users.schema';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, usersController.getProfile);
usersRouter.patch('/me', authenticate, validate(updateProfileSchema), usersController.updateProfile);
usersRouter.patch('/me/password', authenticate, validate(changePasswordSchema), usersController.changePassword);
usersRouter.delete('/me', authenticate, validate(deleteAccountSchema), usersController.deleteAccount);
