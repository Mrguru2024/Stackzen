# StackZen Mentor System - Complete Implementation Guide

## Overview

The StackZen Mentor System is a comprehensive platform that connects users with certified financial mentors through two primary coaching models:

1. **StackZen Certified Sessions** - 30-minute, fixed-price sessions ($65)
2. **Direct Mentor Bookings** - Flexible sessions with custom pricing

## Features Implemented

### ✅ Core Features

- **Mentor Directory** - Browse and filter mentors by specialty, rating, and availability
- **Profile System** - Detailed mentor profiles with credentials, specialties, and reviews
- **Booking System** - Multi-step booking flow with Stripe integration
- **Video Sessions** - Daily.co integration for secure video calls
- **Session Management** - Track session status, ratings, and feedback
- **Admin Panel** - Mentor application review and management
- **Analytics Dashboard** - Platform performance metrics and insights

### ✅ Advanced Features

- **Email Notifications** - Automated emails for confirmations, reminders, and feedback
- **Session Rating System** - Post-session rating and feedback collection
- **Mobile Optimization** - Responsive design for mobile devices
- **Payment Processing** - Stripe integration with tiered fee structure
- **Mentor Application Flow** - Multi-step application process

## Technical Architecture

### Frontend Components

```
components/mentors/
├── MentorDirectory/
│   ├── MentorCard.tsx
│   ├── MentorCardMobile.tsx
│   ├── MentorFilters.tsx
│   └── MentorSearch.tsx
├── MentorProfile/
│   ├── MentorProfileModal.tsx
│   └── MentorReviews.tsx
├── BookingFlow/
│   ├── BookingFlow.tsx
│   ├── BookingFlowMobile.tsx
│   └── SessionConfirmation.tsx
├── VideoSession/
│   └── VideoRoom.tsx
├── SessionRating/
│   └── SessionRatingForm.tsx
└── MentorDashboard/
    ├── MentorDashboard.tsx
    └── SessionHistory.tsx
```

### API Routes

```
app/api/
├── mentors/
│   ├── route.ts (GET, POST)
│   ├── [mentorId]/route.ts (GET, PUT, DELETE)
│   ├── sessions/route.ts (GET, POST)
│   ├── sessions/[sessionId]/route.ts (GET, PUT, DELETE)
│   ├── sessions/[sessionId]/rate/route.ts (POST)
│   └── video/route.ts (POST)
├── admin/
│   └── mentors/route.ts (GET, PUT)
├── analytics/
│   └── route.ts (GET)
├── notifications/
│   └── email/route.ts (POST)
└── stripe/
    └── payment/route.ts (POST)
```

### Database Schema

```sql
-- Mentor Models
model Mentor {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  bio             String
  specialties     String[]
  hourlyRate      Float
  isActive        Boolean  @default(true)
  isCertified     Boolean  @default(false)
  isVerified      Boolean  @default(false)
  status          MentorStatus @default(PENDING)
  averageRating   Float    @default(0)
  totalRatings    Int      @default(0)
  totalSessions   Int      @default(0)
  stripeAccountId String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  sessions        MentorSession[]
  reviews         MentorReview[]
  resources       MentorResource[]
}

model MentorSession {
  id          String   @id @default(cuid())
  mentorId    String
  mentor      Mentor   @relation(fields: [mentorId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  sessionType SessionType
  amount      Float
  status      SessionStatus @default(PENDING)
  scheduledAt DateTime
  duration    Int      // in minutes
  meetingUrl  String?
  meetingId   String?
  rating      Int?
  feedback    String?
  ratedAt     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@stackzen.com

# Daily.co Configuration
DAILY_API_KEY=your-daily-api-key
DAILY_API_URL=https://api.daily.co/v1

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 3. Install Dependencies

```bash
npm install @daily-co/daily-js nodemailer @types/nodemailer --legacy-peer-deps
```

## Usage Guide

### For Users

1. **Browse Mentors** - Visit `/mentors` to see available mentors
2. **Filter & Search** - Use filters to find mentors by specialty, rating, or price
3. **View Profiles** - Click on mentor cards to see detailed profiles
4. **Book Sessions** - Choose between StackZen sessions ($65/30min) or direct bookings
5. **Join Video Calls** - Use the provided meeting link for your session
6. **Rate Sessions** - Provide feedback after session completion

### For Mentors

1. **Apply** - Submit application at `/mentors/apply`
2. **Complete Onboarding** - Set up Stripe Connect and availability
3. **Manage Sessions** - View upcoming sessions and earnings
4. **Track Performance** - Monitor ratings and feedback

### For Admins

1. **Review Applications** - Visit `/admin/mentors` to review pending applications
2. **Manage Mentors** - Approve, reject, or certify mentors
3. **View Analytics** - Monitor platform performance at `/analytics`

## Payment Structure

### StackZen Sessions

- **User Price**: $65 per session
- **Mentor Payout**: $40 per session
- **Platform Fee**: ~$23 (minus Stripe fees)
- **Duration**: 30 minutes (enforced)

### Direct Bookings

- **Mentor Sets Price**: $75-$300+
- **Platform Fees**:
  - $1-$149: 9.9%
  - $150-$299: 7.9%
  - $300+: 4.9%
  - Subscriptions: 5.9%

## Email Templates

The system includes automated emails for:

- Session confirmations
- Session reminders (24h before)
- Session completion with rating request
- Mentor application received
- Mentor application approved

## Mobile Optimization

The system is fully responsive with:

- Mobile-optimized mentor cards
- Touch-friendly booking flow
- Responsive video interface
- Mobile navigation

## Security Features

- **Authentication** - NextAuth.js integration
- **Authorization** - Role-based access control
- **Payment Security** - Stripe secure payment processing
- **Video Security** - Daily.co encrypted video calls
- **Data Protection** - GDPR-compliant data handling

## Monitoring & Analytics

### Key Metrics Tracked

- Total sessions and revenue
- Mentor performance ratings
- Platform growth trends
- Popular specialties
- User engagement metrics

### Admin Dashboard Features

- Real-time analytics
- Mentor performance tracking
- Revenue reporting
- User behavior insights

## Deployment Checklist

### Pre-deployment

- [ ] Set up production environment variables
- [ ] Configure Stripe webhooks
- [ ] Set up Daily.co production account
- [ ] Configure email service
- [ ] Test payment flows
- [ ] Verify video call functionality

### Post-deployment

- [ ] Monitor error logs
- [ ] Track payment success rates
- [ ] Monitor video call quality
- [ ] Review user feedback
- [ ] Optimize performance

## Troubleshooting

### Common Issues

1. **Video calls not working** - Check Daily.co API key and room creation
2. **Payment failures** - Verify Stripe configuration and webhooks
3. **Email not sending** - Check SMTP configuration
4. **Database errors** - Ensure Prisma schema is up to date

### Support

For technical support, check:

- Application logs
- Stripe dashboard
- Daily.co dashboard
- Email service logs

## Future Enhancements

### Planned Features

- [ ] AI-powered mentor matching
- [ ] Advanced scheduling with calendar integration
- [ ] Group sessions and workshops
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Integration with financial planning tools

### Performance Optimizations

- [ ] Implement caching for mentor listings
- [ ] Optimize database queries
- [ ] Add CDN for static assets
- [ ] Implement lazy loading for images
- [ ] Add service worker for offline functionality

---

This mentor system provides a complete, production-ready solution for connecting users with financial mentors. The modular architecture allows for easy customization and future enhancements.
