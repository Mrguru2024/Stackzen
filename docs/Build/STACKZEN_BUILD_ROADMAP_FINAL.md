# 🧱 STACKZEN_BUILD_ROADMAP.md

> **Mission**: StackZen empowers tradespeople like locksmiths, electricians, drivers, and contractors to take control of their finances with automation, strategy, and AI-powered advice.

---

## ✅ Phase 1: Core System & Foundations (COMPLETE or NEAR-COMPLETE)

### 🔐 Authentication & User System

- [x] JWT-based login & registration
- [x] Email + password + password reset via SendGrid
- [x] Session management + auto logout
- [x] Role-based auth (user, admin)
- [ ] Add optional 2FA/MFA toggle via email or OTP

### 🧾 Subscription & Tier Model

- [x] Stripe integration
- [x] 3-tier model: Free, Pro, Lifetime
- [x] Subscription page with renewal logic
- [ ] Discount code/referral-based discount integration

### 🧭 Onboarding System

- [x] Progressive onboarding with step tracker
- [x] Ask user for trade type (Locksmith, Electrician, etc.)
- [x] Auto-apply suggested budgeting defaults per trade
- [ ] Add onboarding-based savings challenge or goal presets

---

## 💰 Phase 2: Income, Budgeting, and Expense System (IN DEVELOPMENT)

### 💸 Income Management

- [x] Manual income entry
- [x] Bank sync via Plaid
- [x] Income categorization (business, side gigs, etc.)
- [x] 40/30/30 Rule (Needs, Savings, Investments)
- [ ] Income history and visual timeline
- [ ] Predictive AI income trends + alerts

### 📤 Expense Tracking

- [x] Manual entry with category tags
- [x] Attach to income sources
- [x] Receipt uploads
- [ ] Recurring expenses
- [ ] Offline expense mode
- [ ] Tax-deductible expense flag

### 🧮 Net Income Overview

- [ ] Auto-calculate profit/loss from income/expenses
- [ ] Visual trends and alerts
- [ ] “Cut spending by X” smart prompts

### 📊 Budget Planner

- [x] Budget by category
- [ ] AI-powered budget repair suggestions
- [ ] 80%/100% alerts + soft caps
- [ ] Budget check-in component with visuals

---

## 🧠 Phase 3: AI Guidance System

### 🤖 Financial AI Assistant

- [x] Claude, OpenAI, and Perplexity integrated
- [ ] FinGPT extension (open source)
- [ ] PlanningCoach component for goal simulation
- [ ] AI-driven Goal Wizard
- [ ] Context-aware chat: Ask StackZen

### 🎯 AI Suggestions

- [ ] Auto savings recommendations
- [ ] Auto alerts for charges/patterns
- [ ] Suggest cheaper or free alternatives

---

## 💼 Phase 4: Monetization & Gig System

### 👷 StackZen Gigs

- [x] Gig discovery categories
- [ ] Pull gigs from Craigslist, Thumbtack, etc.
- [ ] AI match for skill and availability

### 🧲 Referral Engine

- [x] Invite codes and rewards
- [ ] Tiered levels for super-referrers
- [ ] Affiliate payout system

### 💸 Passive Income Tools

- [ ] Cashback (GetUpside, Rakuten)
- [ ] Marketplace for trades gear
- [ ] Invoice generator + discount logic

---

## 🧱 Phase 5: Tradesperson Tools

### ⏱️ Job + Time Tracker

- [ ] Daily job/task log
- [ ] Booking scheduler (client or self-use)
- [ ] Email/text reminders

### 💬 CRM & Client Flow

- [ ] Add and manage clients
- [ ] Quote → Invoice → Payment flow
- [ ] Notes + client history

---

## 🔐 Phase 6: Security & Compliance

### 🔒 Stack-Level Security

- [x] Secure JWT flow
- [ ] 2FA (email or SMS)
- [ ] Last login + device metadata
- [ ] Session revocation panel

### 🧱 Anti-Exploit Stack

- [ ] Prisma field encryption (PII, finance)
- [ ] CSP headers + CORS lockdown
- [ ] Bot firewall + rate limiting

---

## 📊 Phase 7: Dashboards & Visual Reports

- [ ] Financial Health Score panel
- [ ] AI-generated monthly summary
- [ ] Goal tracking UI + milestones
- [ ] Profit heatmaps by category/month
- [ ] Net worth visualization

---

## 📚 Phase 8: Education & Pro Growth

### 🎓 StackZen Academy

- [ ] Short courses by trade
- [ ] Tax resources for 1099s
- [ ] Video panel on dashboard
- [ ] AI-curated weekly improvement tips

---

## 🚀 Phase 9: Mobile App (Post-Web Launch)

- [ ] Native app (React Native)
- [ ] Offline mode for expenses
- [ ] Push notifications
- [ ] QR scan for receipts

---

## 💡 Future Features (Optional Power-Ups)

| Feature                | Why It Matters                                |
| ---------------------- | --------------------------------------------- |
| Spend Personality Test | Deep user profiling for targeted advice       |
| Tax Forecast Module    | Show quarterly tax goals & reserve estimation |
| Local Job Board        | Find work near ZIP code                       |
| Community Hub          | Financial wins + peer answers + mini-forums   |

---

## 🔁 Sprint Launch Timeline

| Sprint | Target                                 |
| ------ | -------------------------------------- |
| W1     | Net Income Panel + Budget Doctor AI    |
| W2     | Invoice UI + Passive Income Extensions |
| W3     | Referrals + Savings Strategy Wizard    |
| W4     | CRM Flow + Mobile Planning             |
| W5     | Gigs Feed + Security Stack Hardening   |
| W6     | Academy Alpha Launch + Mobile UAT      |

---

## ⚙️ Tech Summary

- **Frontend**: React, Tailwind, Shadcn, Vite
- **Backend**: Express, PostgreSQL, Drizzle ORM
- **AI**: Claude, OpenAI, Perplexity, FinGPT
- **Payments**: Stripe (standard + terminal)
- **Banking**: Plaid
- **Security**: JWT, Prisma encryption, Rate-limit
