# UI/UX Design

## Design System

AuthForge uses **shadcn/ui** as its component library, built on top of **Tailwind CSS**. The design follows modern authentication platform patterns with a focus on clarity, accessibility, and responsiveness.

## Color Palette

### Light Mode

| Token | Color | Hex |
|-------|-------|-----|
| Background | White | `#FFFFFF` |
| Foreground | Near Black | `#09090B` |
| Primary | Blue | `#2563EB` |
| Primary Foreground | White | `#FFFFFF` |
| Secondary | Gray | `#F4F4F5` |
| Muted | Light Gray | `#F4F4F5` |
| Destructive | Red | `#EF4444` |
| Success | Green | `#22C55E` |
| Warning | Amber | `#F59E0B` |
| Border | Light Border | `#E4E4E7` |

### Dark Mode

| Token | Color | Hex |
|-------|-------|-----|
| Background | Near Black | `#09090B` |
| Foreground | White | `#FAFAFA` |
| Primary | Blue | `#3B82F6` |
| Primary Foreground | White | `#FFFFFF` |
| Secondary | Dark Gray | `#27272A` |
| Muted | Dark Gray | `#27272A` |
| Destructive | Red | `#EF4444` |
| Success | Green | `#22C55E` |
| Warning | Amber | `#F59E0B` |
| Border | Dark Border | `#27272A` |

## Typography

- **Font Family:** Inter (system font stack as fallback)
- **Headings:** Font weight 600-700, tight letter spacing
- **Body:** Font weight 400, comfortable line height (1.5)
- **Small Text:** Font weight 400, size 14px

### Type Scale

| Element | Size (rem) | Weight |
|---------|-----------|--------|
| h1 | 2.25 | 700 |
| h2 | 1.875 | 600 |
| h3 | 1.5 | 600 |
| h4 | 1.25 | 600 |
| Body | 1 | 400 |
| Small | 0.875 | 400 |
| Caption | 0.75 | 400 |

## Spacing

Uses Tailwind's default spacing scale (4px increments):
- `p-4` = 16px padding
- `gap-4` = 16px gap
- `space-y-6` = 24px vertical spacing between children

## Layout

### App Shell

```
┌─────────────────────────────────────────────────────┐
│  Navbar                                              │
│  Logo    Dashboard    Security    Settings    Avatar  │
├─────────────────────────────────────────────────────┤
│                                                       │
│   Sidebar (optional)  │    Main Content Area          │
│   ┌──────────────┐   │   ┌──────────────────────┐   │
│   │ Dashboard     │   │   │                      │   │
│   │ Profile       │   │   │                      │   │
│   │ Security      │   │   │                      │   │
│   │ Sessions      │   │   │                      │   │
│   │ Connected Accts│   │   │                      │   │
│   │ Passkeys      │   │   │                      │   │
│   │ MFA           │   │   │                      │   │
│   └──────────────┘   │   └──────────────────────┘   │
│                                                       │
├─────────────────────────────────────────────────────┤
│  Footer (minimal)                                     │
└─────────────────────────────────────────────────────┘
```

## Page Designs

### Authentication Pages

#### Login Page

- Clean, centered card layout
- Email + Password inputs
- "Continue with Google" and "Continue with GitHub" buttons
- "Forgot Password?" link
- "Don't have an account? Sign up" link
- Social login buttons with respective brand colors

#### Register Page

- Same centered card layout as login
- Name, Email, Password, Confirm Password inputs
- Password strength indicator
- Social login options
- "Already have an account? Sign in" link
- Terms of service acceptance checkbox

#### Magic Link Page

- Simplified email input
- "Send Magic Link" button
- Option to switch to password login

#### OTP Page

- 6-digit input fields (one per digit)
- Auto-focus on next input
- Timer showing OTP expiry
- "Resend OTP" link (with cooldown)

#### MFA Challenge Page

- 6-digit TOTP input
- QR code display during setup
- Backup codes display

#### Password Reset Pages

- Email input for forgot password
- New password form with token from URL

### Dashboard Pages

#### Profile Page

- Avatar upload
- Name, Email display
- Email verification badge
- Account creation date

#### Security Page

- Password change form
- MFA section (enable/disable)
- Recent login activity
- Security score/badge

#### Sessions Page

- List of active sessions
- Current session highlighted
- Device, browser, location, last active time
- "Revoke" button per session
- "Revoke All" button

#### Connected Accounts Page

- List of connected OAuth providers
- Connect/disconnect buttons
- Provider icon + email

#### Passkeys Page

- List of registered passkeys
- Device name, created date
- Register new passkey button
- Delete passkey button

#### Admin Pages

- User table with search, filter, pagination
- User detail view with all linked data
- Analytics dashboard with charts
- Statistics cards (total users, active users, etc.)

## Component Patterns

### Forms

- Every form uses React Hook Form + Zod validation
- Inline validation errors below inputs
- Submit button with loading state (spinner + disabled)
- Success/error toast notifications

### Cards

- Used for settings sections, statistics, and summary displays
- Consistent padding (p-6)
- Optional header with title + action

### Tables

- Used for sessions, users (admin), connected accounts
- Sortable columns
- Action buttons on each row
- Empty state with helpful message

### Modals

- Used for confirmations (delete account, revoke session)
- Centered overlay with backdrop blur
- Focus trap for accessibility
- Escape key to close

### Toasts

- Success (green)
- Error (red)
- Warning (amber)
- Info (blue)
- Auto-dismiss after 5 seconds (except errors)

## Responsive Behavior

- **Mobile (< 768px):** Single column, full-width cards, hamburger menu
- **Tablet (768-1024px):** Two-column layouts where appropriate, sidebar collapsible
- **Desktop (> 1024px):** Full layout with persistent sidebar

## Transitions & Animations

- Page transitions: subtle fade
- Form submissions: button loading state with spinner
- Modal: scale + fade
- Sidebar: slide on mobile
- Toast: slide in from top-right

## Accessibility

- All inputs have associated labels
- Color contrast meets WCAG AA standards
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader friendly (aria-labels, roles)
- Error messages associated with inputs via aria-describedby
- Loading states announced by screen readers

## Dark Mode

- System-default by default (prefers-color-scheme)
- Manual toggle in settings
- Persisted preference
- Smooth transition between modes
- All colors defined as CSS variables

## Loading States

- **Skeleton loaders** for content-heavy pages (dashboard, admin)
- **Spinner buttons** for form submissions
- **Full-page loader** for protected route checks
- **Inline spinner** for individual section loading
