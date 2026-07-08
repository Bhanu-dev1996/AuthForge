# API Specification

## Overview

The AuthForge API is a RESTful JSON API. All endpoints are prefixed with `/api/v1`. Authentication is primarily done via JWT access tokens in the `Authorization` header, with refresh tokens in HTTP-only cookies.

## Base URL

**Development:** `http://localhost:4000/api/v1`
**Production:** `https://api.authforge.com/api/v1`

## Authentication

Most endpoints require authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": [ ... ]
  }
}
```

## Endpoints

### Authentication

#### POST /auth/register

Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe", "role": "user" },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

#### POST /auth/login

Authenticate with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe", "role": "user" },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

#### POST /auth/logout

Revoke the current session.

**Headers:** `Authorization: Bearer <access_token>`
**Cookies:** `refreshToken=...`

**Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

#### POST /auth/refresh

Refresh the access token using a refresh token.

**Cookies:** `refreshToken=...`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

#### POST /auth/logout-session/:sessionId

Logout a specific session.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "Session revoked"
}
```

#### POST /auth/logout-all

Logout all sessions for the current user.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "All sessions revoked"
}
```

### OAuth

#### GET /oauth/google

Redirect to Google OAuth consent screen.

**Query Parameters:**
- `redirectUrl` - URL to redirect after successful authentication

**Response (302):** Redirect to Google

#### GET /oauth/google/callback

Google OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - State parameter for CSRF protection

**Response (302):** Redirect to frontend with tokens

#### GET /oauth/github

Redirect to GitHub OAuth consent screen.

**Query Parameters:**
- `redirectUrl` - URL to redirect after successful authentication

**Response (302):** Redirect to GitHub

#### GET /oauth/github/callback

GitHub OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from GitHub
- `state` - State parameter for CSRF protection

**Response (302):** Redirect to frontend with tokens

### Email Verification

#### POST /auth/verify-email

Verify email address using token.

**Request:**
```json
{
  "token": "verification-token"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

#### POST /auth/resend-verification

Resend email verification link.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "Verification email sent"
}
```

### Password Reset

#### POST /auth/forgot-password

Request a password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "If the email exists, a reset link has been sent"
}
```

#### POST /auth/reset-password

Reset password using token.

**Request:**
```json
{
  "token": "reset-token",
  "password": "NewSecureP@ss123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

### Magic Link

#### POST /auth/magic-link

Request a magic link for passwordless login.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Magic link sent to email"
}
```

#### POST /auth/magic-link/verify

Verify magic link token.

**Request:**
```json
{
  "token": "magic-link-token"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

### Email OTP

#### POST /auth/otp/send

Send OTP to email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "OTP sent to email"
}
```

#### POST /auth/otp/verify

Verify OTP code.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

### WebAuthn / Passkeys

#### POST /webauthn/register/begin

Start WebAuthn registration.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "challenge": "...",
    "rp": { "name": "AuthForge", "id": "authforge.com" },
    "user": { "id": "...", "name": "user@example.com", "displayName": "John" },
    "pubKeyCredParams": [...],
    "attestation": "none"
  }
}
```

#### POST /webauthn/register/complete

Complete WebAuthn registration.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "credential": { ... }
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": { "id": "uuid", "deviceName": "MacBook Pro", "createdAt": "..." }
}
```

#### POST /webauthn/login/begin

Start WebAuthn authentication.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "challenge": "...",
    "allowCredentials": [...],
    "userVerification": "preferred"
  }
}
```

#### POST /webauthn/login/complete

Complete WebAuthn authentication.

**Request:**
```json
{
  "credential": { ... }
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

#### GET /webauthn/credentials

List user's WebAuthn credentials.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "credentials": [...]
  }
}
```

#### DELETE /webauthn/credentials/:id

Delete a WebAuthn credential.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "Credential deleted"
}
```

### MFA

#### POST /mfa/setup

Start MFA setup (generates TOTP secret).

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "secret": "BASE32SECRET",
    "qrCode": "otpauth://...",
    "backupCodes": ["code1", "code2", ...]
  }
}
```

#### POST /mfa/verify

Verify and enable MFA.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "MFA enabled successfully"
}
```

#### POST /mfa/disable

Disable MFA.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "MFA disabled"
}
```

#### POST /mfa/verify-challenge

Verify MFA during login.

**Request:**
```json
{
  "userId": "uuid",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

### Users

#### GET /users/me

Get the current user's profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "...", "name": "...", "role": "...", "emailVerified": "...", "image": "...", "createdAt": "..." }
  }
}
```

#### PATCH /users/me

Update the current user's profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "name": "New Name",
  "image": "https://..."
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": { "user": { ... } }
}
```

#### PATCH /users/me/password

Change password.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewP@ss456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

#### DELETE /users/me

Delete the current user's account.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**
```json
{
  "password": "CurrentP@ss123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Account deleted"
}
```

### Sessions

#### GET /sessions

List all active sessions for the current user.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "userAgent": "Mozilla/5.0...",
        "ipAddress": "192.168.1.1",
        "location": "New York, US",
        "isCurrent": true,
        "lastUsedAt": "...",
        "createdAt": "...",
        "expiresAt": "..."
      }
    ]
  }
}
```

#### DELETE /sessions/:id

Revoke a specific session.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "Session revoked"
}
```

### Admin

#### GET /admin/users

List all users (paginated).

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `search` - Search by email or name
- `role` - Filter by role
- `isBlocked` - Filter by blocked status

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### GET /admin/users/:id

Get user details (admin view).

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "sessions": [...],
    "oauthAccounts": [...],
    "passkeys": [...],
    "mfaMethods": [...],
    "loginAttempts": [...]
  }
}
```

#### PATCH /admin/users/:id/role

Update user role.

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": { "user": { ... } }
}
```

#### POST /admin/users/:id/block

Block a user.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "User blocked"
}
```

#### POST /admin/users/:id/unblock

Unblock a user.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "User unblocked"
}
```

#### DELETE /admin/users/:id

Delete a user.

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "status": "success",
  "message": "User deleted"
}
```

#### GET /admin/analytics

Get login analytics and statistics.

**Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `from` - Start date
- `to` - End date

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "totalUsers": 100,
    "activeUsers": 75,
    "totalLogins": 500,
    "failedLogins": 25,
    "usersByRole": { "user": 90, "admin": 10 },
    "loginsByDay": [ ... ],
    "loginsByProvider": { "email": 300, "google": 150, "github": 50 }
  }
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., email already exists) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Request validation failed |
| INVALID_CREDENTIALS | Email or password incorrect |
| EMAIL_NOT_VERIFIED | Email verification required |
| ACCOUNT_LOCKED | Account temporarily locked |
| ACCOUNT_BLOCKED | Account blocked by admin |
| TOKEN_EXPIRED | Token has expired |
| TOKEN_INVALID | Token is invalid |
| SESSION_EXPIRED | Session has expired |
| MFA_REQUIRED | MFA verification needed |
| RATE_LIMITED | Too many requests |
| USER_EXISTS | Email already registered |
| WEAK_PASSWORD | Password does not meet requirements |
