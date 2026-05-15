# 🥇 StackZen MVP QA Checklist (Updated June 2025)

## Overview

This checklist systematically verifies, optimizes, and polishes every critical feature before MVP launch. It incorporates StackZen’s latest features including Zen AI, Mentor Booking, and Safe-to-Spend logic.

## How to Use This Checklist

1. Work through each section, checking off items as you go.
2. Prioritize any item marked as slow, broken, or error-prone.
3. After each round of fixes, re-test the full user journey.
4. Log any issues in the "Issues Log" section.

---

## 1. Authentication & Onboarding

- [ ] Test login, registration, and password reset on all devices
- [ ] Ensure onboarding wizard saves user type, goals, and profile preferences
- [ ] Validate session handling (tokens, auto-refresh, logout logic)
- [ ] Confirm onboarding adapts based on persona type (Gig, Trade, Creative, etc.)
- [ ] Test onboarding exit/resume flow
- [ ] Add error messages and microcopy for failed inputs

---

## 2. Income, Budget & Expenses

- [ ] Manual income entry: UI, API, DB confirmation (test various sources)
- [ ] Validate Smart Allocation (40/30/30) logic and UI rendering
- [ ] Confirm Safe-to-Spend updates dynamically across views
- [ ] Expense entry: category tagging, impact on budget and Safe-to-Spend
- [ ] AI auto-prompt for saving suggestions after income events
- [ ] Dashboard loads fast with updated income + expense summaries

---

## 3. Quote & Invoice Builder

- [ ] Quote builder: form, preview, pricing logic, PDF output
- [ ] Invoice from quote: status updates, payment link integration
- [ ] Stripe terminal + online test mode
- [ ] Check PDF formatting on mobile + desktop
- [ ] History logs and editable quote/invoice statuses
- [ ] AI quote assistant (if enabled): test suggestion logic

---

## 4. Zen AI Companion

- [ ] Test PhraseCatcher triggers (e.g. “I need help” or “Can I afford...”)
- [ ] Tone Matrix behavior: Calm / Coach / Direct options respond correctly
- [ ] AI summary reflections weekly
- [ ] Timeout fallback UI and retry logic
- [ ] Memory scope toggle is respected in session

---

## 5. Mentor Booking & Feedback

- [ ] Mentor directory loads correctly with availability filters
- [ ] Session booking flow functions with calendar logic and reminders
- [ ] Stripe logic for mentor-paid sessions
- [ ] Booking confirmation, cancellation, and reschedule flows
- [ ] Feedback component post-session with emoji + text rating

---

## 6. Bill Calendar & Automations

- [ ] Calendar drag-drop for bills/tasks
- [ ] Reminder system fires at scheduled time (email + UI)
- [ ] Visual priority states (color code bills by urgency)
- [ ] AI suggestions if user misses or overspends

---

## 7. Notifications & Alerts

- [ ] Trigger types: income added, invoice paid, bill due, AI check-in, mentor update
- [ ] Confirm delivery and timing (push, email, in-app)
- [ ] Double-send and delay fallback logic
- [ ] Notification history view per user

---

## 8. Admin, Logs & Access

- [ ] Superadmin access tested: manage users, mentors, logs
- [ ] Audit logs track all financial + AI actions
- [ ] Misuse and abuse flag system for quotes/invoices
- [ ] Export logs for review
- [ ] Mentor activity feed scoped to user

---

## 9. QA, Testing & Feedback Loop

- [ ] Unit + integration test suite passes (Jest/Vitest)
- [ ] Manual walkthrough of all flows for every persona type
- [ ] Invite 5–10 testers from each persona group and collect feedback
- [ ] Triage all critical bugs and UX blockers before release
- [ ] Prepare v0.1 hotfix branch & launch patch pipeline

---

## 10. Performance & Production Readiness

- [ ] Lighthouse score 85+ mobile, 90+ desktop
- [ ] Core API response time < 500ms (target 300ms)
- [ ] Run DB migrations and seeding on production
- [ ] Optimize bundle sizes (lazy load large components)
- [ ] Activate error monitoring, performance logs, and user behavior tracking

---

## Issues Log

| Date | Feature | Issue Description | Severity | Status |
| ---- | ------- | ----------------- | -------- | ------ |
|      |         |                   |          |        |

---

## Notes

- Severity Levels: Critical, High, Medium, Low
- Status: Open, In Progress, Fixed, Verified
- Use this doc as your MVP readiness tracker across QA, Dev, Product, and Design teams
