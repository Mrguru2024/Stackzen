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