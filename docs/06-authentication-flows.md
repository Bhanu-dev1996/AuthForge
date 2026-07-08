# Authentication Flows

## Overview

This document describes all authentication flows implemented in AuthForge. Each flow includes the step-by-step process, security considerations, and implementation details.

---

## 1. Email + Password Authentication

### Registration Flow

```
User → Frontend → POST /auth/register → Backend → Database
```

**Step-by-step:**

1. User fills registration form (email, password, name)
2. Frontend validates input using Zod schema
3. Frontend sends `POST /auth/register` with credentials
4. Backend validates request body
5. Backend checks if email already exists
6. Backend hashes password with bcrypt (cost factor 12)
7. Backend creates user record in database
8. Backend generates access token (JWT, 15 min expiry)
9. Backend generates refresh token (JWT, 7 day expiry)
10. Backend creates session record
11. Backend returns user data + access token (body) + refresh token (HTTP-only cookie)
12. Frontend stores access token in memory
13. User is redirected to dashboard

**Security considerations:**
- Password must meet strength requirements (min 8 chars, uppercase, lowercase, number, special char)
- Rate limit registration attempts per IP
- Email verification required before full access

### Login Flow

```
User → Frontend → POST /auth/login → Backend → Database
```

**Step-by-step:**

1. User fills login form (email, password)
2. Frontend validates input
3. Frontend sends `POST /auth/login`
4. Backend looks up user by email
5. Backend checks if account is blocked or locked
6. Backend verifies password with bcrypt
7. Backend checks if email is verified
8. Backend generates access token + refresh token
9. Backend creates session record
10. Backend records successful login attempt
11. Frontend receives tokens and redirects to dashboard

**Error scenarios:**
- Invalid email: return generic "Invalid credentials" (don't reveal if email exists)
- Too many failed attempts: temporarily lock account
- Email not verified: return specific error, offer resend verification

### Token Refresh Flow

```
Client → POST /auth/refresh → Backend → Database
```

**Step-by-step:**

1. Access token expires (401 response from API)
2. Frontend interceptor catches 401
3. Frontend calls `POST /auth/refresh` with refresh token cookie
4. Backend validates refresh token signature
5. Backend looks up session by refresh token hash
6. Backend checks if session is revoked or expired
7. Backend generates new access token + new refresh token (rotation)
8. Backend updates session with new refresh token hash
9. Old refresh token is invalidated (rotation)
10. If old refresh token is used after rotation → potential theft → revoke all sessions

### Logout Flow

```
User → Frontend → POST /auth/logout → Backend → Database
```

**Step-by-step:**

1. User clicks logout
2. Frontend sends `POST /auth/logout`
3. Backend revokes the current session
4. Backend clears refresh token cookie
5. Frontend clears access token from memory
6. User is redirected to login page

---

## 2. OAuth Authentication (Google / GitHub)

### OAuth Login Flow

```
User → Frontend → GET /oauth/{provider} → Provider → Callback → Backend → Database → Frontend
```

**Step-by-step:**

1. User clicks "Continue with Google/GitHub"
2. Frontend redirects to `GET /oauth/{provider}` with a `redirectUrl` parameter
3. Backend generates state parameter (anti-CSRF) and stores it temporarily
4. Backend redirects user to provider's OAuth consent screen
5. User authenticates with provider and grants permissions
6. Provider redirects to callback URL with `code` and `state`
7. Backend validates `state` parameter
8. Backend exchanges `code` for access token with provider
9. Backend fetches user profile from provider
10. Backend checks if provider account is already linked to a user
11. If new user:
    - Create user record (passwordHash = null)
    - Create oauth_account record
12. If existing user:
    - Update oauth tokens
13. Backend generates JWT access token + refresh token
14. Backend creates session
15. Backend redirects to frontend with tokens in URL fragment
16. Frontend parses tokens from URL and stores them

**Account linking:**
- If a user with the same email already exists (email-password account), link the OAuth account
- If the OAuth account was previously linked, log in directly
- Users can link multiple OAuth providers to the same account

---

## 3. Email Verification Flow

```
User → Register → Backend sends email → User clicks link → Backend verifies → Email verified
```

**Step-by-step:**

1. User registers with email + password
2. Backend creates user (emailVerified = null)
3. Backend generates verification token (crypto.randomBytes)
4. Backend stores hashed token in email_verification_tokens table
5. Backend sends email with verification link: `https://app.authforge.com/verify-email?token=xxx`
6. User clicks link in email
7. Frontend sends `POST /auth/verify-email` with the token
8. Backend looks up token (hashed) in database
9. Backend checks if token is expired
10. Backend sets emailVerified = now()
11. Backend marks token as used
12. Frontend shows success message

**Resend flow:**
1. User requests resend
2. Backend invalidates previous tokens for this user
3. Backend generates new token and sends new email

---

## 4. Password Reset Flow

```
User → Forgot Password → Backend sends email → User clicks link → New password → Success
```

**Step-by-step:**

1. User clicks "Forgot Password"
2. User enters email address
3. Frontend sends `POST /auth/forgot-password`
4. Backend looks up user by email (always return success, even if email not found - prevent enumeration)
5. Backend generates reset token (crypto.randomBytes)
6. Backend stores hashed token in password_reset_tokens table (15 min expiry)
7. Backend sends email with reset link: `https://app.authforge.com/reset-password?token=xxx`
8. User clicks link in email
9. Frontend shows new password form
10. User enters new password
11. Frontend sends `POST /auth/reset-password` with token + new password
12. Backend validates token
13. Backend hashes new password
14. Backend updates user password
15. Backend marks token as used
16. Backend revokes all sessions (force re-login)
17. Frontend redirects to login page with success message

---

## 5. Magic Link Authentication

```
User → Enter Email → Backend sends magic link → User clicks link → Authenticated
```

**Step-by-step:**

1. User enters email on magic link login page
2. Frontend sends `POST /auth/magic-link`
3. Backend looks up user by email
4. Backend generates magic link token (crypto.randomBytes, 10 min expiry)
5. Backend stores hashed token in database
6. Backend sends email with magic link: `https://app.authforge.com/auth/magic-link?token=xxx`
7. User clicks link in email
8. Frontend sends `POST /auth/magic-link/verify` with the token
9. Backend validates token
10. Backend marks token as used
11. Backend generates JWT access token + refresh token
12. Frontend stores tokens and redirects to dashboard

**Security considerations:**
- Tokens are single-use
- Tokens expire after 10 minutes
- Always return success (don't reveal if email exists)
- Rate limit: max 3 magic link requests per email per hour

---

## 6. Email OTP Authentication

```
User → Enter Email → Backend sends OTP → User enters OTP → Authenticated
```

**Step-by-step:**

1. User enters email on OTP login page
2. Frontend sends `POST /auth/otp/send`
3. Backend generates 6-digit OTP (crypto.randomInt)
4. Backend stores OTP hash in database (5 min expiry)
5. Backend sends email with OTP code
6. User enters OTP code in frontend
7. Frontend sends `POST /auth/otp/verify` with email + OTP
8. Backend looks up OTP by email
9. Backend verifies OTP hash
10. Backend checks if OTP is expired
11. Backend generates JWT access token + refresh token
12. Frontend stores tokens and redirects to dashboard

**Security considerations:**
- OTP is single-use
- OTP expires after 5 minutes
- Rate limit: max 3 OTP requests per email per hour
- Max 5 failed OTP attempts before temporary lockout

---

## 7. Passkeys (WebAuthn) Authentication

### Registration Flow

```
User → Frontend → POST /webauthn/register/begin → Backend → Challenge → Frontend → Browser WebAuthn API → POST /webauthn/register/complete → Backend → Database
```

**Step-by-step:**

1. User chooses to register a passkey
2. Frontend sends `POST /webauthn/register/begin`
3. Backend generates challenge + user ID + relying party info
4. Backend stores challenge temporarily (in memory or DB)
5. Frontend calls `navigator.credentials.create()` with challenge
6. Browser shows OS dialog (Touch ID, Windows Hello, etc.)
7. User authenticates (fingerprint, face, PIN)
8. Browser returns credential (attestation object)
9. Frontend sends `POST /webauthn/register/complete` with credential
10. Backend verifies attestation
11. Backend stores credential public key in passkeys table
12. Passkey is registered

### Authentication Flow

```
User → Frontend → POST /webauthn/login/begin → Backend → Challenge → Frontend → Browser WebAuthn API → POST /webauthn/login/complete → Backend → Database → Authenticated
```

**Step-by-step:**

1. User enters email on login page
2. Frontend sends `POST /webauthn/login/begin`
3. Backend looks up user's passkeys
4. Backend generates challenge + allowCredentials from user's passkeys
5. Backend stores challenge temporarily
6. Frontend calls `navigator.credentials.get()` with challenge
7. Browser shows OS dialog
8. User authenticates (fingerprint, face, PIN)
9. Browser returns assertion
10. Frontend sends `POST /webauthn/login/complete` with assertion
11. Backend verifies signature using stored public key
12. Backend increments counter
13. Backend generates JWT access token + refresh token
14. Frontend stores tokens and redirects to dashboard

---

## 8. Multi-Factor Authentication (TOTP)

### Setup Flow

```
User → Dashboard → POST /mfa/setup → Backend → Secret + QR → User scans in Authenticator App → POST /mfa/verify → Enabled
```

**Step-by-step:**

1. User goes to Security settings
2. User clicks "Enable MFA"
3. Frontend sends `POST /mfa/setup`
4. Backend generates TOTP secret (speakeasy)
5. Backend generates QR code URI (otpauth://)
6. Backend stores secret temporarily (not enabled yet)
7. Frontend displays QR code and backup codes
8. User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
9. User enters 6-digit code from app
10. Frontend sends `POST /mfa/verify` with code
11. Backend verifies TOTP code
12. Backend enables MFA method (enabled = true)
13. Backup codes are shown (user should save them)

### Login with MFA Flow

```
User → Login → Backend detects MFA enabled → Response: mfaRequired → User enters TOTP code → POST /mfa/verify-challenge → Tokens
```

**Step-by-step:**

1. User logs in with email + password (or OAuth)
2. Backend detects user has MFA enabled
3. Backend returns `MFA_REQUIRED` error (don't issue tokens yet)
4. Frontend shows MFA challenge screen
5. User enters 6-digit code from authenticator app
6. Frontend sends `POST /mfa/verify-challenge` with userId + code
7. Backend verifies TOTP code
8. Backend generates JWT access token + refresh token
9. Frontend stores tokens and redirects to dashboard

---

## Summary Table

| Flow | Security Level | User Experience | Implementation Complexity |
|------|---------------|-----------------|--------------------------|
| Email + Password | Medium | Standard | Low |
| OAuth | High | Excellent | Medium |
| Email Verification | Medium | Good | Low |
| Password Reset | Medium | Good | Low |
| Magic Link | High | Excellent | Low |
| Email OTP | Medium | Good | Low |
| Passkeys (WebAuthn) | Very High | Excellent | High |
| TOTP MFA | Very High | Good | Medium |
