import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

vi.stubEnv('VITE_SUPABASE_URL', 'https://placeholder-url.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'placeholder-key');

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());

// Global Recharts mock to prevent JSDOM layout issues
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => children,
    AreaChart: ({ children }: any) => children,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    BarChart: ({ children }: any) => children,
    Bar: () => null,
    Cell: () => null,
    PieChart: ({ children }: any) => children,
    Pie: () => null,
    LineChart: ({ children }: any) => children,
    Line: () => null,
    Legend: () => null,
  };
});
