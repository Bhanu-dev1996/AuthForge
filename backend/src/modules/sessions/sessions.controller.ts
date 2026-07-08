import { Request, Response, NextFunction } from 'express';
import { sessionsService } from './sessions.service';

export class SessionsController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await sessionsService.getUserSessions(req.user!.id, req.sessionId!);
      res.json({ status: 'success', data: { sessions } });
    } catch (error) {
      next(error);
    }
  };

  revoke = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await sessionsService.revokeSession(req.params.id, req.user!.id);
      res.json({ status: 'success', message: 'Session revoked' });
    } catch (error) {
      next(error);
    }
  };

  loginHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await sessionsService.getLoginHistory(req.user!.id);
      res.json({ status: 'success', data: { history } });
    } catch (error) {
      next(error);
    }
  };
}

export const sessionsController = new SessionsController();
