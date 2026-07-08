import { Router } from 'express';
import { webauthnController } from './webauthn.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { emailSchema } from '../auth/auth.schema';

export const webauthnRouter = Router();

webauthnRouter.post('/register/begin', authenticate, webauthnController.beginRegister);
webauthnRouter.post('/register/complete', authenticate, webauthnController.completeRegister);
webauthnRouter.post('/login/begin', validate(emailSchema), webauthnController.beginLogin);
webauthnRouter.post('/login/complete', webauthnController.completeLogin);
webauthnRouter.get('/credentials', authenticate, webauthnController.listCredentials);
webauthnRouter.delete('/credentials/:id', authenticate, webauthnController.deleteCredential);
