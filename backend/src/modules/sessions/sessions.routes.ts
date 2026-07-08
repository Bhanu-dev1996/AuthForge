import { Router } from 'express';
import { sessionsController } from './sessions.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const sessionsRouter = Router();

sessionsRouter.get('/', authenticate, sessionsController.list);
sessionsRouter.get('/login-history', authenticate, sessionsController.loginHistory);
sessionsRouter.delete('/:id', authenticate, sessionsController.revoke);
