# **UX/UI Workflow Guide for Product Development**

**Prepared By:** Anthony Feaster  
 **Role:** Founder, Product Manager & Developer  
 **Framework Base:** Design Thinking \+ Real-World UX/UI Best Practices

---

## **I. UX/UI Workflow Overview (Phases)**

| Phase             | Key Output                            | Tools                             |
| ----------------- | ------------------------------------- | --------------------------------- |
| 0\. Business Req. | Product goals, KPIs, scope            | Google Docs, Notion, Trello       |
| 1\. Discover      | User research, empathy maps           | Google Forms, Discord, Miro       |
| 2\. Define        | Problem statement, value proposition  | Google Docs, Notion, FigJam       |
| 3\. Ideate        | Wireframes, sketches, user flows      | Figma, UX Pilot, Miro             |
| 4\. Prototype     | Low/Mid/High-fi prototypes            | Figma, UX Pilot, CodeSandbox      |
| 5\. Test          | Feedback reports, insights            | Maze, User Interviews, Notion     |
| 6\. Handoff       | Design spec, dev-ready assets         | Figma Dev Mode, GitHub, Cursor AI |
| 7\. Iterate       | Updated versions, version history log | Notion, Trello, Cursor AI Agent   |

---

### **II. Step-by-Step UX/UI Instructions**

## **II. Business Requirements – StackZen**

**Project Name:** StackZen  
 **Prepared By:** Anthony Feaster  
 **Version:** 1.0  
 **Date:** \[Insert Finalized Date\]

---

### **1\. Executive Summary**

StackZen is a personal finance platform designed for freelancers, tradespeople, gig workers, and contractors with irregular income streams. It helps users bring clarity and control to their money with tools like automated income tracking, a 40/30/30 budgeting planner, mobile quote generation, and guided human mentorship.

---

### **2\. Business Goals**

| Goal                         | KPI / Success Metric                     |
| ---------------------------- | ---------------------------------------- |
| Improve user retention       | 25% increase in 30-day retention         |
| Reduce invoice creation time | Users create invoice in under 90 seconds |
| Grow new user base           | \+1,000 new users within 60 days         |

---

### **3\. Target Users & Segments**

**Primary Users:**

- Freelancers (designers, developers, creators)

- Gig workers (Uber, DoorDash, Instacart)

- Tradespeople (locksmiths, HVAC, electricians)

- Independent contractors (techs, solopreneurs)

**Secondary Users:**

- Financial mentors / advisors

- Small business owners

---

### **4\. Global Problem Statement**

Users with irregular income struggle to track, plan, and allocate their money. Most financial apps assume bi-weekly or salaried income, which leads to stress, budgeting failure, and missed opportunities.

---

### **5\. Solution Overview**

StackZen solves this by giving users:

- A unified view of earnings from multiple sources

- A smart visual budget tool that applies the 40/30/30 rule

- Fast mobile quote and invoice generation

- Weekly summaries and cash flow visibility

- Optional access to real human mentors for financial guidance

---

### **6\. Scope and Constraints**

**In Scope (MVP):**

- Income tracking (manual \+ synced)

- 40/30/30 planner \+ cash allocation logic

- Stripe-powered quote & invoice generation

- Mobile-first onboarding

- Dashboard summaries

**Out of Scope (for MVP):**

- Tax filing integration

- Credit score monitoring

- Investment account syncing

---

### **7\. Assumptions**

- Users operate across 2–5 income platforms

- Most are not finance-savvy

- Users need fast insights, not complex accounting

- MVP must deploy in 60 days

- Stripe \+ Supabase will be used for integration

---

### **8\. Timeline & Milestones**

| Phase       | Start Date      | End Date        | Owner                |
| ----------- | --------------- | --------------- | -------------------- |
| Discovery   | May 1, 2025     | May 10, 2025    | UX/Research Team     |
| Prototyping | May 11, 2025    | May 31, 2025    | Design Team          |
| Development | June 1, 2025    | July 10, 2025   | Dev Team             |
| Testing     | July 11, 2025   | August 15, 2025 | QA \+ UX             |
| Launch      | August 16, 2025 | October 1, 2025 | PM (Anthony Feaster) |

---

### **9\. Stakeholders**

| Name            | Role                      | Involvement                             |
| --------------- | ------------------------- | --------------------------------------- |
| Anthony Feaster | Product Manager, Dev Lead | Full oversight and development lead     |
| Fenni           | UX Research Advisor       | Research, user insight, onboarding help |

---

### **10\. Success Criteria**

- 50% of new users complete onboarding within 24 hours

- 75% of users apply the 40/30/30 planning tool in 7 days

- 15% of users return to check dashboard at least once per week

- 80% of invoices created and sent within 2 minutes

- 30% of users explore mentor matching within 30 days

---

### **11\. Risks & Mitigation**

| Risk                         | Mitigation Strategy                                                 |
| ---------------------------- | ------------------------------------------------------------------- |
| Stripe onboarding delay      | Add manual quote and PDF invoice fallback                           |
| Low early adoption           | Offer Discord early access \+ partner incentives                    |
| Confusion in onboarding flow | Use user-specific onboarding with tooltips and 3-click walkthroughs |

---

### **12\. Approval**

| Name            | Role                      | Signature   | Date            |
| --------------- | ------------------------- | ----------- | --------------- |
| Anthony Feaster | Product Manager, Dev Lead | \[To Sign\] | \[To Complete\] |

---

## **III. DISCOVER (EMPATHIZE)**

**Goal:** Conduct deep research to understand who we are building StackZen for, what their daily pain points are, and how they currently work around financial chaos. Build empathy and clarity.

---

### **Research Focus**

Target users are U.S.-based freelancers, tradespeople, gig workers, and independent earners operating with inconsistent or multi-source income. Research was conducted through:

- Desk research (Upwork, Pew Research, IRS 1099 data, Reddit/Discord community insights)

- Behavioral observation from Discord calls

- Early test user interviews (planned for MVP alpha)

---

### **Validated Personas \+ Problem Statements**

**1\. Darren – The Skilled Trades Hustler**  
 _Mobile locksmith, handyman, or HVAC technician earning per job._

**Problem Statement:**  
 Darren lacks a system to track fluctuating job-based income and quotes, causing delays in payment and confusion during tax season.

---

**2\. Jamal – The Freelance Creative**  
 _Web designer, videographer, or copywriter juggling multiple client contracts._

**Problem Statement:**  
 Jamal struggles to manage client payments, lacks project profitability insight, and has no clear savings structure.

---

**3\. Michelle – The Gig-Economy Operator**  
 _Uber, DoorDash, and TaskRabbit gig worker with multiple apps._

**Problem Statement:**  
 Michelle relies on screenshots and mental math to track bills and earnings. She often misses due dates and doesn’t know what she can safely spend.

---

**4\. Rosa – The Side Hustle Builder**  
 _Etsy shop owner reinvesting into her small business without tracking take-home profit._

**Problem Statement:**  
 Rosa has no clear view of her true profit vs. expenses, making growth decisions difficult and risky.

---

**5\. Ty – The Real-Life Provider**  
 _Blue-collar single father managing child support, rent, and irregular work pay._

**Problem Statement:**  
 Ty avoids complex finance tools. His income goes to bills immediately, and he never sees a full cashflow picture to plan savings or avoid overdrafts.

---

### **User Journeys (x2 per Persona)**

| Persona      | Journey 1                                                                      | Journey 2                                                                   |
| ------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Darren**   | Logs job → Sends quote → Completes work → Converts to invoice → Tracks payment | End of week → Sees income summary → Applies 40/30/30 → Allocates to savings |
| **Jamal**    | Logs into dashboard → Sorts income by client → Tags payments                   | Starts project → Sets income goal → Logs time → Uses profit estimator       |
| **Michelle** | Logs in daily → Syncs gig payouts → Displays Safe-to-Spend                     | Sunday review → Weekly summary → Suggests earning targets → Sets up alerts  |
| **Rosa**     | Inputs sales and expenses → Views net profit                                   | Sets monthly income goal → Compares to actual → Adjusts ad budget           |
| **Ty**       | Opens dashboard → Checks bill timeline → Allocates funds → Sets alert          | Income overview → 10% auto-savings → Moves money to emergency fund          |

---

### **Onboarding Variants (Per User Type)**

| User Type        | Key Questions Captured                                     | Mode                                                             |
| ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| **Contractor**   | Income sources, job types, quoting habits, invoice history | Mobile-first wizard (Job → Quote → Invoice walkthrough)          |
| **Advisor**      | Financial certification, availability, specialty focus     | Web intake form \+ mentor matching                               |
| **General User** | Gig platforms, income irregularity, financial goals        | Quick start with guided dashboard tips & opt-in 40/30/30 planner |

---

### **Research Deliverables**

- **Persona Profiles** – 5 detailed profiles with behaviors, quotes, and pain points

- **User Journey Maps** – End-to-end use cases by user type

- **Early Insights** – Logged themes from Discord chats \+ screener results

- **Onboarding Logic Map** – Visuals showing how each persona enters the platform

##

## **IV. DEFINE**

**Goal:** Convert research and user insights into a clearly defined product focus. Align the StackZen platform with user needs, validated problems, and business viability.

---

### **Primary Problem Statement**

Independent earners with irregular income struggle to plan, track, and allocate funds consistently, leading to anxiety, missed bills, lack of savings, and overall financial instability.

---

### **Key User Needs (Across Personas)**

- View income and expenses in one place, regardless of platform (e.g., gig apps, cash jobs, invoices)

- Use a _simple, automated framework_ for budgeting that fits irregular cashflow (e.g., the 40/30/30 rule)

- Create and send professional quotes and invoices quickly without needing financial literacy

- Get real-time clarity on what’s "Safe to Spend"

- Track progress toward short-term and monthly financial goals

- Avoid overdraft, late fees, and guesswork with bill reminders

- Access human guidance when needed from real professionals

  ***

  ### **StackZen Value Proposition (Enhanced)**

**"The only personal finance system built for the unpredictable."**

StackZen transforms chaos into clarity for people who live gig-to-gig, job-to-job, or month-to-month. Unlike traditional apps, StackZen merges visual automation, income forecasting, and embedded human mentorship.

We’re not just budgeting software—we’re a hybrid finance assistant:

- **Visual cashflow logic** (40/30/30)

- **Instant quote & invoice system** for contractors

- **Weekly goal & savings planner** for gig workers

- **Real human mentors** on-demand for guidance and personalized help

- **Safe-to-Spend engine** that adapts to daily fluctuations

Whether you're a solo electrician, freelance designer, delivery driver, or side hustler—we give you tools and support that speak your income’s language.

---

### **Top Feature Priorities (MVP Scope)**

| Feature                         | Purpose                                                     | Status      |
| ------------------------------- | ----------------------------------------------------------- | ----------- |
| Manual \+ Linked Income Logging | Tracks income across clients & apps                         | ✅ Required |
| 40/30/30 Visual Planner         | Auto-split income with rule logic                           | ✅ Required |
| Smart Quote & Invoice Generator | Contractor billing tool via Stripe                          | ✅ Required |
| “Safe to Spend” View            | Real-time cashflow & expenses                               | ✅ Required |
| Goal Tracker                    | Track user-set income or saving targets                     | ✅ Required |
| Onboarding Variants (3)         | Personalized flows for Contractors, Advisors, General Users | ✅ Required |
| Mentor Access Portal            | Chat \+ scheduling system for human financial help          | ✅ Required |

---

### **Outputs**

- `problem-statements.md` – Updated with persona-aligned challenges

- `feature-priority-matrix.xlsx` – Ranked by value, effort, and launch impact

- `value-proposition-canvas.png` – Visual mapping of user pains, gains, and StackZen value

- ***

## **V. IDEATE**

**Goal:** Generate user-centered layouts, experience concepts, and feature flows that address validated user problems using creative and structured ideation techniques.

---

### **Design Sprint Focus Areas (Per Persona)**

| Persona                    | Design Focus                             |
| -------------------------- | ---------------------------------------- |
| Darren (Skilled Trades)    | Fast mobile quoting & invoice loop       |
| Jamal (Freelance Creative) | Visual project budget and client filters |
| Michelle (Gig Worker)      | Auto-sync \+ daily spend insights        |
| Rosa (Side Hustler)        | Business expense \+ growth tracking      |
| Ty (Provider/Parent)       | Bill tracking and visual timeline        |

Each flow focuses on empowering _financial action with the least friction._

---

### **Feature Flowcharts (In Progress)**

1. **Smart Quote-to-Invoice Loop (Darren)**  
   → New job → Enter details → Generate quote → Send → Job complete → Convert to invoice → Track status

2. **Weekly Earnings Prep (Michelle)**  
   → Sync app payouts → Auto-tag income → Show “Safe to Spend” → Suggest earnings goal → Schedule rides

3. **Goal Progress Flow (Rosa)**  
   → Set monthly target → Log income → Input expenses → View % to goal → Recommend changes

(🖼 Flowchart visuals created in \[Figma link pending\] and UX Pilot)

---

### **How Might We (HMW) Questions**

HMW questions help us reframe user needs into actionable design ideas.

| Persona  | HMW Prompt                                                                     |
| -------- | ------------------------------------------------------------------------------ |
| Darren   | HMW let tradespeople quote and invoice from their phone in under 60 seconds?   |
| Jamal    | HMW make freelance income by project feel stable and forecastable?             |
| Michelle | HMW help gig workers know what’s truly spendable today without opening 5 apps? |
| Rosa     | HMW show solo founders how much profit they _really_ made this month?          |
| Ty       | HMW make bill tracking intuitive for non-finance-savvy users with time stress? |

---

### **SCAMPER Method Ideation Table**

| Technique              | Idea (Applied to StackZen)                                                   |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Substitute**         | Replace text-heavy onboarding with short intro coach prompts per user type   |
| **Combine**            | Merge income view with cashflow forecast (like a live Safe-to-Spend tracker) |
| **Adapt**              | Use quote/invoice logic like service CRMs but simplified for mobile use      |
| **Modify**             | Visually simplify the 40/30/30 planner into a draggable pie chart            |
| **Put to Another Use** | Use goal tracker logic for both savings and bill preparation                 |
| **Eliminate**          | Remove excessive onboarding screens by auto-suggesting setup from first log  |
| **Rearrange**          | Flip the dashboard to show immediate needs (bills, invoices) before totals   |

---

### **Output Files**

- `concept-matrix.md` – Features aligned by user impact and feasibility

- `user-flow-v1.png` – Drafted page-to-action diagrams

- `rough-sketches.pdf` – Initial hand-drawn ideas and whiteboard captures

- `hmw-questions.md` – Validated and grouped questions by persona

- ***

## **VI. PROTOTYPE**

**Goal:** Translate prioritized ideas into functional visual mockups that demonstrate how StackZen works and feels before development begins.

---

### **Prototype Development Phases**

| Fidelity Level            | Tools Used                    | Purpose                                                          |
| ------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| **Low-Fidelity (Lo-Fi)**  | Paper, Figma (Wireframe Mode) | Validate structure, user flow logic, content blocks              |
| **Mid-Fidelity (Mid-Fi)** | UX Pilot, Figma, FigJam       | Test layout, form fields, and interaction expectations           |
| **High-Fidelity (Hi-Fi)** | Figma, UX Pilot \+ Cursor AI  | Present final visuals, branded components, mobile responsiveness |

---

### **Component Focus by User Flow**

| Flow             | Key Screens in Prototype                                        |
| ---------------- | --------------------------------------------------------------- |
| Quote → Invoice  | Job form → Quote preview → Client send → Convert to invoice     |
| Weekly Cash Flow | Income tracker → Safe-to-Spend meter → Goal progress bar        |
| Bill Tracking    | Timeline calendar → Reminder alert setup → Payment confirmation |
| Mentor Access    | Onboarding → Availability view → In-app Q\&A chat thread        |
| Goal Planning    | Set goal → Track inflow → Net income insights →                 |

---

### **Interactive Prototype Features**

- **Mobile-first layout** (prioritized for Android/iOS use)

- **Click-through interaction** for all MVP features

- **Persona-specific onboarding** toggled via role select

- **Dark/light mode switch (for visual stress relief)**

- **Sticky safe-to-spend UI element** visible across app

  ***

  ### **Usability-ready Prototype Links**

_Note: These are placeholder entries. When real links are available, replace._

- `figma-prototype-link` – Click to open full mobile-first design v1

- `component-library.fig` – UI kit with tokens, spacing, and icon set

- `prototype-status.md` – Development-ready walkthrough of mockup logic

- `ui-feedback-sheet.csv` – For testers to log issues per screen

  ***

  ### **Visual Preview Summary**

| Visual Name          | Preview |
| -------------------- | ------- |
| Wireframe Sample     |         |
| Page Flow Diagram    |         |
| Mobile Component Kit |         |

_All visuals are optimized for readability, Figma tokens, and Cursor AI agent parsing._

- ***

## **VII. TEST**

**Goal:** Validate design decisions through structured usability testing, uncover user friction points, and generate actionable insights to guide iteration.

---

### **Usability Testing Objectives**

- Confirm that each primary persona can complete key tasks with minimal confusion

- Identify UX friction in user onboarding, dashboard navigation, and goal planning

- Validate the usefulness and clarity of core features: 40/30/30 planner, quote generator, and income tracker

- Assess emotional response: confidence, confusion, delight, or overwhelm

  ***

  ### **Test Types**

| Type                 | Tools                      | Use Case                                                                      |
| -------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| **Scenario Testing** | Maze, Discord, Google Meet | Walk users through realistic tasks like “Send a Quote” or “Log Weekly Income” |
| **A/B Flow Testing** | Notion, Figma Prototypes   | Compare onboarding variants (Contractor vs General User)                      |
| **Heuristic Review** | Internal Expert Team       | Identify usability violations (e.g., visibility, error prevention)            |

---

### **Test Personas & Scenarios**

| Persona            | Scenario                            | Expected Outcome                                    |
| ------------------ | ----------------------------------- | --------------------------------------------------- |
| Darren (Trades)    | Sends a quote on mobile             | Quote is sent under 60 seconds with no guidance     |
| Jamal (Creative)   | Downloads income by project         | CSV downloaded with legible formatting              |
| Michelle (Gig)     | Checks safe-to-spend after gig sync | Real-time balance shown clearly                     |
| Rosa (Side Hustle) | Logs ad spend, sees net drop        | Profitability graph reflects change                 |
| Ty (Provider)      | Sets up a bill reminder             | Alert appears in timeline and reflects correct date |

---

### **Success Metrics**

| Category      | Metric                                          | Benchmark     |
| ------------- | ----------------------------------------------- | ------------- |
| Task Success  | % of users who complete task unaided            | 90%           |
| Efficiency    | Time to complete task (quote, goal setup, sync) | \< 1 minute   |
| Satisfaction  | Post-task score (1–5)                           | 4.0 or higher |
| Confusion     | % of users needing help or feedback logged      | \< 10%        |
| Insight Yield | \# of friction points uncovered per session     | ≥ 2           |

---

### **Test Outputs**

- **Usability Report CSV** (`usability-report-v1.csv`)  
   Logs each test run, persona, issue, resolution, and user quote

- **Design Improvement Log** (`design-improvements-list.md`)  
   Running list of UI/UX enhancements based on test results

- **Screen-Level Feedback** (`feedback-log.md`)  
   Documented pain points tied to specific screens or features

  ***

  ### **Testing Environment Setup**

- Dedicated Discord voice room for live testers

- Screen share in mobile emulator and real device

- Testers recruited from persona pools (Discord, Reddit, Upwork)

- Consent form and session recording consent logged in Notion

- ***

## **VIII. HANDOFF**

**Goal:** Seamlessly deliver finalized designs, assets, and documentation to the development process — ensuring clarity, accuracy, and developer readiness.

---

### **Developer Handoff Objectives**

- Ensure all designs are annotated and linked to behavior expectations

- Provide clean and organized assets with naming conventions

- Document all routes, logic, and component behavior clearly

- Align the UX intent with dev constraints and implementation expectations

  ***

  ### **Deliverables Provided to Dev Team**

| Deliverable                  | File Name / Tool            | Details                                                          |
| ---------------------------- | --------------------------- | ---------------------------------------------------------------- |
| **Annotated Screens**        | `component-guide.md`        | Includes spacing, font styles, states, and interactive behaviors |
| **Design Tokens & Assets**   | `dev-handoff-kit.zip`       | SVGs, PNGs, color variables, shadow specs, UI constants          |
| **Route \+ State Logic**     | `routes-flow.md`            | Lists all navigation paths and app states per user type          |
| **Design Version History**   | `version-history.json`      | Tracks version tags with change notes                            |
| **Dev Comments \+ Warnings** | In Figma or Cursor AI notes | Notes around limitations or logic alerts                         |
| **Integration Links**        | Figma-to-Cursor AI Sync     | Shared branch between design and front-end staging repo          |

---

### **Developer Spec Setup (Detailed)**

- **Component Spec View**  
   Each major feature (Quote Generator, Dashboard Cards, Calendar, Sync API cards) is broken into:
  - Responsive states (Mobile, Folded, Expanded)

  - Empty state vs success state

  - Error edge cases

- **Interaction Guidelines**
  - What happens on button tap/click

  - Transitions, delays, animation flags

  - What to prefill, auto-log, or ask for next

- **API Behavior Notes**
  - Stripe connect response expectations

  - Plaid-like fallback logic

  - Income sync frequency and error display logic

- **Design Library Tokens**
  - Used in: Tailwind/Chakra equivalents for font, spacing, shadows

  - Exported from Figma Token Plugin

  ***

  ### **Handoff Communication Channel**

- **Weekly Syncs** via Trello comments \+ Cursor AI Notes

- **All questions tracked** in `handoff-qa-thread.md`

- Shared Slack/Discord Room: `#stackzen-devhandoff`

  ***

  ### **Tools & Platform Alignment**

| Stage            | Tool                        |
| ---------------- | --------------------------- |
| Visual Review    | Figma Dev Mode              |
| Asset Delivery   | GitHub repo \+ Figma files  |
| Interaction Docs | Cursor AI w/ link injection |
| Feedback Capture | Notion \+ Trello tracking   |

- ***

## **IX. ITERATE**

**Goal:** Continuously refine StackZen based on usability feedback, bug reports, feature evolution, and real-world usage—ensuring the product remains useful, relevant, and delightful over time.

---

### **Iteration Strategy Overview**

StackZen follows a **continuous improvement model** driven by:

- Usability testing feedback (see Section V)

- Real user behavior from analytics

- Weekly internal QA retros

- User interviews \+ support requests

- Business strategy pivots

  ***

  ### **Iteration Principles**

| Principle                         | Description                                                                |
| --------------------------------- | -------------------------------------------------------------------------- |
| **User-Driven Design Evolution**  | Always prioritize user friction and clarity from analytics or session logs |
| **Rapid Feedback Loops**          | Weekly mini sprints based on user interviews and MVP usage findings        |
| **Feature Flag Control**          | Experimental features rolled out incrementally to prevent feature bloat    |
| **Change History Accountability** | All design and code updates are logged with notes for product clarity      |

---

### **Key Tasks per Iteration Cycle**

| Task                                   | Responsible Tool / File                   |
| -------------------------------------- | ----------------------------------------- |
| Maintain version change log            | `change-log-vX.md`                        |
| Update wireframes as needed            | `updated-wireframes.fig`                  |
| Annotate new behavior for developers   | `component-guide.md`                      |
| Update success criteria and tracking   | `success-metrics-kpi.xlsx`                |
| Retest previous fail points            | `usability-report-v2.csv`                 |
| Revisit onboarding performance metrics | Segment-based funnel testing in analytics |

---

### **Iteration Categories (Examples)**

| Area                | Common Triggers for Change                                            |
| ------------------- | --------------------------------------------------------------------- |
| Onboarding          | Drop-off after 1st or 2nd screen, misunderstood income sync logic     |
| Quote Builder       | Confusion around tax addition, duplicate contact creation             |
| Dashboard           | Misreading of “Safe to Spend” logic, desire for more visual insights  |
| Advisor Portal      | Need to show more mentor availability or category expertise filtering |
| Mobile Optimization | Layout bugs on fold phones or iPhone Mini                             |

---

### **Iteration Metrics Dashboard Sample (Coming in Section X)**

Will track:

- Funnel conversion drop-offs (per persona)

- Most common exit screens

- Heatmap of where users spend time

- Task completion time changes (quote → invoice → payment)

  ***

  ### **Version Tracking & History**

All major updates follow **semantic versioning** (MVP \= v1.0.0). Each sprint or release includes:

- Feature updates

- UX/UI improvements

- Known issues/fixes

- New design files or asset changes

| Version | Date           | Changes Summary                               |
| ------- | -------------- | --------------------------------------------- |
| v1.0.0  | June 20, 2025  | MVP Design Complete, Testing Begins           |
| v1.1.0  | July 20, 2025  | Updated Onboarding UX, Added Mentor Filtering |
| v1.1.1  | August 5, 2025 | Bug Fixes: Mobile Calendar, Quote Flow Speed  |

- ***

### **III. UX/UI Master Checklist**

**DISCOVER**

- **DEFINE**

- **IDEATE**

- **PROTOTYPE**

- **TEST**

- **HANDOFF**

- **ITERATE**

- ***

### **Project File Structure Suggestion**

/project-name

├── /docs

│ ├── persona-summary.md

│ ├── problem-statements.md

│ ├── usability-report-v1.csv

├── /design

│ ├── figma-wireframes.fig

│ ├── component-library.fig

├── /handoff

│ ├── dev-handoff-kit.zip

│ ├── style-guide.md

├── /feedback

│ ├── change-log-v1.md

│ ├── user-quotes.csv

---

### **Recommended Tools for Your Workflow**

| Phase     | Tools                             |
| --------- | --------------------------------- |
| Discover  | Google Forms, Typeform, Discord   |
| Define    | Notion, Miro, Canva               |
| Ideate    | UX Pilot, FigJam, Pen & Paper     |
| Prototype | Figma, Adobe XD                   |
| Test      | Maze, Zoom, Discord, UsabilityHub |
| Handoff   | Figma Dev Mode, GitHub            |
| Iterate   | Notion, Trello, Cursor AI         |

---

### **User Test Mapping Matrix**

| Persona                                 | Scenario                                          | Feature / Component        | Success Criteria                                                    |
| --------------------------------------- | ------------------------------------------------- | -------------------------- | ------------------------------------------------------------------- |
| **Darren – The Skilled Trades Hustler** |                                                   |                            |                                                                     |
|                                         | Sends a quote in under 1 minute                   | Mobile Quote Generator     | Quote is created, previewed, and sent without confusion             |
|                                         | Reviews weekly income by job type                 | Weekly Income Tracker      | Clear breakdown of paid vs unpaid jobs and total income             |
| **Jamal – The Freelance Creative**      |                                                   |                            |                                                                     |
|                                         | Filters income by client or project               | Earnings Dashboard         | Sorted results with tag filters and % of total income displayed     |
|                                         | Downloads a report for taxes                      | Export Function (PDF/CSV)  | Report is labeled, client-separated, and formatted for tax prep     |
| **Michelle – The Gig-Economy Operator** |                                                   |                            |                                                                     |
|                                         | Checks “Safe to Spend” amount in real-time        | Payout Sync \+ Spend Logic | Accurate reflection of synced gig payouts and daily balance         |
|                                         | Confirms if upcoming bills are covered            | Visual Bill Calendar       | Calendar visually indicates readiness status (green/red)            |
| **Rosa – The Side Hustle Builder**      |                                                   |                            |                                                                     |
|                                         | Logs business expense and sees updated net profit | Profitability View         | Net profit recalculates immediately after logging expenses          |
|                                         | Sets and tracks a monthly growth goal             | Goal Tracker               | Progress bar updates weekly to reflect earnings vs target           |
| **Ty – The Real-Life Provider**         |                                                   |                            |                                                                     |
|                                         | Sets up a bill alert in under 3 taps              | Reminder System            | Alert is scheduled and appears in timeline with configured reminder |
|                                         | Views weekly cash flow summary                    | Dashboard Timeline         | Weekly inflow/outflow displayed clearly to support budgeting        |

## **X. Usability Testing Plan**

**Goal:** Validate StackZen’s experience with real users across all key personas. Identify friction points, confusion moments, feature clarity gaps, and satisfaction drivers before scaling.

---

### **1\. Test Objectives**

- Determine if each persona can complete core workflows (quoting, tracking income, setting savings goals) without assistance

- Evaluate whether onboarding flows are clear for each user type (Contractor, Advisor, General User)

- Discover which features drive the most perceived value or confusion

- Gather user sentiment around AI vs. human mentor integration

---

### **2\. Test Audience & Segments**

| Persona                    | Scenario Focus                         | \# Testers Needed |
| -------------------------- | -------------------------------------- | ----------------- |
| Darren – Skilled Trades    | Quote creation, invoice sending        | 3                 |
| Jamal – Freelance Creative | Budgeting & export setup               | 3                 |
| Michelle – Gig Worker      | Income syncing, “Safe to Spend” logic  | 3                 |
| Rosa – Side Hustler        | Expense tracking, growth goal setting  | 3                 |
| Ty – Real-Life Provider    | Bill alerts, dashboard clarity         | 3                 |
| Advisor User               | Profile setup, client dashboard review | 2                 |

---

### **3\. Core Testing Scenarios**

| Test Scenario                                      | Target Feature                 | Success Criteria                                    |
| -------------------------------------------------- | ------------------------------ | --------------------------------------------------- |
| Create and send a quote in under 90 seconds        | Smart Quote Generator          | Sent without error; previewed with correct details  |
| Check real-time “Safe to Spend” balance after sync | Income API Sync \+ Spend Logic | Value matches user expectations and app logic       |
| Set and track monthly income growth goal           | Goal Tracker                   | Goal saved, progress bar reacts to weekly updates   |
| Export income report for taxes                     | PDF/CSV Export                 | File correctly labeled by client with totals        |
| Setup onboarding as a mentor or contractor         | Adaptive Onboarding Flow       | Completes in \<3 mins with accurate info collection |
| Receive bill alert \+ confirm payment readiness    | Timeline Alert System          | Alert received on time and actioned properly        |

---

### **4\. Testing Tools**

| Tool            | Purpose                                     |
| --------------- | ------------------------------------------- |
| Maze            | Remote user flow testing                    |
| Zoom            | Live moderated testing                      |
| Lookback / Loom | Screen \+ voice recording for review        |
| Discord         | Follow-up conversations \+ sentiment checks |
| Notion          | Insight logging & theme clustering          |

---

### **5\. Test Metrics Tracked**

| Metric                            | Target                 |
| --------------------------------- | ---------------------- |
| Task success rate                 | 90% or higher per flow |
| Time-on-task (quote, export)      | Under 90 sec avg       |
| Confusion markers (avg. per user) | \< 2 per session       |
| Net Promoter Score (NPS baseline) | 30+ starting threshold |
| Mentorship feature opt-in rate    | 60%+ during onboarding |

---

### **6\. Reporting & Deliverables**

| Output File                   | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `usability-report-v1.csv`     | Test-by-test breakdown of success, errors, blockers   |
| `feedback-log.md`             | Qualitative notes, quotes, and tester reactions       |
| `design-improvements-list.md` | Prioritized UX adjustments, grouped by flow & persona |
| `onboarding-ab-test-notes.md` | Learnings from variant flows per user type            |

## **XI. Metrics Dashboard UI Sketch**

**Goal:** Visualize a real-time performance and financial insights dashboard tailored for irregular earners. Prioritize clarity, at-a-glance understanding, and action-driven design.

---

### **1\. Purpose of the Dashboard**

To give users immediate visibility into their current financial health, performance across weeks/months, and actionable insights like cash flow gaps, bill readiness, and goal tracking.

This dashboard will also serve as a **lightweight analytics center** for:

- Daily “Safe to Spend”

- Weekly/Monthly Income vs Expenses

- Quote-to-Invoice completion ratio

- Goal progress and mentor engagement

---

### **2\. Dashboard Components**

| Component                     | Data Displayed                                                 | Actionable Function                                 |
| ----------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| **Safe to Spend Tile**        | Real-time cash after essentials                                | "Move Funds" or "Set Budget Limit" CTA              |
| **Weekly Inflow/Outflow**     | Graph of income vs expenses over 7 days                        | “View Details” → navigates to full budget log       |
| **40/30/30 Allocation Rings** | Visual rings for Need/Want/Save allocations                    | Tap to adjust targets or re-allocate in real time   |
| **Quote Status Summary**      | \# Quotes sent → converted → paid                              | CTA to resend, convert, or view overdue quotes      |
| **Savings Tracker**           | Current balance vs. savings goals (Emergency, Tools, Rent)     | Set or edit goal directly from tile                 |
| **Bill Alert Timeline**       | Upcoming payments timeline with readiness icons (✅ / ⚠️ / ❌) | Tap to see details, mark paid, or get mentor advice |
| **Mentor Chat Status**        | Active/Inactive connection, unread messages                    | Open chat or schedule follow-up                     |

---

### **3\. Design Principles**

- **Mobile-first** layout (first glance clarity, thumb-accessible CTAs)

- **Color-coded urgency**: Red \= overdue, Yellow \= near due, Green \= clear

- **Minimal cognitive load**: avoid financial jargon; use plain English

- **Personalized for user type**: Contractors see Quote tiles first, Gig users see Safe to Spend first

---

### **4\. UX Sketch (Verbal Layout)**

pgsql  
CopyEdit  
`---------------------------------------------`  
`| 💰 Safe to Spend: $325                     |`  
`| ----------------------------------------- |`  
`| 🔄 Inflow vs Outflow (Bar Chart)           |`  
`| Today  | This Week  | This Month          |`  
`| ----------------------------------------- |`  
`| 📊 40/30/30 Ring Visual                    |`  
`| [ Needs 40% ][ Wants 30% ][ Save 30% ]    |`  
`| ----------------------------------------- |`  
`| 📋 Quotes: 3 Sent | 2 Converted | 1 Paid  |`  
`| [View All]                                    |`  
`| ----------------------------------------- |`  
`| 📆 Upcoming Bills                           |`  
`| 🔴 Rent (Due in 2d)  ✅ Car Ins. (Paid)   |`  
`| ----------------------------------------- |`  
`| 💬 Mentor Chat: You have 1 unread reply   |`  
`---------------------------------------------`

---

### **5\. Output Files (To Be Created / Attached)**

| File                              | Purpose                                     |
| --------------------------------- | ------------------------------------------- |
| `metrics-dashboard-sketch.png`    | Visual wireframe of full dashboard layout   |
| `dashboard-metrics-priorities.md` | Notes on which metrics matter for each user |
| `dashboard-interaction-map.fig`   | Figma file with interactive states defined  |

## **XII. Developer Handoff Spec Setup**

**Goal:** Ensure smooth, error-free handoff between design and development by documenting all necessary specs, interactions, assets, and logic flows. The objective is to minimize ambiguity and reduce build time by giving developers all the resources they need in one place.

---

### **1\. Handoff Structure Overview**

| Component             | Details                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| **Design Files**      | High-fidelity Figma files, labeled layers, annotated spacing & behavior     |
| **Component Library** | Shared components for inputs, buttons, cards, modals (w/ states & variants) |
| **Design Tokens**     | Font styles, spacing units, color hex values, icon sets                     |
| **Interaction Notes** | Click, hover, input states; transitions (timing, direction, delay)          |
| **Page Flows**        | Defined user flow map with route logic and conditional views                |
| **Behavioral Rules**  | Error/success handling, dynamic field states, loading logic                 |

---

### **2\. Handoff File System Layout**

python  
CopyEdit  
`/handoff`  
`├── dev-handoff-kit.zip`  
`│   ├── components`  
`│   │   ├── Buttons.fig`  
`│   │   ├── Inputs.fig`  
`│   │   ├── Tiles.fig`  
`│   ├── pages`  
`│   │   ├── Dashboard.fig`  
`│   │   ├── InvoicePage.fig`  
`│   │   ├── MentorPortal.fig`  
`│   ├── states`  
`│   │   ├── Modal-Open.fig`  
`│   │   ├── Form-ValidationStates.fig`  
`│   ├── annotations`  
`│   │   ├── Spacing-Specs.md`  
`│   │   ├── ColorTokens.md`  
`│   ├── routes`  
`│   │   ├── page-map.json`  
`│   ├── assets`  
`│   │   ├── svg-icons/`  
`│   │   ├── logos/`  
`│   │   └── illustrations/`

---

### **3\. Platform-Specific Notes**

**Frontend Stack:**

- Next.js App Router

- Tailwind CSS

- TypeScript

- Supabase Auth

- Radix UI

- React Hook Form

- Storybook (for design system documentation)

**Integration Considerations:**

- All button, input, card, and modal components are reusable via props

- Auth-aware routes: e.g., `"/dashboard"` is protected

- Mobile-first breakpoints handled via Tailwind utilities

- Use Radix primitives for consistent state management (open/close, toggle, tooltip)

- Page-specific behavior defined in interaction notes `.md` files

---

### **4\. Handoff Deliverables**

| File                    | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `dev-handoff-kit.zip`   | All required assets, design tokens, & routes   |
| `component-guide.md`    | Describes interaction logic, states, and usage |
| `handoff-checklist.md`  | QA-ready dev guide with implementation notes   |
| `figma-inspection-link` | Shared view-only access to dev-inspect mode    |
| `style-guide.md`        | Brand guidelines, spacing rules, button styles |

---

### **5\. Handoff Checklist (Dev QA-Ready)**

- All component files grouped & named logically

- Each design element has spacing/margin annotations

- Component variants documented (hover, error, success)

- Form logic includes validation & default states

- Fonts, color palettes, tokens exported & referenced

- All exported assets available in SVG and PNG

- API response expectations mapped for each view

- Design team available for post-handoff Q\&A

## 👥 Personas (Validated and Complete)

### 🧰 1. Darren — The Skilled Trades Hustler

**Age:** 38  
**Gender:** Male  
**Ethnicity:** African-American  
**Education:** High School Diploma, Trade Certified  
**Location:** Atlanta, GA  
**Occupation:** Mobile Locksmith & Electronics Technician  
**Income Range:** $3,000–$6,000/month (fluctuates by job volume)

**Behavior:**

- Pays bills late due to job unpredictability
- Blends business and personal funds
- Avoids complex finance apps

**Goals:**

- Track quotes and invoices
- Understand real-time cash flow
- Save toward equipment upgrades

**Needs:**

- Mobile job tracker
- Income summary dashboard
- Quote-to-paid visibility

---

### 🎨 2. Jamal — The Freelance Creative

**Age:** 29  
**Gender:** Male  
**Ethnicity:** Afro-Caribbean  
**Education:** Bachelor’s in Media Arts  
**Location:** Orlando, FL  
**Occupation:** Freelance Web Designer / Developer  
**Income Range:** $2,500–$4,500/month

**Behavior:**

- Uses Notion, Canva, and Sheets for tracking
- Invoices through Stripe and PayPal
- Juggles 3–4 active clients

**Goals:**

- Manage project-specific cash flow
- Stay on top of tax responsibilities

**Needs:**

- Income forecasting by client/project
- Personal savings targets
- Automated profitability reports

---

### 🚗 3. Michelle — The Gig-Economy Operator

**Age:** 33  
**Gender:** Female  
**Ethnicity:** Latina  
**Education:** Some College  
**Location:** Dallas, TX  
**Occupation:** Uber, DoorDash, and Instacart Driver  
**Income Range:** $2,000–$3,500/month

**Behavior:**

- Tracks income with screenshots and notes
- Avoids traditional budgeting tools

**Goals:**

- Know earnings across all apps
- Prep for bills with confidence
- Understand “what’s safe to spend”

**Needs:**

- Auto-sync for gig payouts
- Daily and weekly income summaries
- Visual safe-to-spend indicator

---

### 🕯️ 4. Rosa — The Side Hustle Builder

**Age:** 35  
**Gender:** Female  
**Ethnicity:** Black & Filipina  
**Education:** Associate Degree + eCommerce Training  
**Location:** Charlotte, NC  
**Occupation:** HR Professional by day / Etsy Candle Seller by night  
**Income Range:** $1,500–$2,800/month (side income)

**Behavior:**

- Reinvests revenue into supplies and ads
- Lacks financial separation between personal and business funds

**Goals:**

- Understand her actual profitability
- Strategize long-term business growth

**Needs:**

- Expense tracking tools
- Net profit and margin clarity
- Growth roadmap features

---

### 👨‍👧‍👦 5. Ty — The Real-Life Provider

**Age:** 41  
**Gender:** Male  
**Ethnicity:** African-American  
**Education:** GED + Technical Certification  
**Location:** Detroit, MI  
**Occupation:** Janitor (part-time) + Weekend Rideshare Driver  
**Income Range:** $2,200–$3,200/month

**Behavior:**

- Supports two children with inconsistent cash flow
- Avoids most financial tools unless ultra-simple

**Goals:**

- Stay on top of bills without stress
- Build an emergency savings fund

**Needs:**

- Plain-language money guidance
- Visual cash timeline
- Automated bill & savings reminders

---

### 🔧 6. Anthony — The Founder & Core Use Case

**Age:** 38  
**Gender:** Male  
**Ethnicity:** African-American  
**Education:** Technical Certifications + Web Development Training  
**Location:** Atlanta, GA  
**Occupation:** Locksmith, Electrician, Web Developer (currently rebuilding income)  
**Income Range:** Currently inconsistent  
**Family:** Father of two (ages 18 and 16)

**Behavior:**

- Experienced anxiety from unpredictable income, overspending, and lack of clarity around finances
- Built StackZen to directly address the struggles he and others like him face
- Actively balancing parenting, trades work, and startup development

**Goals:**

- Track every dollar made, even irregular or gig-based
- Automate savings to support family, business ventures, and emergency funds
- Replace financial stress with peace of mind and structure
- Improve habits and build financial resilience despite unstable income

**Needs:**

- Budgeting that works with real-time earnings
- Tools that prioritize needs and limit overspending
- Subscription tracking and recurring expense management
- A system that helps him create a peaceful, purpose-driven life without financial guesswork

# 📐 StackZen UX Design System & Brand Guidelines

_“Peace of mind meets profit-minded.”_  
_Last updated: April 2025 — Supports Light + Dark Themes_

---

## 🧘 1. Core UX Values

- **Clarity** – Immediate understanding
- **Trust** – Calm UI, no surprises
- **Emotional Safety** – Affirming microcopy
- **Consistency** – Uniform UI behavior
- **Empowerment** – Tools that make users feel in control

---

## 🌈 2.

| Purpose      | Light Theme | Dark Theme | Tailwind Token  |
| ------------ | ----------- | ---------- | --------------- |
| Primary      | #5E2DEB     | #7F5CF1    | `bg-primary`    |
| Accent       | #4AE66C     | #3ECB5A    | `bg-accent`     |
| Background   | #FAFAFA     | #121212    | `bg-background` |
| Surface      | #FFFFFF     | #1E1E1E    | `bg-surface`    |
| Text Primary | #1F1F1F     | #EDEDED    | `text-default`  |
| Text Muted   | #4B5563     | #9CA3AF    | `text-muted`    |
| Highlight    | #F79C42     | #FFB34E    | `bg-highlight`  |

## Color System

## 🔠 3. Typography

| Use Case  | Font         | Weight  | Size    |
| --------- | ------------ | ------- | ------- |
| Headings  | Sora/DM Sans | 600–700 | 24–40px |
| Body Text | Inter        | 400–500 | 14–18px |
| Captions  | Inter        | 300–400 | 12–14px |
| AI Quotes | Inter Italic | 400     | 14–16px |

---

## 📐 4. Layout & Spacing

- Base: 8px spacing system
- Page Max Width: `max-w-7xl`
- Grid: 12 columns responsive
- Cards: `p-6` main, `p-4` compact
- Mobile-first design priority

---

## 🧩 5. Components

| Component | Behavior                                 |
| --------- | ---------------------------------------- |
| Buttons   | Rounded, bold colors, clear hover states |
| Inputs    | Always show hint & success feedback      |
| Dropdowns | Radix UI-based, animated                 |
| Modals    | Centered (desktop), full width (mobile)  |
| Toasts    | Slide-up, icons (✅, 🚨, 💬), 5s timeout |
| Alerts    | Colored accent, subtle borders           |

---

## 🧠 6. Zen AI Experience

### Chat Panel

- Tone bubbles: Calm, Coach, Direct
- Phrases trigger context-aware responses

### Reflection Panel

- Weekly wins + struggles
- Micro-goals and affirmations

---

## 🗺️ 7. UX Flows

### Onboarding

- 3 steps max, autosave, supportive copy

### Quotes

- Step form → 3-option results
- Show total, profit, AI strategy

### Calendar

- Drag + drop bills
- Smart priority color logic

### Invoicing

- Client + items
- Auto-total, Stripe or manual payment logging

---

## 🔐 8. Accessibility & Trust

- All colors WCAG AA pass
- Keyboard navigable
- ARIA-compliant
- Transparent data handling
- Scoped AI memory by user

---

## 🎨 9. Emotional UI Touches

- “You’re doing better than you think 💜”
- End-of-month Zen Recap
- Micro animations (waves, coins)
- Friendly empty states and errors

---

## 🛠 10. Tools Stack

- **Next.js 15.3.1 (App Router)**
- **Tailwind 3.4.1 + Radix UI**
- **Framer Motion + Storybook**
- **Drizzle ORM + NeonDB**
- **OpenAI, Claude, Perplexity AI**
- **Stripe (Online + Terminal)**

---

# 💎 StackZen Value Propositions

## ✨ What Makes StackZen Different

StackZen isn’t just a budgeting tool — it’s a _peace-of-mind_ platform tailored for real-life income chaos. Built by and for tradespeople, gig workers, and side hustlers, it’s designed to meet the emotional and financial needs of people whose income isn’t consistent or predictable.

---

## 🧠 1. Built for Irregular Income

Most financial apps assume a fixed paycheck. StackZen is different.

- Tracks earnings from multiple jobs, gigs, and payments
- Forecasts and visualizes cash flow gaps
- Reacts to income as it comes in — not as a calendar dictates

---

## 🧘 2. Financial Calm, Not Stress

- “Safe-to-Spend” calculation that adjusts dynamically
- Supportive tone throughout the app — no shaming, no scolding
- Built-in Zen AI assistant offers real-time feedback, not rules

---

## 🧩 3. Modular + Custom Fit

- Use only what you need: quotes, goals, invoices, cash flow — each modular
- Personalized onboarding sets up the ideal experience
- Zen adapts over time based on behavior and needs

---

## 🗣️ 4. Mentor Access for Real-Life Support

- In-app financial mentors available for short sessions or full coaching
- Users can browse mentor specialties and choose based on goals
- StackZen doesn’t just give data — it provides direction

---

## 📊 5. Visual Financial Thinking

- Visual timelines, highlight color states, and income snapshot tiles
- Weekly recaps and monthly performance summaries
- Clear quote-to-paid conversion flows

---

## 🔐 6. Values-Driven Data Design

- AI doesn’t take over — it empowers
- Users control how AI responds and what it remembers
- No overwhelming spreadsheets — just practical flows

---

## 👥 7. Designed for the Underserved Majority

- Built from lived experience (founder is a working tradesman + dev)
- Focused on people left out by banks and traditional finance apps
- Actively co-designed with real users via feedback, mentoring, and testing

---
