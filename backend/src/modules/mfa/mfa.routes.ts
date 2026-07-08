import { Router } from 'express';
import { mfaController } from './mfa.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { z } from 'zod';

const mfaCodeSchema = z.object({
  code: z.string().length(6),
});

const mfaChallengeSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
});

export const mfaRouter = Router();

mfaRouter.post('/setup', authenticate, mfaController.setup);
mfaRouter.post('/verify', authenticate, validate(mfaCodeSchema), mfaController.verify);
mfaRouter.post('/disable', authenticate, validate(mfaCodeSchema), mfaController.disable);
mfaRouter.post('/verify-challenge', validate(mfaChallengeSchema), mfaController.verifyChallenge);
mfaRouter.get('/status', authenticate, mfaController.status);
