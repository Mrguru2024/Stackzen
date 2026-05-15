## 🔧 `cursor-ai-instructional.md`

### Purpose: Code Cleanup, Performance Optimization, and Load Time Enhancements

---

## ✅ Objective

Optimize the codebase for:

- Faster page and component load time
- Code splitting efficiency
- Image loading performance
- Unused code/scripts/variables cleanup
- Reduced bundle size
- Seamless, high-quality user experience

---

## 🧠 Strategy Overview

### 1. **Codebase Scan & Audit**

**Goal:** Identify inefficiencies in structure, imports, and unnecessary complexity.

**Cursor AI Tasks:**

- Traverse all `.tsx`, `.ts`, and `.js` files inside `/app`, `/components`, `/lib`, `/hooks`, and `/pages`.
- Flag:
  - Duplicate logic or styles
  - Large components (over 250 lines) for splitting
  - Functions/variables declared but not used
  - Any console logs or `debugger` left in production

---

### 2. **Code Splitting & Component Isolation**

**Goal:** Ensure atomic, lazy-loaded, reusable components.

**Cursor AI Tasks:**

- Convert large pages/components into smaller isolated components inside `/components/ui`, `/components/layout`, or `/components/modules`.
- Use **dynamic imports** where appropriate:
  ```ts
  const DashboardChart = dynamic(() => import('@/components/charts/DashboardChart'), {
    ssr: false,
  });
  ```
- Apply **React.Suspense** wrappers when loading components that fetch or rely on async resources.

---

### 3. **Image Optimization**

**Goal:** Serve responsive, optimized images for better performance.

**Cursor AI Tasks:**

- Replace all `<img>` tags with Next.js `<Image />` component.

  ```tsx
  import Image from 'next/image';

  <Image src="/assets/user-avatar.png" alt="User Avatar" width={64} height={64} priority={true} />;
  ```

- Audit images for:
  - Proper sizing (not scaling large images via CSS)
  - WebP or AVIF usage
  - Add `blurDataURL` and `placeholder="blur"` for UX smoothness

---

### 4. **Script & Dependency Optimization**

**Goal:** Remove unused libraries, reduce bundle bloat, defer non-critical scripts.

**Cursor AI Tasks:**

- Audit `package.json` and `/node_modules`:
  - Remove unused npm packages
  - Tree-shake unused exports using `sideEffects: false` where possible
- Move scripts like analytics, support chat, etc., to lazy load using:
  ```ts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://example.com/script.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);
  ```

---

### 5. **Remove Dead Code & Variables**

**Goal:** Clean out all technical debt and unreachable logic.

**Cursor AI Tasks:**

- Use AST parsing or regex matching to:
  - Identify and delete all `const` or `let` variables that are declared but never used
  - Detect commented-out code blocks not modified in the last 30 days
  - Remove any routes or files not imported or registered in the App Router

---

### 6. **Performance Enhancements**

**Goal:** Achieve Core Web Vitals excellence and app speed.

**Cursor AI Tasks:**

- Enable **Turbopack** (Next.js 15+ projects)
- Check for preloading of fonts:
  ```tsx
  <link
    rel="preload"
    href="/fonts/inter.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
  ```
- Apply `prefetch={false}` or conditional loading on `<Link />` for below-the-fold pages

---

### 7. **Page-Level Optimization**

**Goal:** Prioritize meaningful paint and perceived speed.

**Cursor AI Tasks:**

- Set `priority={true}` on all above-the-fold images
- Ensure critical CSS is embedded or delivered via Tailwind’s JIT compiler
- Remove redundant metadata and `<head>` content not used in production

---

## 🧼 Output Requirements

### 1. **Changelog**

- Summarize:
  - Files cleaned
  - Packages removed
  - Components split
  - Images optimized

### 2. **Pull Request Comment Template**

```md
### ✅ Optimization Summary

- Codebase scanned and cleaned
- Split large components into atomic parts
- Lazy-loaded non-critical scripts & components
- Removed unused variables/scripts
- Improved image performance using Next.js `<Image />`
- Bundle size reduced by **X%**

Please test all pages and report any UI/UX anomalies.
```

---

## 🔁 Execution Cycle

**Frequency:** Run this optimization routine:

- Before every major release
- After 30+ merged PRs
- When switching UI libraries or routing strategies
