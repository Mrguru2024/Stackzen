import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardClient from './DashboardClient';
import { DASHBOARD_WIDGETS } from '@/lib/dashboard/widgets';
import { resolveVisibleWidgets } from '@/lib/dashboard/use-dashboard-layout';

jest.mock('@/components/providers/ViewAsProvider', () => ({
  useViewAsSession: () => ({
    data: { user: { id: 'user_1', name: 'Pat', email: 'pat@example.com', role: 'USER' } },
    status: 'authenticated',
  }),
}));

jest.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

// Stub every widget to a unique label so the test can assert visibility without
// hitting their downstream fetch logic.
jest.mock('@/components/dashboard/widgets/KpiStrip', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-kpi-strip">KPI Strip</div>,
}));
jest.mock('@/components/dashboard/widgets/OperationalAlertsMini', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-operational-alerts">Alerts Mini</div>,
}));
jest.mock('@/components/dashboard/widgets/CashFlowSnapshot', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-cashflow-snapshot">Cash Flow Snapshot</div>,
}));
jest.mock('@/components/dashboard/widgets/GoalsProgressMini', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-goals-progress">Goals Progress</div>,
}));
jest.mock('@/components/dashboard/widgets/IncomeHealthMini', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-income-health">Income Health</div>,
}));
jest.mock('@/components/SafeToSpend', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-safe-to-spend">Safe To Spend</div>,
}));
jest.mock('@/components/financial-events/FinancialActivityWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-financial-activity">Activity</div>,
}));
jest.mock('@/components/IncomeTimeline', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-income-timeline">Income Timeline</div>,
}));
jest.mock('@/components/EmotionalState', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-emotional-state">Emotional State</div>,
}));
jest.mock('@/components/JobBasedIncome', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-job-based-income">Job Based</div>,
}));
jest.mock('@/components/ProjectForecast', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-project-forecast">Project Forecast</div>,
}));
jest.mock('@/components/MentorDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="widget-mentor-dashboard">Mentor Dashboard</div>,
}));

function renderClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardClient />
    </QueryClientProvider>
  );
}

type FetchMock = jest.Mock<Promise<Response>, [input: RequestInfo | URL, init?: RequestInit | undefined]>;

let fetchMock: FetchMock;
const layoutPuts: unknown[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  // Use a lightweight stub instead of a real Response so .json() resolves on a single
  // microtask tick — Response in jsdom routes through readable streams which don't
  // settle under fake timers in the same way as native runtimes.
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  jest.useFakeTimers();
  window.localStorage.clear();
  layoutPuts.length = 0;
  fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('/api/dashboard/layout')) {
      if (init?.method === 'PUT') {
        try {
          layoutPuts.push(JSON.parse(init.body as string));
        } catch {
          layoutPuts.push(null);
        }
        return jsonResponse({ items: JSON.parse(init.body as string).items });
      }
      // GET — return 401 so the hook falls back to localStorage. Individual tests
      // override fetchMock when they need a populated server layout.
      return jsonResponse({ error: 'unauth' }, 401);
    }
    return jsonResponse({});
  });
  // @ts-expect-error overriding the global for the test environment
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

async function flushLayoutMount() {
  await act(async () => {
    for (let i = 0; i < 6; i++) {
      await Promise.resolve();
    }
  });
}

describe('DashboardClient', () => {
  it('renders welcome header and the customize trigger', async () => {
    renderClient();
    await flushLayoutMount();
    expect(screen.getByText(/Welcome back, Pat/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Customize/i })).toBeInTheDocument();
  });

  it('renders the default-visible widgets and hides the rest', async () => {
    renderClient();
    await flushLayoutMount();
    const visibleDefaults = DASHBOARD_WIDGETS.filter(
      w => w.defaultVisible && (!w.roleGate || w.roleGate === 'USER')
    );
    for (const widget of visibleDefaults) {
      expect(screen.getByTestId(`widget-${widget.id}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('widget-emotional-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('widget-mentor-dashboard')).not.toBeInTheDocument();
  });

  it('hides a widget when its toggle is switched off in the customize panel', async () => {
    renderClient();
    await flushLayoutMount();
    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    const toggle = screen.getByRole('switch', { name: /Toggle Cash flow outlook/i });
    fireEvent.click(toggle);
    expect(screen.queryByTestId('widget-cashflow-snapshot')).not.toBeInTheDocument();
  });

  it('reset restores defaults after a toggle', async () => {
    renderClient();
    await flushLayoutMount();
    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    fireEvent.click(screen.getByRole('switch', { name: /Toggle Cash flow outlook/i }));
    expect(screen.queryByTestId('widget-cashflow-snapshot')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reset dashboard to defaults/i }));
    expect(screen.getByTestId('widget-cashflow-snapshot')).toBeInTheDocument();
  });

  it('persists layout to localStorage across renders', async () => {
    const { unmount } = renderClient();
    await flushLayoutMount();
    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    fireEvent.click(screen.getByRole('switch', { name: /Toggle Income health/i }));
    unmount();

    renderClient();
    expect(screen.queryByTestId('widget-income-health')).not.toBeInTheDocument();
  });

  it('hydrates layout from the server layout endpoint', async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.startsWith('/api/dashboard/layout') && init?.method !== 'PUT') {
        return jsonResponse({
          items: [
            { id: 'kpi-strip', visible: true },
            { id: 'cashflow-snapshot', visible: false },
            { id: 'operational-alerts', visible: false },
            { id: 'goals-progress', visible: false },
            { id: 'income-health', visible: false },
            { id: 'safe-to-spend', visible: false },
            { id: 'financial-activity', visible: false },
          ],
        });
      }
      return jsonResponse({});
    });
    renderClient();
    await flushLayoutMount();

    expect(screen.getByTestId('widget-kpi-strip')).toBeInTheDocument();
    expect(screen.queryByTestId('widget-cashflow-snapshot')).not.toBeInTheDocument();
  });

  it('persists layout edits to the server with a debounced PUT', async () => {
    renderClient();
    await flushLayoutMount();
    fireEvent.click(screen.getByRole('button', { name: /Customize/i }));
    fireEvent.click(screen.getByRole('switch', { name: /Toggle Cash flow outlook/i }));

    await act(async () => {
      jest.advanceTimersByTime(700);
      await Promise.resolve();
    });

    const puts = fetchMock.mock.calls.filter(call => call[1]?.method === 'PUT');
    expect(puts.length).toBeGreaterThan(0);
    expect(layoutPuts.length).toBeGreaterThan(0);
    const lastBody = layoutPuts[layoutPuts.length - 1] as { items: { id: string; visible: boolean }[] };
    const entry = lastBody.items.find(i => i.id === 'cashflow-snapshot');
    expect(entry?.visible).toBe(false);
  });
});

describe('resolveVisibleWidgets', () => {
  it('hides mentor-only widgets for non-mentor users', () => {
    const items = DASHBOARD_WIDGETS.map(w => ({ id: w.id, visible: w.defaultVisible }));
    const visible = resolveVisibleWidgets(items, 'USER');
    expect(visible.some(w => w.id === 'mentor-dashboard')).toBe(false);
  });

  it('exposes mentor-only widgets for mentor users', () => {
    const items = DASHBOARD_WIDGETS.map(w => ({ id: w.id, visible: w.defaultVisible }));
    const visible = resolveVisibleWidgets(items, 'MENTOR');
    expect(visible.some(w => w.id === 'mentor-dashboard')).toBe(true);
  });

  it('skips widgets whose layout entry is hidden', () => {
    const items = DASHBOARD_WIDGETS.map(w => ({ id: w.id, visible: false }));
    items[0] = { id: items[0].id, visible: true };
    const visible = resolveVisibleWidgets(items, 'USER');
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe(items[0].id);
  });

  it('preserves the order of the layout items', () => {
    const items = [
      { id: 'cashflow-snapshot', visible: true },
      { id: 'kpi-strip', visible: true },
    ];
    const visible = resolveVisibleWidgets(items, 'USER');
    expect(visible.map(w => w.id)).toEqual(['cashflow-snapshot', 'kpi-strip']);
  });
});
