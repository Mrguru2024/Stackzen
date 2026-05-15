# 🔒 StackZen Guardrails – Budget Discipline & AI Guidance

## 🌱 Phase 1: MVP – Spending Guardrails System

### 🎯 Objective

Create a feature called **StackZen Guardrails** that allows users to:

- Set category-based spending limits
- Receive proactive alerts when approaching limits
- Get weekly behavioral summaries and AI-driven financial suggestions

---

### 1. 📊 Database Models (Drizzle ORM / PostgreSQL)

```ts
// spending_limits.ts
export const spendingLimits = pgTable('spending_limits', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  category: varchar('category', { length: 100 }),
  limitAmount: numeric('limit_amount'),
  cycle: varchar('cycle', { length: 20 }), // 'weekly', 'monthly'
  createdAt: timestamp('created_at').defaultNow(),
});

// spending_logs.ts
export const spendingLogs = pgTable('spending_logs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  category: varchar('category', { length: 100 }),
  amountSpent: numeric('amount_spent'),
  timestamp: timestamp('timestamp').defaultNow(),
});
```

---

### 2. 🚀 Backend API Endpoints (Express + TypeScript)

- `POST /api/guardrails/limits` — Set or update a category limit
- `GET /api/guardrails/summary` — Get limit vs. current spending + alert % status
- `GET /api/guardrails/reflection` — Get weekly summary + AI coaching message

---

### 3. ⚠️ Spending Alert Logic

```ts
function checkSpendingAgainstLimit(userId: string) {
  // Fetch current cycle spending for each category
  // Compare against user-set limits
  // Trigger alert if:
  // - 80%+ = Yellow warning
  // - 100%+ = Red soft-block (optional)
}
```

🧩 Integrated Into:

- Manual expense logging
- Bank sync callbacks (e.g., Plaid)
- Future real-time bank entry tracking

---

### 4. 🖼️ Frontend UI (React + Tailwind)

#### Settings Page:

- Set weekly/monthly limits per category
- Discipline Mode toggle (enable soft-blocks)
- AI Coach Only toggle (gentle nudge, no block)

#### Alerts UI:

- Toast/modal warnings when near/over budget

#### Weekly Review Panel:

- Color-coded categories (Green, Yellow, Red)
- Spending summary vs. limits
- AI-generated suggestions

---

### 5. 🧠 AI Integration (OpenAI / Claude)

```ts
const prompt = `
User spent $350 on 'Tools' this week, exceeding their $300 limit.
Their goal is to save for a van. Provide practical, encouraging advice.
`;

const response = await openai.chat.completions.create({ ... });
```

✅ Display this response in the weekly reflection panel.

---

### 6. ⏰ Weekly Cron Job

- Archive logs per user
- Reset cycle counters
- Trigger `/api/guardrails/reflection` to generate AI coaching
- Optional: Notify user via email or in-app

---

### 7. 🧪 Feature Toggles

| Toggle              | Behavior                                                    |
| ------------------- | ----------------------------------------------------------- |
| **Discipline Mode** | Soft block user from spending more in over-limit categories |
| **AI Coach Only**   | Skip block, just send nudges/suggestions                    |

---

### ✅ Phase 1 Dev Checklist

- [ ] DB tables created & migrated
- [ ] Backend API live and tested
- [ ] Alert logic integrated with logging/spending
- [ ] UI components for settings + review
- [ ] AI prompt templates integrated
- [ ] Cron job logic tested in staging

---

## 🚀 Phase 2: Growth & Polishing

### 👋 User Onboarding Improvements

- [ ] Guided onboarding for budget and guardrails
- [ ] First-time tutorial overlays
- [ ] Tooltips for Safe-to-Spend, quote builder, AI assistant

---

### 📊 Data Visualization Upgrades

- [ ] Income trend graphs over time
- [ ] 40/30/30 breakdown rings + animation
- [ ] Savings goal progress bars and forecast lines

---

### 📱 Mobile Enhancements

- [ ] Mobile-first swipe nav between dashboards
- [ ] Confirm touch support for all inputs
- [ ] Optimize all modal sizes + tap areas

---

### 📤 Export Features

- [ ] CSV/PDF export for income, quotes, expenses
- [ ] Printable financial summary
- [ ] Weekly/monthly email reports with summary graphs

---

### 🔔 Notifications & Summary

- [ ] Push/email alert for goal completions
- [ ] Payment due and invoice status reminders
- [ ] Weekly AI summary + trend insight digest

---

### 🌐 Social & Motivation Features

- [ ] Anonymous progress sharing
- [ ] Financial achievement badge system
- [ ] Public mentor/coach profiles

---

### 💸 Premium Revenue Features

- [ ] "Coming soon" list for locked Pro tools
- [ ] Stripe paywall gating for premium tools
- [ ] Tier comparison logic tested

---

### 🧠 Content Strategy

- [ ] Add financial blog tutorials
- [ ] Downloadable planning templates
- [ ] Short video tips (hosted or YouTube embedded)

---

### 🧪 Technical/SEO Improvements

- [ ] Lighthouse SEO + accessibility score >90
- [ ] Clean URLs and meta schema for landing pages
- [ ] Lazy load and performance optimization
- [ ] Error logging and test coverage (unit/integration)

---

### 🏁 Final QA for Phase 2

- [ ] Mobile testing complete
- [ ] Dev, design, and product sign-off
- [ ] Pre-release checklist followed

---
