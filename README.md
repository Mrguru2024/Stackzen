# StackZenDemo

A modern, modular, and compliant financial wellness platform built with Next.js, Tailwind CSS, Zustand, React Query, NextAuth.js, and Prisma.

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **State Management:** Zustand, React Query
- **Authentication:** NextAuth.js
- **Database:** Prisma ORM with PostgreSQL or MySQL
- **Component Pattern:** Modular Component Pattern (MCP)
- **Testing:** Jest, React Testing Library, Storybook
- **Compliance:** AI compliance middleware, logging, opt-out, explainability (see `/docs`)

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in required values.

3. **Run the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Run tests:**

   ```bash
   npm run test
   # or
   yarn test
   ```

5. **Run Storybook:**
   ```bash
   npm run storybook
   # or
   yarn storybook
   ```

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - Modular UI components (each in its own folder)
- `/lib` - Shared logic, Zustand store, utils, validations
- `/docs` - Compliance, SDLC, UX, and requirements documentation
- `/prisma` - Prisma schema and migrations

## Contribution Guidelines

- Use TypeScript interfaces for all props.
- All components must be responsive and dark-mode ready.
- Use Tailwind CSS for styling.
- Add tests and stories for every component.
- Place reusable logic in `/lib` or `/utils`.
- Follow compliance and UX guidelines in `/docs`.
- Format and lint with Prettier + ESLint.

## Compliance & AI

- AI usage is logged and monitored per `/docs/stackzen-ai-compliance-and-algorithm.md`.
- Users can opt out of AI features and request data deletion.
- All suggestions are non-directive; human mentorship is always available.

---

For more details, see the `/docs` directory.
