import { Router } from 'express';
import passport from 'passport';
import { env } from '../../config/env';
import { generateToken } from '../../utils/helpers';
import { prisma } from '../../config/database';
import { tokenService } from '../../services/token.service';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function handleOAuthProfile(profile: any, provider: string, ipAddress: string, userAgent: string | undefined) {
  const providerEmail = profile.emails?.[0]?.value || '';
  const providerAccountId = profile.id;

  let oauthAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  });

  if (oauthAccount) {
    const user = oauthAccount.user;
    if (user.isBlocked) return null;

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: generateToken(),
        refreshToken: generateToken(),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = tokenService.generateTokens(user.id, user.role, session.id);
    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  let user = providerEmail ? await prisma.user.findUnique({ where: { email: providerEmail } }) : null;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: providerEmail,
        name: profile.displayName || profile.username,
        image: profile.photos?.[0]?.value,
        emailVerified: new Date(),
      },
    });
  }

  await prisma.oAuthAccount.create({
    data: {
      userId: user.id,
      provider,
      providerAccountId,
      providerEmail,
      accessToken: profile.accessToken,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: generateToken(),
      refreshToken: generateToken(),
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const tokens = tokenService.generateTokens(user.id, user.role, session.id);
  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy({
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
  }, async (req: any, _accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const result = await handleOAuthProfile(profile, 'google', req.ip || '', req.headers['user-agent']);
      done(null, result);
    } catch (error) {
      done(error as Error);
    }
  }));
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  const GitHubStrategy = require('passport-github2').Strategy;
  passport.use(new GitHubStrategy({
    clientID: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    callbackURL: env.GITHUB_CALLBACK_URL,
    passReqToCallback: true,
  }, async (req: any, _accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const result = await handleOAuthProfile(profile, 'github', req.ip || '', req.headers['user-agent']);
      done(null, result);
    } catch (error) {
      done(error as Error);
    }
  }));
}

router.get('/google', (req, res, next) => {
  const state = generateToken(32);
  const redirectUrl = req.query.redirectUrl as string || env.FRONTEND_URL;
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
  res.cookie('oauth_redirect', redirectUrl, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
  passport.authenticate('google', { scope: ['profile', 'email'], state })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed` }, (err: any, result: any) => {
    if (err || !result) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    const redirectUrl = req.cookies?.oauth_redirect || env.FRONTEND_URL;
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_redirect');
    res.redirect(`${redirectUrl}?access_token=${result.accessToken}`);
  })(req, res, next);
});

router.get('/github', (req, res, next) => {
  const state = generateToken(32);
  const redirectUrl = req.query.redirectUrl as string || env.FRONTEND_URL;
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
  res.cookie('oauth_redirect', redirectUrl, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
  passport.authenticate('github', { scope: ['user:email'], state })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed` }, (err: any, result: any) => {
    if (err || !result) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());
    const redirectUrl = req.cookies?.oauth_redirect || env.FRONTEND_URL;
    res.clearCookie('oauth_state');
    res.clearCookie('oauth_redirect');
    res.redirect(`${redirectUrl}?access_token=${result.accessToken}`);
  })(req, res, next);
});

export { router as oauthRouter };
