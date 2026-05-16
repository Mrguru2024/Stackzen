import QueryClientProviderWrapper from '@/components/QueryClientProviderWrapper';

export default function WellnessLayout({ children }: { children: React.ReactNode }) {
  return <QueryClientProviderWrapper>{children}</QueryClientProviderWrapper>;
}
