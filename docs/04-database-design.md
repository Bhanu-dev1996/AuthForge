# Database Design

## Overview

AuthForge uses PostgreSQL as its primary database, managed through Prisma ORM. The database schema is designed to support multiple authentication methods, session management, and audit logging.

## Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────────┐
│      users       │       │   oauth_accounts      │
├──────────────────┤       ├──────────────────────┤
│ id (PK)          │ 1    N│ id (PK)               │
│ email            │◄──────┤ userId (FK)           │
│ emailVerified    │       │ provider               │
│ name             │       │ providerAccountId      │
│ image            │       │ providerEmail          │
│ passwordHash     │       │ accessToken            │
│ role             │       │ refreshToken           │
│ isBlocked        │       │ expiresAt              │
│ createdAt        │       └──────────────────────┘
│ updatedAt        │
└────────┬─────────┘
         │
         │
    ┌────┴─────────────────────────────────────────────┐
    │                      │                            │
    ▼                      ▼                            ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│    sessions      │ │   passkeys       │ │  password_reset_tokens│
├──────────────────┤ ├──────────────────┤ ├──────────────────────┤
│ id (PK)          │ │ id (PK)          │ │ id (PK)               │
│ userId (FK)      │ │ userId (FK)      │ │ userId (FK)           │
│ token            │ │ credentialId     │ │ token                 │
│ refreshToken     │ │ publicKey        │ │ expiresAt             │
│ userAgent        │ │ counter          │ │ usedAt                │
│ ipAddress        │ │ deviceName       │ │ createdAt             │
│ location         │ │ backedUp         │ └──────────────────────┘
│ isRevoked        │ │ transports       │
│ expiresAt        │ │ createdAt        │
│ createdAt        │ └──────────────────┘
└──────────────────┘
         │
         ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│  login_attempts  │ │   mfa_methods    │ │  email_verification   │
├──────────────────┤ ├──────────────────┤ ├──────────────────────┤
│ id (PK)          │ │ id (PK)          │ │ id (PK)               │
│ userId (FK)      │ │ userId (FK)      │ │ userId (FK)           │
│ ipAddress        │ │ type             │ │ token                 │
│ userAgent        │ │ secret           │ │ expiresAt             │
│ success          │ │ enabled          │ │ verifiedAt            │
│ attemptedAt      │ │ createdAt        │ │ createdAt             │
└──────────────────┘ │ verifiedAt        │ └──────────────────────┘
                     └──────────────────┘
```

## Table Definitions

### users

Stores core user information and credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| emailVerified | TIMESTAMP | NULL | When email was verified |
| name | VARCHAR(255) | NULL | Display name |
| image | TEXT | NULL | Avatar URL |
| passwordHash | VARCHAR(255) | NULL | bcrypt hash (null for OAuth-only users) |
| role | ENUM | NOT NULL, default: 'user' | User role (user/admin) |
| isBlocked | BOOLEAN | NOT NULL, default: false | Account blocked status |
| blockedAt | TIMESTAMP | NULL | When account was blocked |
| lockedUntil | TIMESTAMP | NULL | Account lockout until time |
| createdAt | TIMESTAMP | NOT NULL, default: now() | Account creation time |
| updatedAt | TIMESTAMP | NOT NULL, auto-update | Last update time |

### oauth_accounts

Links user accounts to external OAuth providers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique identifier |
| userId | UUID | FK -> users.id, NOT NULL | Reference to user |
| provider | VARCHAR(50) | NOT NULL | Provider name (google, github) |
| providerAccountId | VARCHAR(255) | NOT NULL | User ID from provider |
| providerEmail | VARCHAR(255) | NULL | Email from provider |
| accessToken | TEXT | NULL | OAuth access token |
| refreshToken | TEXT | NULL | OAuth refresh token |
| expiresAt | TIMESTAMP | NULL | Token expiration time |
| createdAt | TIMESTAMP | NOT NULL, default: now() | Link creation time |

- **UNIQUE constraint on**: (provider, providerAccountId)

### sessions

Manages user sessions and refresh tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique identifier |
| userId | UUID | FK -> users.id, NOT NULL | Reference to user |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Session identifier hash |
| refreshToken | VARCHAR(255) | UNIQUE, NOT NULL | Refresh token hash |
| userAgent | TEXT | NULL | Browser user agent |
| ipAddress | VARCHAR(45) | NULL | Client IP address |
| location | VARCHAR(255) | NULL | Geo-location (optional) |
| isRevoked | BOOLEAN | NOT NULL, default: false | Whether session is revoked |
| lastUsedAt | TIMESTAMP | NOT NULL, default: now() | Last activity time |
| expiresAt | TIMESTAMP | NOT NULL | Session expiration |
| createdAt | TIMESTAMP | NOT NULL, default: now() | Session creation time |

### passkeys

Stores WebAuthn credentials for passwordless authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique identifier |
| userId | UUID | FK -> users.id, NOT NULL | Reference to user |
| credentialId | TEXT | UNIQUE, NOT NULL | WebAuthn credential ID |
| publicKey | TEXT | NOT NULL | WebAuthn public key |
| counter | BIGINT | NOT NULL, default: 0 | Signature counter |
| deviceName | VARCHAR(255) | NULL | Human-readable device name |
| backedUp | BOOLEAN | NOT NULL, default: false | Whether credential is backed up |
| transports | JSON | NULL | Allowed transport types |
| createdAt | TIMESTAMP | NOT NULL, default: now() | Registration time |

### password_reset_tokens

Manages password reset flow tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique identifier |
| userId | UUID | FK -> users.id, NOT NULL | Reference to user |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Reset token (hashed) |
| expiresAt | TIMESTAMP | NOT NULL | Token expiration |
| usedAt | TIMESTAMP | NULL | When token was used |
| createdAt | TIMESTAMP | NOT NULL, default: now() | Token creation time |

### email_verification_tokens

Manages email verification flow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique identifier |
| userId | UUID | FK -> users.id, NOT NULL | Reference to user |
| email | VARCHAR(255) | NOT NULL | Email being verified |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Verification token (hashed) |
| expiresAt | TIMESTAMP | NOT NULL | Token expiration |
| verifiedAt | TIMESTAMP | NULL | When email was verified |
| createdAt | TIMESTAMP | NOT NULL, default: now() | Token creation time |

### mfa_methods

Manages multi-factor authentication methods.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique identifier |
| userId | UUID | FK -> users.id, NOT NULL | Reference to user |
| type | VARCHAR(50) | NOT NULL | MFA type (totp, sms, email) |
| secret | TEXT | NOT NULL | Encrypted secret key |
| enabled | BOOLEAN | NOT NULL, default: false | Whether MFA is active |
| verifiedAt | TIMESTAMP | NULL | When MFA was verified |
| createdAt | TIMESTAMP | NOT NULL, default: now() | Creation time |
| updatedAt | TIMESTAMP | NOT NULL, auto-update | Last update time |

### login_attempts

Audit log for login attempts (used for rate limiting and security analysis).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default: uuid() | Unique identifier |
| userId | UUID | FK -> users.id | Reference to user (null for unknown emails) |
| email | VARCHAR(255) | NULL | Email attempted |
| ipAddress | VARCHAR(45) | NOT NULL | Client IP |
| userAgent | TEXT | NULL | Browser user agent |
| success | BOOLEAN | NOT NULL | Whether login succeeded |
| attemptedAt | TIMESTAMP | NOT NULL, default: now() | Attempt time |

## Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);

-- Sessions
CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_refreshToken ON sessions(refreshToken);
CREATE INDEX idx_sessions_expiresAt ON sessions(expiresAt);

-- OAuth Accounts
CREATE INDEX idx_oauth_accounts_userId ON oauth_accounts(userId);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider, providerAccountId);

-- Passkeys
CREATE INDEX idx_passkeys_userId ON passkeys(userId);

-- Login Attempts
CREATE INDEX idx_login_attempts_userId ON login_attempts(userId);
CREATE INDEX idx_login_attempts_ipAddress ON login_attempts(ipAddress);
CREATE INDEX idx_login_attempts_attemptedAt ON login_attempts(attemptedAt);

-- Tokens
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
```

## Prisma Schema Highlights

The Prisma schema uses:

- **UUIDs** as primary keys for security (non-enumerable)
- **bcrypt hashes** for passwords (never stored in plaintext)
- **Hashed tokens** in database (never store raw tokens)
- **Cascade deletes** for related records when user is deleted
- **JSON fields** for flexible data (transports, metadata)
- **Timestamps** for auditing (createdAt, updatedAt)
- **Soft deletes** where appropriate (via isRevoked, isBlocked flags)

## Relationships

- User **has many** Sessions (1:N)
- User **has many** OAuthAccounts (1:N)
- User **has many** Passkeys (1:N)
- User **has many** PasswordResetTokens (1:N)
- User **has many** EmailVerificationTokens (1:N)
- User **has one** MFAMethod (1:1)
- User **has many** LoginAttempts (1:N)
