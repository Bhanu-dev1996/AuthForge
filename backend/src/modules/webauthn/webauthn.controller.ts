import { Request, Response, NextFunction } from 'express';
import { webauthnService } from './webauthn.service';
import { env } from '../../config/env';

export class WebAuthnController {
  beginRegister = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const options = await webauthnService.beginRegistration(req.user!.id);
      res.json({ status: 'success', data: options });
    } catch (error) {
      next(error);
    }
  };

  completeRegister = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await webauthnService.completeRegistration(req.user!.id, req.body.credential);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  beginLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const options = await webauthnService.beginLogin(req.body.email);
      res.json({ status: 'success', data: options });
    } catch (error) {
      next(error);
    }
  };

  completeLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await webauthnService.completeLogin(req.body.credential, req.ip || '', req.headers['user-agent']);
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

  listCredentials = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials = await webauthnService.getUserPasskeys(req.user!.id);
      res.json({ status: 'success', data: { credentials } });
    } catch (error) {
      next(error);
    }
  };

  deleteCredential = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await webauthnService.deletePasskey(req.params.id, req.user!.id);
      res.json({ status: 'success', message: 'Credential deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const webauthnController = new WebAuthnController();
