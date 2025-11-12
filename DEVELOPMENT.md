# Development Guide

## Architecture Overview

This Next.js 14 application follows modern React patterns with server and client components.

### Folder Structure

```
polymarket-analyzer-frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout (server component)
│   ├── page.tsx           # Home page (client component)
│   ├── globals.css        # Global styles
│   └── market/[id]/       # Dynamic routes
│       └── page.tsx       # Market detail (client component)
├── components/
│   ├── layout/            # Layout components
│   │   ├── Header.tsx     # Navigation (server component)
│   │   ├── Footer.tsx     # Footer (server component)
│   │   └── Sidebar.tsx    # Filters (client component)
│   └── ui/                # Reusable UI primitives
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── ErrorMessage.tsx
│       ├── LoadingSpinner.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── api-client.ts      # Backend API integration
│   ├── types.ts           # TypeScript definitions
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Component Guidelines

### Server vs Client Components

**Server Components (default):**
- Header, Footer
- Static layouts
- Data fetching at build time

**Client Components (`'use client'`):**
- Interactive components (forms, buttons with onClick)
- useState, useEffect hooks
- Browser APIs

### Example Component

```tsx
// components/ui/MyComponent.tsx
'use client'; // Only if needed

import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  variant?: 'default' | 'primary';
}

export default function MyComponent({
  title,
  variant = 'default'
}: MyComponentProps) {
  return (
    <div className={cn(
      'rounded-lg p-4',
      variant === 'primary' && 'bg-primary text-white'
    )}>
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}
```

## API Integration

### Using the API Client

```typescript
import { getMarkets, getSentiment, getPrediction } from '@/lib/api-client';

// In a component
async function fetchData() {
  try {
    const markets = await getMarkets({ active: true, limit: 50 });
    const sentiment = await getSentiment('market-id');
    const prediction = await getPrediction('market-id');
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}
```

### Error Handling

All API functions throw typed errors that can be caught and displayed:

```typescript
try {
  const data = await getMarkets();
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors (4xx, 5xx)
    setError(error.message);
  } else {
    // Handle network errors
    setError('Network error occurred');
  }
}
```

## Styling Best Practices

### Tailwind CSS Usage

```tsx
// Good: Semantic classes
<div className="rounded-lg border border-surface-light bg-surface p-6">

// Good: Conditional classes with cn()
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)}>

// Avoid: Inline styles
<div style={{ color: 'red' }}> // Don't do this
```

### Color Usage

- `text-white` - Primary text
- `text-neutral-light` - Secondary text
- `text-primary` - Links, CTAs
- `text-success` - Positive values
- `text-danger` - Negative values
- `bg-background` - Page background
- `bg-surface` - Card background
- `border-surface-light` - Borders

## State Management

### Local State (useState)

For component-specific state:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [data, setData] = useState<Market[]>([]);
```

### URL State (useSearchParams)

For shareable filters/state:

```typescript
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();
const page = searchParams.get('page') || '1';
```

### Future: Global State

For shared state across components, consider:
- React Context
- Zustand
- Jotai

## Performance Optimization

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>
```

### Code Splitting

Dynamic imports for heavy components:

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable server-side rendering if needed
});
```

### Memoization

```tsx
import { useMemo, useCallback } from 'react';

const sortedMarkets = useMemo(() =>
  sortMarkets(markets, sortBy, direction),
  [markets, sortBy, direction]
);

const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

## Testing

### Component Testing (Future)

```bash
npm install -D @testing-library/react @testing-library/jest-dom jest
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Production variables in `.env.production`:

```env
NEXT_PUBLIC_API_URL=https://your-production-api.com
```

### Deployment Platforms

- **Vercel**: Zero-config deployment (recommended)
- **Netlify**: Good alternative
- **Docker**: Use included Dockerfile
- **Azure Static Web Apps**: For Azure infrastructure

## Common Tasks

### Adding a New Page

1. Create file in `app/` directory
2. Export default function component
3. Add to navigation in Header.tsx

### Adding a New Component

1. Create in `components/ui/` or `components/layout/`
2. Export as default
3. Document props with TypeScript interface
4. Use `cn()` for conditional classes

### Updating Types

1. Edit `lib/types.ts`
2. Export interface/type
3. Use in components and API client

### Styling a Component

1. Use Tailwind utility classes
2. Follow color palette from `tailwind.config.ts`
3. Use responsive prefixes: `md:`, `lg:`, `xl:`
4. Test dark theme (default theme)

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev)

## Support

For issues or questions, check:
1. README.md for setup instructions
2. This guide for development patterns
3. TypeScript types for API contracts
4. Tailwind config for design tokens
