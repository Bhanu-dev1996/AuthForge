# Folder Structure

## Monorepo Structure

AuthForge uses a monorepo structure with separate `frontend` and `backend` directories.

```
authforge/
├── frontend/                    # React + Vite application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── app/                 # App-wide providers, layout
│   │   │   ├── providers.tsx
│   │   │   ├── router.tsx
│   │   │   └── app-layout.tsx
│   │   ├── components/          # Shared UI components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── shared/          # Project-specific shared components
│   │   ├── features/            # Feature-based modules
│   │   │   ├── auth/            # Authentication pages & logic
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── schemas/
│   │   │   │   └── pages/
│   │   │   ├── dashboard/       # User dashboard
│   │   │   │   ├── components/
│   │   │   │   ├── pages/
│   │   │   │   └── hooks/
│   │   │   ├── admin/           # Admin dashboard
│   │   │   │   ├── components/
│   │   │   │   ├── pages/
│   │   │   │   └── hooks/
│   │   │   ├── profile/         # Profile management
│   │   │   │   ├── components/
│   │   │   │   ├── pages/
│   │   │   │   └── schemas/
│   │   │   └── security/        # Security settings
│   │   │       ├── components/
│   │   │       ├── pages/
│   │   │       └── hooks/
│   │   ├── hooks/               # Shared hooks
│   │   ├── lib/                 # Utilities, API client, helpers
│   │   │   ├── api-client.ts
│   │   │   ├── auth-context.tsx
│   │   │   ├── token-manager.ts
│   │   │   └── utils.ts
│   │   ├── types/               # TypeScript types
│   │   ├── styles/              # Global styles
│   │   └── main.tsx             # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                     # Express.js API server
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Migration files
│   │   └── seed.ts              # Seed data
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── env.ts
│   │   │   ├── cors.ts
│   │   │   └── passport.ts
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── admin.middleware.ts
│   │   ├── modules/            # Feature-based modules
│   │   │   ├── auth/           # Authentication module
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.schema.ts
│   │   │   │   └── auth.test.ts
│   │   │   ├── oauth/          # OAuth module
│   │   │   │   ├── oauth.controller.ts
│   │   │   │   ├── oauth.service.ts
│   │   │   │   ├── oauth.routes.ts
│   │   │   │   └── strategies/
│   │   │   │       ├── google.strategy.ts
│   │   │   │       └── github.strategy.ts
│   │   │   ├── users/          # User management module
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.routes.ts
│   │   │   │   └── users.schema.ts
│   │   │   ├── sessions/       # Session management module
│   │   │   │   ├── sessions.controller.ts
│   │   │   │   ├── sessions.service.ts
│   │   │   │   ├── sessions.routes.ts
│   │   │   │   └── sessions.schema.ts
│   │   │   ├── webauthn/       # WebAuthn/Passkeys module
│   │   │   │   ├── webauthn.controller.ts
│   │   │   │   ├── webauthn.service.ts
│   │   │   │   ├── webauthn.routes.ts
│   │   │   │   └── webauthn.schema.ts
│   │   │   ├── mfa/            # MFA module
│   │   │   │   ├── mfa.controller.ts
│   │   │   │   ├── mfa.service.ts
│   │   │   │   ├── mfa.routes.ts
│   │   │   │   └── mfa.schema.ts
│   │   │   └── admin/          # Admin module
│   │   │       ├── admin.controller.ts
│   │   │       ├── admin.service.ts
│   │   │       ├── admin.routes.ts
│   │   │       └── admin.schema.ts
│   │   ├── services/           # Shared services
│   │   │   ├── email.service.ts
│   │   │   ├── token.service.ts
│   │   │   └── audit.service.ts
│   │   ├── utils/              # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   └── helpers.ts
│   │   ├── types/              # TypeScript types
│   │   │   ├── express.d.ts
│   │   │   └── index.ts
│   │   └── app.ts              # Express app setup
│   │   └── server.ts           # Server entry point
│   ├── tests/                  # Integration tests
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                        # Documentation
│   ├── 01-project-requirements.md
│   ├── 02-system-architecture.md
│   ├── 03-folder-structure.md
│   ├── 04-database-design.md
│   ├── 05-api-specification.md
│   ├── 06-authentication-flows.md
│   ├── 07-ui-ux-design.md
│   ├── 08-backend-implementation.md
│   ├── 09-security-guide.md
│   └── 10-deployment-guide.md
│
├── package.json                 # Root package.json (workspaces)
├── .gitignore
└── README.md
```

## Folder Structure Conventions

### Frontend Conventions

- **`features/`** - Each feature is self-contained with its own components, hooks, schemas, and pages
- **`components/ui/`** - Auto-generated shadcn/ui primitives
- **`components/shared/`** - Reusable project-specific components
- **`lib/`** - Core utilities, API client, and auth context
- **`hooks/`** - Global shared hooks

### Backend Conventions

- **`modules/`** - Each module follows a controller-service pattern
- **`middleware/`** - Express middleware functions
- **`services/`** - Shared services used across modules
- **`config/`** - Environment and third-party configuration
- **`prisma/`** - Database schema and migrations
