# 💸 StackZen Stripe Connect Integration Guide - Updated June 2025

This guide enables a Cursor AI agent (or developer) to integrate Stripe Connect into StackZen, allowing:

- Contractors to onboard with Stripe
- Invoices to be paid by buyers
- Platform fees collected by StackZen automatically
- Mentor payments and session management

**Status: ✅ IMPLEMENTED - Production Ready**

---

## 🧱 Tech Stack (IMPLEMENTED)

- Frontend: Next.js 15.4.0 + Tailwind CSS ✅
- Backend: API Routes (Node) ✅
- ORM: Prisma with PostgreSQL ✅
- Payments: Stripe Connect (Standard accounts, Hosted onboarding) ✅

---

## 🔑 Step 1: Environment Setup (COMPLETED ✅)

Added to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_RETURN_URL=https://stackzen.app/return
NEXT_PUBLIC_REFRESH_URL=https://stackzen.app/refresh
```

Stripe SDK installed:

```bash
npm install stripe@18.1.1
```

---

## 🧬 Step 2: Prisma Model Update (IMPLEMENTED ✅)

Updated `prisma/schema.prisma`:

```prisma
model User {
  id               String   @id @default(cuid())
  email            String   @unique
  name             String?
  stripeCustomerId String?
  stripeAccountId  String?  // Stripe Connect account ID
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

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
  stripeAccountId String?  // Stripe Connect account ID
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

Migration completed:

```bash
npx prisma migrate dev --name add-stripe-connect
```

---

## 🧩 Step 3: Backend API Routes (IMPLEMENTED ✅)

### ✅ Create Connected Account

📄 `app/api/stripe/connect/route.ts`
Creates a Stripe account and returns `accountId`.

### ✅ Create Account Link

📄 `app/api/stripe/connect/link/route.ts`
Generates a Stripe-hosted onboarding URL.

### ✅ Payment Processing

📄 `app/api/stripe/payment/route.ts`
Handles mentor session payments with platform fees.

### ✅ Webhook Handler

📄 `app/api/stripe/webhook/route.ts`
Processes Stripe webhook events for payment status updates.

---

## 🧑‍🎨 Step 4: Frontend UI (IMPLEMENTED ✅)

### ✅ StripeOnboardButton

📄 `components/StripeOnboardButton.tsx`  
Triggers the onboarding sequence. Button label: `Connect Stripe Account`

### ✅ Payment Integration

�� `components/mentors/BookingFlow/PaymentForm.tsx`
Handles session payment processing with Stripe Elements.

---

## 📺 Step 5: Redirect Pages (IMPLEMENTED ✅)

### ✅ After Onboarding

📄 `app/return/page.tsx`  
Shows success message and payment readiness.

### ✅ Onboarding Expired

📄 `app/refresh/page.tsx`  
Handles expired/failed onboarding sessions with a retry link.

---

## 💰 Step 6: Invoice Payment API (IMPLEMENTED ✅)

📄 `app/api/stripe/payment/route.ts`

```typescript
import { stripe } from @/lib/stripe;

export async function POST(request: Request) {
  const { amount, mentorStripeAccountId, sessionId } = await request.json();

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: usd,
      application_fee_amount: calculatePlatformFee(amount),
      transfer_data: {
        destination: mentorStripeAccountId,
      },
      metadata: {
        sessionId,
        type: mentor_session
      }
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function calculatePlatformFee(amount: number): number {
  // Tiered fee structure
  if (amount <= 149) return Math.round(amount * 0.099 * 100);
  if (amount <= 299) return Math.round(amount * 0.079 * 100);
  return Math.round(amount * 0.049 * 100);
}
```

---

## 📡 Step 7: Stripe Webhook Handler (IMPLEMENTED ✅)

📄 `app/api/stripe/webhook/route.ts`

```typescript
import { stripe } from @/lib/stripe;
import { prisma } from @/lib/prisma;
import { headers } from next/headers;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get(stripe-signature)!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return Response.json({ error: Webhook signature verification failed }, { status: 400 });
  }

  switch (event.type) {
    case payment_intent.succeeded:
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case account.updated:
      const account = event.data.object;
      await handleAccountUpdate(account);
      break;

    case checkout.session.completed:
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
  }

  return Response.json({ received: true });
}

async function handlePaymentSuccess(paymentIntent: any) {
  const sessionId = paymentIntent.metadata.sessionId;

  if (sessionId) {
    await prisma.mentorSession.update({
      where: { id: sessionId },
      data: {
        status: COMPLETED,
        updatedAt: new Date()
      }
    });
  }
}
```

---

## 🎯 Mentor System Integration (IMPLEMENTED ✅)

### ✅ Mentor Payment Flow

1. User books mentor session
2. Stripe payment processed with platform fee
3. Mentor receives payout via Stripe Connect
4. Session status updated in database
5. Email notifications sent

### ✅ Platform Fee Structure

| Price Range   | StackZen Fee |
| ------------- | ------------ |
| $1–$149       | 9.9%         |
| $150–$299     | 7.9%         |
| $300+         | 4.9%         |
| Subscriptions | 5.9%         |

### ✅ Session Types

- **StackZen Sessions**: $65 fixed price, 30-minute duration
- **Direct Bookings**: Variable pricing set by mentor

---

## ✅ Final Checklist (COMPLETED ✅)

- [x] Stripe Connect account created
- [x] Account Link onboarding implemented
- [x] Stripe onboarding success/fail routes built
- [x] Tiered fee logic in place using `application_fee_amount`
- [x] Webhook handler connected to update session/payment status
- [x] Mentor payment processing implemented
- [x] Email notifications for payment events
- [x] Admin panel for payment monitoring
- [x] Analytics dashboard for revenue tracking

---

## 🚀 Production Deployment Notes

### ✅ Ready for Production

- [x] All Stripe integrations tested
- [x] Webhook endpoints configured
- [x] Payment processing verified
- [x] Error handling implemented
- [x] Security measures in place

### 🔧 Production Setup Required

1. **Stripe Dashboard Configuration**
   - Set up production API keys
   - Configure webhook endpoints
   - Set up Connect accounts for mentors

2. **Environment Variables**

   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. **Webhook Configuration**
   - Configure webhook endpoints in Stripe dashboard
   - Test webhook delivery
   - Monitor webhook events

---

**Maintainer:** Anthony Feaster  
**Last Updated:** June 22, 2025  
**Status:** Production Ready - All Stripe integrations implemented and tested  
**Use Case:** Marketplace payment processing for contractors and mentors using StackZen
