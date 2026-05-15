# 🧲 StackZen Gigs: Curated Feed Integration Guide - Updated June 2025

**Objective:**  
Ingest high-quality gig/job opportunities for tradespeople, freelancers, and service pros inside the StackZen platform.  
Use automation via API or RSS when possible. Use scraping only when explicitly allowed.

**Status: 🔄 PLANNED - Next Phase Development**

---

## ✅ Cursor Agent Instructions (Prisma + PostgreSQL)

### Step 1: Configure Scheduled Job Fetching (PLANNED)

For each feed source below:

- Pull new listings every 4–12 hours using a CRON job or serverless function.
- Normalize results to schema: `title`, `platform`, `link`, `description`, `location`, `posted_at`, `category`, `trade_type`.
- De-dupe based on `title + link + source`.
- Store in PostgreSQL via Prisma.

---

## 🔗 Gig Sources by Category (High-Quality, Proven Sources)

### 🔧 Web Dev / Tech

- ✅ [Freelancer API](https://developers.freelancer.com/)
- ✅ [WeWorkRemotely RSS](https://weworkremotely.com/categories/remote-programming-jobs.rss)
- ✅ [RemoteOK RSS](https://remoteok.com/remote-dev-jobs.rss)
- ✅ [AuthenticJobs RSS](https://authenticjobs.com/rss/index.xml)

### 📢 Marketing

- ✅ [PeoplePerHour API](https://developer.peopleperhour.com/)
- ✅ [Remotive RSS](https://remotive.io/remote-jobs/marketing.rss)

### ✍️ Copywriting

- ✅ [ProBlogger RSS](https://problogger.com/jobs/feed/)
- ✅ [FreelanceWriting RSS](https://www.freelancewriting.com/jobs/feed/)
- ✅ [PeoplePerHour API](https://developer.peopleperhour.com/)

### 🎥 Video Editing

- ✅ [Mandy RSS](https://www.mandy.com/jobs/rss)
- ✅ [ProductionHUB RSS](https://www.productionhub.com/job/rss)

### 📷 Photography

- ✅ [Indeed Photography Jobs](https://www.indeed.com/jobs?q=photographer)
- ✅ Craigslist (filter for relevant cities & categories)

### 💈 Beauty Services

- ✅ Craigslist (beauty gigs filtered by location)

### 🌿 Yard / Landscaping

- ✅ Craigslist (labor gigs)
- ✅ TaskRabbit (if local HTML feed is available)

### 🔧 Mechanics / Mobile Auto

- ✅ [YourMechanic](https://www.yourmechanic.com/careers)
- ✅ [Indeed - Mobile Mechanic](https://www.indeed.com/q-Mobile-Mechanic-jobs.html)
- ✅ [Wrench.com](https://wrench.com/careers/) — scrape only if publicly listed

### ✍️ Editing & Publishing

- ✅ [FreelanceEditingJobs RSS](https://www.freelancewriting.com/jobs/editing-jobs/feed/)
- ✅ [PeoplePerHour API](https://developer.peopleperhour.com/)

### 🛠️ General Skilled Trades

- ✅ [Thumbtack (manual listing or scrape)]
- ✅ [TaskRabbit public categories]
- ✅ [Local city job boards or government RSS]

---

## 🧱 Prisma Model Suggestion (PLANNED)

```prisma
model Gig {
  id          String   @id @default(cuid())
  title       String
  description String?
  link        String
  source      String
  category    String
  tradeType   String
  location    String?
  postedAt    DateTime @default(now())
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model GigApplication {
  id        String   @id @default(cuid())
  gigId     String
  gig       Gig      @relation(fields: [gigId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  status    ApplicationStatus @default(PENDING)
  appliedAt DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}
```

---

## 🧠 Implementation Tips (PLANNED)

- Use `feedparser`, `axios`, or `cheerio` with serverless functions.
- Use cron triggers or scheduled jobs to refresh feeds regularly.
- Store only jobs posted within the last 48 hours unless marked evergreen.
- Use `expiresAt` to hide outdated gigs.
- Integrate with existing income tracking system.

---

## 🎯 Integration with Current System (PLANNED)

### Income Hub Integration

- Connect gig applications to income tracking
- Track application success rates
- Monitor income from different gig sources

### Mentor System Integration

- Mentors can provide guidance on gig applications
- Session topics can include gig strategy
- Track mentor recommendations for gig success

### Analytics Integration

- Track gig application patterns
- Monitor income from different gig sources
- Analyze successful application strategies

---

## 🚀 Development Timeline (PLANNED)

### Phase 1: Basic Gig Feed (Q3 2025)

- [ ] Set up gig data models
- [ ] Implement RSS feed parsing
- [ ] Create gig listing UI
- [ ] Basic search and filtering

### Phase 2: Application Tracking (Q4 2025)

- [ ] Gig application system
- [ ] Application status tracking
- [ ] Integration with income tracking
- [ ] Success rate analytics

### Phase 3: Advanced Features (Q1 2026)

- [ ] AI-powered gig matching
- [ ] Application automation
- [ ] Mentor integration
- [ ] Advanced analytics

---

## ⚠️ Avoid These Without Permission

❌ Fiverr  
❌ Upwork  
❌ GrowthGig  
❌ Booksy  
❌ Any non-compliant scraping target

---

## 📊 Success Metrics (PLANNED)

### User Engagement

- Gig views and applications
- Time spent browsing gigs
- Application success rates

### Platform Value

- Income generated from gigs
- User retention with gig features
- Mentor session conversion from gig guidance

---

**Maintainer:** Anthony Feaster  
**Last Updated:** June 22, 2025  
**Status:** Planned for Next Development Phase  
**Module:** StackZen Gigs – Feed Integration
