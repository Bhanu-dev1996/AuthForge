import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  emailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyOTPSchema,
} from './auth.schema';
import { authRateLimit, loginRateLimit, emailRateLimit } from '../../middleware/rate-limit.middleware';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, validate(registerSchema), authController.register);
authRouter.post('/login', loginRateLimit, validate(loginSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authenticate, authController.logout);
authRouter.post('/logout-session/:sessionId', authenticate, authController.logoutSession);
authRouter.post('/logout-all', authenticate, authController.logoutAll);

authRouter.post('/forgot-password', emailRateLimit, validate(emailSchema), authController.forgotPassword);
authRouter.post('/reset-password', emailRateLimit, validate(resetPasswordSchema), authController.resetPassword);

authRouter.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
authRouter.post('/resend-verification', authenticate, authController.resendVerification);

authRouter.post('/magic-link', emailRateLimit, validate(emailSchema), authController.sendMagicLink);
authRouter.post('/magic-link/verify', authController.verifyMagicLink);

authRouter.post('/otp/send', emailRateLimit, validate(emailSchema), authController.sendOTP);
authRouter.post('/otp/verify', authRateLimit, validate(verifyOTPSchema), authController.verifyOTP);
