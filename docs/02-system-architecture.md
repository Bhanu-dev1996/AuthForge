# System Architecture

## Overview

AuthForge follows a **three-tier architecture** comprising a frontend client, a backend API server, and a PostgreSQL database. The architecture is designed for modularity, security, and ease of extension.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 React Application                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │  Pages   │  │Components│  │   API Client      │  │    │
│  │  ├──────────┤  ├──────────┤  │   (TanStack Query) │  │    │
│  │  │  Auth    │  │   UI     │  ├──────────────────┤  │    │
│  │  │  Dashboard│  │  Forms   │  │   Auth Context    │  │    │
│  │  │  Settings│  │  Layout  │  │   Token Manager   │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  API Gateway                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │   Auth   │  │  Users   │  │    Sessions      │  │    │
│  │  │  Router  │  │  Router  │  │     Router       │  │    │
│  │  ├──────────┤  ├──────────┤  ├──────────────────┤  │    │
│  │  │  OAuth   │  │  Admin   │  │    WebAuthn      │  │    │
│  │  │  Router  │  │  Router  │  │     Router       │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Middleware Stack                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │  Helmet  │  │  CORS    │  │  Rate Limiter    │  │    │
│  │  ├──────────┤  ├──────────┤  ├──────────────────┤  │    │
│  │  │  Auth    │  │Validation│  │  Error Handler   │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Service Layer                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │  Auth    │  │  Email   │  │   Token          │  │    │
│  │  │  Service │  │  Service │  │   Service        │  │    │
│  │  ├──────────┤  ├──────────┤  ├──────────────────┤  │    │
│  │  │  OAuth   │  │  Session │  │   WebAuthn       │  │    │
│  │  │  Service │  │  Service │  │   Service        │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Prisma ORM                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  users   │  │ sessions │  │  oauth_accounts          │  │
│  ├──────────┤  ├──────────┤  ├──────────────────────────┤  │
│  │passkeys  │  │  mfa     │  │  password_reset_tokens   │  │
│  ├──────────┤  ├──────────┤  ├──────────────────────────┤  │
│  │email_    │  │ login_   │  │  audit_logs              │  │
│  │verification│  │ attempts │  │                          │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Decisions

### Why Three-Tier Architecture?

- **Separation of concerns** - Each layer has a distinct responsibility
- **Scalability** - Frontend and backend can scale independently
- **Security** - Database is never exposed to the client
- **Maintainability** - Each layer can be modified independently

### Why Express.js?

- Mature ecosystem with extensive middleware support
- Simple and flexible routing
- Large community and well-documented
- Easy to integrate with various authentication libraries

### Why Prisma ORM?

- Type-safe database access
- Auto-generated TypeScript types
- Declarative migrations
- Great developer experience with IDE autocompletion

### Why JWT + Refresh Tokens?

- Stateless access tokens reduce database lookups
- Refresh tokens enable secure token rotation
- Short-lived access tokens minimize damage from leaks
- Refresh token rotation detects token theft

## System Components

### 1. Frontend Application (React + Vite)

Serves as the user interface. Communicates with the backend API over HTTPS. Manages authentication state via JWT tokens stored in memory with refresh tokens in HTTP-only cookies.

### 2. Backend API (Express.js + TypeScript)

RESTful API that handles all authentication and authorization logic. Implements middleware for security, validation, and rate limiting. Uses a layered architecture with routers, controllers, services, and repositories.

### 3. Database (PostgreSQL via Supabase)

Relational database storing all user data, sessions, authentication records, and audit logs. Managed through Prisma ORM with type-safe queries and migrations.

## Data Flow

### Authentication Flow

```
Client → Auth Router → Auth Middleware → Auth Service → Prisma → Database
                                                              ↕
                                                    Token Service (JWT)
```

### OAuth Flow

```
Client → OAuth Router → OAuth Service → External Provider (Google/GitHub)
                                          ↕
                                   Callback Handler
                                          ↕
                                  Auth Service → Database
```

## Security Architecture

- All traffic is encrypted via HTTPS
- Passwords are hashed using bcrypt (cost factor 12)
- JWT tokens are signed using RS256 or HS256
- Refresh tokens are stored in HTTP-only, Secure, SameSite cookies
- Rate limiting is applied per IP and per user
- Input validation at the router layer using Zod
- SQL injection protection via Prisma parameterized queries
- XSS protection via Helmet and output encoding
- CORS is configured to allow only the frontend origin
