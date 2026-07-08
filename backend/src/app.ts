import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsConfig } from './config/cors';
import { globalRateLimit } from './middleware/rate-limit.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { sessionsRouter } from './modules/sessions/sessions.routes';
import { oauthRouter } from './modules/oauth/oauth.routes';
import { webauthnRouter } from './modules/webauthn/webauthn.routes';
import { mfaRouter } from './modules/mfa/mfa.routes';
import { adminRouter } from './modules/admin/admin.routes';

const app = express();

app.use(helmet());
app.use(cors(corsConfig));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(globalRateLimit);
app.use(requestLogger);

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'success', data: { uptime: process.uptime(), timestamp: new Date().toISOString() } });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/oauth', oauthRouter);
app.use('/api/v1/webauthn', webauthnRouter);
app.use('/api/v1/mfa', mfaRouter);
app.use('/api/v1/admin', adminRouter);

app.use(errorHandler);

export { app };
