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

export interface TokenPayload {
  userId: string;
  sessionId: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
    emailVerified: Date | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
