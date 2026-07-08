# Backend Implementation Guide

## Overview

The backend is built with **Node.js + Express.js + TypeScript** following a **modular layered architecture**. Each authentication feature is implemented as a self-contained module with its own routes, controller, service, and schema.

## Project Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Initial Setup

```bash
# Create backend directory
mkdir backend && cd backend

# Initialize project
npm init -y

# Install dependencies
npm install express cors helmet cookie-parser bcryptjs jsonwebtoken
npm install @prisma/client zod passport passport-google-oauth20 passport-github2
npm install nodemailer speakeasy qrcode @simplewebauthn/server uuid dotenv

# Install dev dependencies
npm install -D typescript @types/node @types/express @types/cors
npm install -D @types/cookie-parser @types/bcryptjs @types/jsonwebtoken
npm install -D @types/passport @types/nodemailer @types/uuid
npm install -D ts-node tsx prisma vitest supertest @types/supertest
```

## Application Structure

```
src/
├── config/
│   ├── env.ts              # Environment variables validation
│   ├── cors.ts             # CORS configuration
│   ├── passport.ts         # Passport strategies setup
│   └── database.ts         # Prisma client singleton
├── middleware/
│   ├── auth.middleware.ts   # JWT verification
│   ├── validate.middleware.ts # Zod validation
│   ├── rate-limit.middleware.ts
│   ├── error.middleware.ts  # Global error handler
│   └── admin.middleware.ts  # Admin role check
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.schema.ts
│   ├── oauth/
│   │   ├── oauth.controller.ts
│   │   ├── oauth.service.ts
│   │   ├── oauth.routes.ts
│   │   └── strategies/
│   ├── users/
│   ├── sessions/
│   ├── webauthn/
│   ├── mfa/
│   └── admin/
├── services/
│   ├── email.service.ts
│   ├── token.service.ts
│   └── audit.service.ts
├── utils/
│   ├── logger.ts
│   ├── errors.ts           # Custom error classes
│   └── helpers.ts
├── types/
│   └── express.d.ts         # Express type extensions
├── app.ts                   # Express application setup
└── server.ts                # HTTP server entry point
```

## Module Architecture

Each module follows a consistent pattern:

```
module/
├── module.controller.ts   # Request handling, response formatting
├── module.service.ts      # Business logic
├── module.routes.ts       # Route definitions
└── module.schema.ts       # Zod validation schemas
```

### Controller Pattern

```typescript
// auth.controller.ts
export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
      res.status(201).json({
        status: 'success',
        data: { user: result.user, accessToken: result.accessToken }
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### Service Pattern

```typescript
// auth.service.ts
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private tokenService: TokenService,
    private emailService: EmailService
  ) {}

  async register(data: RegisterInput): Promise<AuthResult> {
    // Validate business rules
    // Hash password
    // Create user
    // Generate tokens
    // Create session
    // Return result
  }
}
```

### Middleware Pattern

```typescript
// auth.middleware.ts
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new UnauthorizedError('No token provided');
  
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.isBlocked) throw new UnauthorizedError('Invalid token');
  
  req.user = user;
  next();
};
```

## Core Services

### Token Service

Handles JWT generation, verification, and refresh token rotation.

```typescript
export class TokenService {
  generateAccessToken(userId: string, role: string): string
  generateRefreshToken(userId: string, sessionId: string): string
  verifyAccessToken(token: string): TokenPayload
  verifyRefreshToken(token: string): TokenPayload
  rotateRefreshToken(oldToken: string): Promise<{ newToken: string, sessionId: string }>
}
```

### Email Service

Handles all email communications (verification, password reset, magic link, OTP).

```typescript
export class EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>
  sendPasswordResetEmail(email: string, token: string): Promise<void>
  sendMagicLinkEmail(email: string, token: string): Promise<void>
  sendOTPEmail(email: string, otp: string): Promise<void>
}
```

### Audit Service

Logs security events for analysis and monitoring.

```typescript
export class AuditService {
  logLoginAttempt(userId: string | null, email: string, ip: string, success: boolean): Promise<void>
  logSessionRevoked(userId: string, sessionId: string): Promise<void>
  logPasswordChange(userId: string): Promise<void>
  logMFAAction(userId: string, action: string): Promise<void>
}
```

## Error Handling

Custom error classes with consistent structure:

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) { super(message); }
}

export class ValidationError extends AppError { /* 400 */ }
export class UnauthorizedError extends AppError { /* 401 */ }
export class ForbiddenError extends AppError { /* 403 */ }
export class NotFoundError extends AppError { /* 404 */ }
export class ConflictError extends AppError { /* 409 */ }
export class RateLimitError extends AppError { /* 429 */ }
```

Global error handler middleware catches all errors and returns consistent JSON responses.

## Validation

All request inputs are validated using Zod schemas:

```typescript
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
    name: z.string().min(1).max(100),
  }),
});
```

## Rate Limiting

Rate limiting is applied at multiple levels:

- **Global:** 100 requests per minute per IP
- **Auth endpoints:** 10 requests per minute per IP
- **Login:** 5 attempts per 15 minutes per email/IP
- **Registration:** 3 attempts per hour per IP
- **Password reset:** 3 attempts per hour per email
- **Magic link:** 3 requests per hour per email
- **OTP:** 3 requests per hour per email, 5 failed verifications

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/authforge

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/oauth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/oauth/github/callback

# Email
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@authforge.com

# Frontend
FRONTEND_URL=http://localhost:5173

# Redis (optional, for rate limiting)
REDIS_URL=redis://localhost:6379
```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "vitest",
    "test:integration": "vitest --config vitest.integration.config.ts",
    "lint": "eslint src/"
  }
}
```
