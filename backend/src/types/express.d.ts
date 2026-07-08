import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        emailVerified: Date | null;
      };
      sessionId?: string;
    }
  }
}
