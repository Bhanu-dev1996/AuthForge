# Security Guide

## Overview

Security is the foundation of AuthForge. This document outlines all security measures implemented in the platform, following OWASP best practices and industry standards.

## Password Security

### Hashing

- **Algorithm:** bcrypt
- **Cost factor:** 12 (takes ~250ms per hash)
- **Salt:** Automatic (bcrypt generates unique salt per hash)
- **Implementation:** `bcryptjs` library

```typescript
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);
```

### Password Policy

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Maximum 128 characters
- Common password blacklist (optional)
- Password history (prevent reuse of last 5 passwords)

## JWT Security

### Token Structure

**Access Token:**
- Short-lived: 15 minutes
- Contains: userId, role, sessionId
- Signed with HS256 or RS256
- Transmitted via Authorization header (Bearer token)
- Never stored in localStorage (kept in memory)

**Refresh Token:**
- Long-lived: 7 days
- Contains: userId, sessionId, tokenVersion
- Signed with separate secret
- Transmitted via HTTP-only, Secure, SameSite cookie
- Rotated on each use

### Token Rotation

```
Each refresh token can be used exactly once.
When a new access token is requested:

1. Old refresh token is validated
2. New refresh token is issued
3. Old refresh token is invalidated
4. If an old, already-rotated token is used → token theft detected
5. All sessions for the user are revoked
```

### Signature Verification

- Tokens are verified on every request
- Invalid signature → 401 Unauthorized
- Expired token → 401 with TOKEN_EXPIRED code
- Revoked session → 401 UNAUTHORIZED

## Secure Headers

Using Helmet middleware to set security-related HTTP headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Restricted | Prevent XSS and data injection |
| `X-Content-Type-Options` | nosniff | Prevent MIME type sniffing |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-XSS-Protection` | 0 | Disable legacy XSS filter |
| `Strict-Transport-Security` | max-age=31536000 | Enforce HTTPS |
| `Referrer-Policy` | strict-origin-when-cross-origin | Control referrer header |
| `Permissions-Policy` | Restricted | Limit browser features |

## CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Only allow frontend origin
  credentials: true,               // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,                   // Preflight cache (24 hours)
};
```

## Rate Limiting

### Global Rate Limiting
- 100 requests per minute per IP
- Applies to all endpoints

### Endpoint-Specific Rate Limiting

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| POST /auth/login | 5 attempts | 15 minutes | Per email/IP |
| POST /auth/register | 3 attempts | 1 hour | Per IP |
| POST /auth/forgot-password | 3 attempts | 1 hour | Per email |
| POST /auth/magic-link | 3 attempts | 1 hour | Per email |
| POST /auth/otp/send | 3 attempts | 1 hour | Per email |
| POST /auth/otp/verify | 5 attempts | 15 minutes | Per IP |
| POST /auth/verify-email | 3 attempts | 1 hour | Per IP |
| POST /auth/refresh | 10 attempts | 15 minutes | Per IP |

### Implementation

Rate limiting is implemented using:
- **In-memory store** for development
- **Redis** for production (distributed rate limiting)

```typescript
// Rate limiting uses a sliding window algorithm
// Each IP/identifier has a counter with TTL
// When limit is exceeded, 429 Too Many Requests is returned
```

## Account Locking

Failed login attempts are tracked per email:

- **3 failed attempts:** No lockout, but delay increases
- **5 failed attempts:** 15-minute lockout
- **10 failed attempts:** 1-hour lockout
- **15+ failed attempts:** Account blocked until manual review

Locked accounts return `ACCOUNT_LOCKED` error during login.

## Input Validation

All user inputs are validated using Zod schemas:

- **String trimming and sanitization**
- **Email format validation**
- **Password strength validation**
- **UUID format validation (for IDs)**
- **Enum validation (roles, providers)**
- **Length limits on all string fields**
- **No raw HTML/script tags allowed**

## SQL Injection Protection

- Prisma ORM uses parameterized queries exclusively
- No raw SQL queries in application code
- User input is never concatenated into queries

## XSS Protection

- Helmet sets `X-XSS-Protection` header
- Output encoding for dynamic content
- CSP header restricts script sources
- React handles output encoding by default (JSX)
- No `dangerouslySetInnerHTML` usage

## CSRF Protection

Since AuthForge uses:
- **Authorization header** for access tokens (Bearer scheme)
- **HTTP-only cookies** for refresh tokens (not accessible via JS)

CSRF protection is inherent because:
- Cookies are not used for API authentication
- CORS is restricted to the frontend origin
- SameSite=Lax on all cookies prevents cross-site requests

If cookie-based authentication is used, implement CSRF tokens.

## Cookie Security

```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // Only sent over HTTPS
  sameSite: 'strict',  // Prevent CSRF
  path: '/api/v1/auth', // Restrict cookie path
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

## OAuth Security

- **State parameter:** Random state generated per request, validated on callback (prevents CSRF)
- **PKCE** (Proof Key for Code Exchange) for additional security
- **Scope restriction:** Request only necessary permissions
- **Redirect URI validation:** Only allow configured callback URLs

## Environment Variables

- All secrets stored in environment variables
- `.env` file in development (never committed to git)
- Environment variables validated at startup using Zod
- Missing required variables cause application to fail on startup

## Security Headers Checklist

- [x] Content Security Policy (CSP)
- [x] X-Content-Type-Options
- [x] X-Frame-Options
- [x] X-XSS-Protection
- [x] Strict-Transport-Security (HSTS)
- [x] Referrer-Policy
- [x] Permissions-Policy
- [x] CORS headers

## Security Best Practices Checklist

- [x] Password hashing with bcrypt
- [x] Short-lived JWT access tokens
- [x] Refresh token rotation
- [x] Rate limiting on auth endpoints
- [x] Account lockout on failed attempts
- [x] Input validation on all endpoints
- [x] SQL injection protection (parameterized queries)
- [x] XSS protection (Helmet + React)
- [x] Secure cookie configuration
- [x] HTTPS enforcement
- [x] CORS restriction
- [x] Environment variable validation
- [x] Error messages without sensitive info
- [x] Logging of security events
- [x] Email verification requirement
- [x] Password strength policy
- [x] Token expiration and rotation
- [x] Session management
- [x] OAuth state parameter validation
- [x] MFA support for enhanced security

## Incident Response

In case of a security incident:

1. **Detection:** Monitor logs for unusual patterns (failed logins, token reuse)
2. **Containment:** Block affected users/sessions immediately
3. **Analysis:** Investigate logs to determine scope
4. **Remediation:** Rotate secrets, notify affected users
5. **Prevention:** Update security measures to prevent recurrence
