# 📐 StackZen Web App Architecture Guide - Updated June 2025

This guide outlines the clean, layered architecture for the **StackZen** web app project. It reflects the current implementation status and is tailored to your stack and development goals, ensuring scalability, maintainability, and performance throughout the beta-to-production lifecycle.

**Status: ✅ IMPLEMENTED - Production Ready**

---

## 🔧 Current Stack Overview

- **Framework:** Next.js 15.4.0-canary.68 (App Router)
- **Frontend:** React 18, Tailwind CSS, Radix UI, TypeScript
- **Backend:** Next.js Server Actions & API Routes
- **ORM & DB:** Prisma ORM + PostgreSQL
- **Authentication:** NextAuth.js with Prisma adapter
- **Payments:** Stripe (Payments + Connect)
- **Email:** Nodemailer with SMTP
- **Monitoring:** Sentry
- **Hosting:** Vercel (planned)
- **CI/CD:** GitHub + Vercel (planned)

---

## 🧱 Implemented Architecture

### 1. **Data Layer** ✅

- Handles all database operations.
- Defines schema, migrations, and raw queries.

**Tech:** Prisma ORM, PostgreSQL  
**Location:** `/prisma/`

**Files:**

- `prisma/schema.prisma` – Prisma schema definitions
- `lib/prisma.ts` – DB connection config
- `prisma/migrations/` – Database migrations

---

### 2. **Logic Layer (Domain Layer)** ✅

- Pure business logic and reusable functions.
- No side-effects, no API awareness.

**Location:** `/lib/`

**Examples:**

- `lib/email/emailService.ts` – Email service logic
- `lib/stripe.ts` – Stripe payment logic
- `lib/auth.ts` – Authentication utilities

---

### 3. **Application Layer (Service Layer)** ✅

- Coordinates logic, validation, and workflows.
- Used by server actions and APIs.

**Location:**

- Server Actions: `/app/actions/`
- API Routes: `/app/api/`

**Examples:**

- `/app/api/mentors/route.ts` – Mentor management
- `/app/api/analytics/route.ts` – Analytics data
- `/app/api/notifications/email/route.ts` – Email notifications

---

### 4. **Communication Layer** ✅

- Handles frontend ↔ backend interaction.
- Custom API hooks and fetch logic.

**Location:** `/hooks/`, `/lib/api/`

**Examples:**

- `hooks/useAuth.ts` – Authentication hooks
- `hooks/useMentors.ts` – Mentor data hooks
- `lib/api/mentors.ts` – Mentor API functions

---

### 5. **Presentation Layer (UI Layer)** ✅

- User interface and client-side interactions.

**Location:** `/components/`, `/app/`

**Folders:**

- `components/ui/` – Base UI components (Radix UI)
- `components/mentors/` – Mentor system components
- `components/analytics/` – Analytics dashboard
- `components/onboarding/` – Onboarding flow
- `app/(dashboard)/` – Authenticated dashboard pages
- `app/(auth)/` – Authentication pages

---

### 6. **Authentication & Security Layer** ✅

- Manages sessions, roles, protected routes.

**Tech:** NextAuth.js  
**Files:**

- `middleware.ts` – Route protection logic
- `lib/auth.ts` – Role validation & session utils
- `app/api/auth/[...nextauth]/route.ts` – Auth API

---

### 7. **Integration Layer** ✅

- External services and SDK wrappers.

**Location:** `/lib/`

**Examples:**

- `lib/stripe.ts` – Stripe API interactions
- `lib/email/emailService.ts` – Email service
- `lib/sentry.ts` – Error monitoring

---

### 8. **Infrastructure Layer** 🔄

- Hosting, CI/CD, secrets, env configs.

**Tools:** Vercel (planned), GitHub Actions (planned)  
**Files:**

- `.env.local` – Environment variables
- `vercel.json` – Vercel deploy config (planned)
- `.github/workflows/` – CI/CD scripts (planned)

---

## 📁 Current Folder Structure

```
/app
  /(auth)/
    /login/
    /register/
    /onboarding/
  /(dashboard)/
    /dashboard/
    /mentors/
    /analytics/
    /admin/
  /api/
    /auth/
    /mentors/
    /analytics/
    /notifications/
    /stripe/
  /actions/
/components
  /ui/                    # Base UI components
  /mentors/               # ✅ COMPLETED
    /MentorDirectory/
    /MentorProfile/
    /BookingFlow/
    /VideoSession/
    /SessionRating/
  /analytics/             # ✅ COMPLETED
    AnalyticsDashboard.tsx
  /onboarding/            # ✅ COMPLETED
    OnboardingQuestionnaire/
  /income/                # ✅ COMPLETED
    IncomeHub/
    Invoicing/
/lib
  /prisma.ts             # Database connection
  /auth.ts               # Authentication
  /stripe.ts             # Stripe integration
  /email/
    emailService.ts      # Email notifications
  /api/                  # API utilities
  /utils/                # Utility functions
  /validators/           # Input validation
/prisma
  /schema.prisma         # Database schema
  /migrations/           # Database migrations
/middleware.ts           # Route protection
.env.local              # Environment variables
```

---

## ✅ Implemented Features

### Core System ✅

- [x] Authentication & authorization
- [x] User onboarding flow
- [x] Database schema & migrations
- [x] API routes & server actions
- [x] UI component library
- [x] State management

### Mentor System ✅

- [x] Mentor directory & profiles
- [x] Booking system
- [x] Video session integration
- [x] Payment processing
- [x] Email notifications
- [x] Analytics dashboard
- [x] Admin panel

### Financial Tools ✅

- [x] Income tracking
- [x] Expense management
- [x] Quote generation
- [x] Invoice system
- [x] Client management
- [x] Stripe integration

### AI & Personalization ✅

- [x] AI personalization system
- [x] Onboarding questionnaire
- [x] User preference tracking
- [x] Tone matrix implementation

---

## 🔄 Next Phase Architecture

### Planned Enhancements

1. **Financial Wellness Features**
   - Wellness scorecard
   - Savings goals system
   - Progress tracking

2. **Advanced AI Features**
   - Enhanced money mentor
   - Financial mascot
   - AI-powered insights

3. **Bank Integration**
   - Plaid integration
   - Transaction sync
   - Automated categorization

4. **Mobile Optimization**
   - Progressive Web App (PWA)
   - Native app development
   - Offline functionality

---

## ✅ Best Practices (IMPLEMENTED)

- ✅ Business logic **decoupled** from API and UI layers
- ✅ Input validation and output sanitization
- ✅ Environment-based secrets and feature flags
- ✅ Unit tests for components and utilities
- ✅ TypeScript for type safety
- ✅ Modular component pattern (MCP)
- ✅ Responsive design principles
- ✅ Security best practices

---

## 🚀 Deployment Strategy

| Environment | Branch         | URL Example                     | Status |
| ----------- | -------------- | ------------------------------- | ------ |
| Local Dev   | feature/branch | `localhost:3000`                | ✅     |
| Preview     | Pull Request   | `stackzen.vercel.app/preview/*` | 🔄     |
| Staging     | `dev`          | `staging.stackzen.app`          | 🔄     |
| Production  | `main`         | `www.stackzen.app`              | 🔄     |

---

## 🔧 Production Deployment Checklist

### ✅ Ready for Production

- [x] All core features implemented
- [x] Database schema deployed
- [x] API routes tested
- [x] Payment processing verified
- [x] Email system configured
- [x] Error monitoring active
- [x] Security measures in place

### 🔄 Production Setup Required

1. **Vercel Deployment**
   - Connect GitHub repository
   - Configure environment variables
   - Set up custom domain

2. **Database Migration**
   - Production database setup
   - Data migration scripts
   - Backup configuration

3. **Monitoring & Analytics**
   - Sentry error tracking
   - Performance monitoring
   - User analytics

---

**Maintained by:** Anthony "MrGuru" Feaster  
**Version:** Beta → Production Launch Strategy  
**Last Updated:** June 22, 2025  
**Status:** MVP Complete - Ready for Production Deployment
