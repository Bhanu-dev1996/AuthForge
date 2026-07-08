import { Request, Response, NextFunction } from 'express';
import { mfaService } from './mfa.service';
import { env } from '../../config/env';

export class MFAController {
  setup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await mfaService.setupMFA(req.user!.id);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await mfaService.verifyAndEnable(req.user!.id, req.body.code);
      res.json({ status: 'success', message: 'MFA enabled successfully' });
    } catch (error) {
      next(error);
    }
  };

  disable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await mfaService.disableMFA(req.user!.id, req.body.code);
      res.json({ status: 'success', message: 'MFA disabled' });
    } catch (error) {
      next(error);
    }
  };

  verifyChallenge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await mfaService.verifyChallenge(req.body.userId, req.body.code, req.ip || '', req.headers['user-agent']);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ status: 'success', data: { user: result.user, accessToken: result.accessToken } });
    } catch (error) {
      next(error);
    }
  };

  status = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await mfaService.getStatus(req.user!.id);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };
}

export const mfaController = new MFAController();
