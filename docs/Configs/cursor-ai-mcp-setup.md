# 🧠 CURSOR AI AGENT MCP SETUP (FULL INSTRUCTIONAL + BOOTSTRAP SCRIPT)

## OBJECTIVE

Always follow the Modular Component Pattern (MCP) structure for all features, services, hooks, and components. Use proper tooling, linting, and file placement. Auto-split logic where necessary, use aliases for cleaner imports, and ensure scalability.

## FOLDER STRUCTURE RULES

Use the following structure in every Next.js App Router project:

```
/app
  └── layout.tsx
  └── page.tsx
/components
  └── ui/
  └── [feature-name]/
      └── Header.tsx
      └── SummaryPanel.tsx
/hooks
  └── useFeatureName.ts
/services
  └── [feature]Service.ts
/lib
  └── utils.ts
/constants
  └── finance.ts
/styles
  └── globals.css
```

## TOOLING TO INSTALL

Install and configure the following tools:

- ✅ Tailwind CSS
- ✅ Prettier
- ✅ ESLint
- ✅ React Hook Form
- ✅ Zod
- ✅ TanStack React Query
- ✅ Radix UI
- ✅ TypeScript aliases
- ✅ Storybook (optional)

## MCP BOOTSTRAP SCRIPT (RUN IN TERMINAL)

Create a file named `init-mcp.sh`, paste the following content, and run it in the root of your project:

```bash
#!/bin/bash

echo "🔧 Setting up MCP Project Structure..."

mkdir -p components/ui
mkdir -p components/dashboard
mkdir -p hooks
mkdir -p services
mkdir -p lib
mkdir -p constants
mkdir -p styles

echo "📦 Installing packages..."
npm install tailwindcss postcss autoprefixer \
eslint prettier eslint-config-prettier \
eslint-plugin-tailwindcss \
react-hook-form zod @hookform/resolvers \
@tanstack/react-query radix-ui \
@prisma/client @emotion/react \
class-variance-authority lucide-react \
typescript tsx --save

npx tailwindcss init -p

echo "✅ Creating config files..."

cat > .prettierrc <<EOL
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "all"
}
EOL

cat > .eslintrc.json <<EOL
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
  "plugins": ["@typescript-eslint", "tailwindcss"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn"],
    "tailwindcss/classnames-order": "warn"
  }
}
EOL

cat > tailwind.config.ts <<EOL
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#E0F2FE',
          DEFAULT: '#38BDF8',
          dark: '#0C4A6E',
        },
      },
    },
  },
  plugins: [],
};
export default config;
EOL

cat > tsconfig.json <<EOL
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@components/*": ["components/*"],
      "@hooks/*": ["hooks/*"],
      "@services/*": ["services/*"],
      "@lib/*": ["lib/*"],
      "@constants/*": ["constants/*"]
    },
    "jsx": "preserve",
    "esModuleInterop": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOL

echo "✅ MCP setup complete. Ready to build with Cursor AI."
```

### To run:

```bash
chmod +x init-mcp.sh && ./init-mcp.sh
```

This script installs all dependencies, creates the folder structure, and sets up the config files.

## CURSOR AI INSTRUCTIONAL

When using Cursor, follow this pattern:

- All features are split by MCP: `/components/feature/`, `/hooks/`, `/services/`
- Use Tailwind CSS for all styling
- Use TypeScript and prop interfaces
- Add JSDoc-style comments for functions and components
- Use `zod` + `react-hook-form` for forms
- Use `@tanstack/react-query` for async data hooks
- All imports should use path aliases like `@components`, not `../../../`

### Use this prompt inside Cursor:

```
Use Modular Component Pattern. Split features into components, hooks, and services. Maintain folders as shown. Use Tailwind. Write clean, reusable code with TypeScript, prop types, and aliases. Suggest component extractions and custom hooks. Avoid inline styles. Use zod for validation.
```

### Example task:

**“Split this dashboard page into components using MCP.”**

Expected file outputs:

- `components/dashboard/Header.tsx`
- `components/dashboard/SummaryPanel.tsx`
- `hooks/useDashboardData.ts`
- `services/dashboardService.ts`

## FINAL NOTES

- Always reload this `.cursor-ai-mcp-setup.md` when opening a new project
- Load `init-mcp.sh` first to scaffold the structure
- Maintain strict folder boundaries and use path aliases
- Output real usable code with zero placeholders

✅ MCP setup is now standardized, repeatable, and fully automatable for all Cursor AI projects.
