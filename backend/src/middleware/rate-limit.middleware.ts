import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts' },
  },
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    status: 'error',
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts' },
  },
});

export const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
});
