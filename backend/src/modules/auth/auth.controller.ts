import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body, req.ip || '', req.headers['user-agent']);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.status(201).json({
        status: 'success',
        data: { user: result.user, accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body, req.ip || '', req.headers['user-agent']);
      if ('mfaRequired' in result) {
        res.json({
          status: 'success',
          data: { mfaRequired: true, userId: result.userId },
        });
        return;
      }
      res.cookie('refreshToken', result.result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        status: 'success',
        data: { user: result.result.user, accessToken: result.result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ status: 'error', error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
        return;
      }
      const tokens = await authService.refresh(refreshToken);
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({ status: 'success', data: { accessToken: tokens.accessToken } });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.sessionId && req.user) {
        await authService.logout(req.sessionId, req.user.id);
      }
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  logoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await authService.logout(req.params.sessionId, req.user.id);
      }
      res.json({ status: 'success', message: 'Session revoked' });
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await authService.logoutAll(req.user.id, req.sessionId);
      }
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.json({ status: 'success', message: 'All other sessions revoked' });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.forgotPassword(req.body.email);
      res.json({ status: 'success', message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.resetPassword(req.body);
      res.json({ status: 'success', message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.verifyEmail(req.body.token);
      res.json({ status: 'success', message: 'Email verified successfully' });
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await authService.resendVerification(req.user.id, req.user.email);
      }
      res.json({ status: 'success', message: 'Verification email sent' });
    } catch (error) {
      next(error);
    }
  };

  sendMagicLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.sendMagicLink(req.body.email);
      res.json({ status: 'success', message: 'If the email exists, a magic link has been sent' });
    } catch (error) {
      next(error);
    }
  };

  verifyMagicLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyMagicLink(req.body.token, req.ip || '', req.headers['user-agent']);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        status: 'success',
        data: { user: result.user, accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  sendOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.sendOTP(req.body.email);
      res.json({ status: 'success', message: 'If the email exists, an OTP has been sent' });
    } catch (error) {
      next(error);
    }
  };

  verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyOTP(req.body.email, req.body.otp, req.ip || '', req.headers['user-agent']);
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      res.json({
        status: 'success',
        data: { user: result.user, accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
