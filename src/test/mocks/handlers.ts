import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://placeholder-url.supabase.co';

export const handlers = [
  // Auth Handlers
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: 'fake-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'fake-refresh-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
      },
    });
  }),

  http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {},
      app_metadata: {},
    });
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@example.com',
    });
  }),

  // Wildcard Table Read Handler
  http.get(`${SUPABASE_URL}/rest/v1/:table`, ({ request, params }) => {
    const table = params.table;
    const acceptHeader = request.headers.get('accept') || '';
    const isSingle = acceptHeader.includes('vnd.pgrst.object');

    let data: any = [];

    if (table === 'profiles') {
      data = [{ id: 'user-123', tenant_id: 'tenant-123', role: 'owner' }];
    } else if (table === 'tenants') {
      data = [{ id: 'tenant-123', name: 'Test Cafe', slug: 'test-cafe', onboarding_completed: true }];
    } else if (table === 'customers') {
      data = [{ id: 'CUS-1', name: 'John Doe', phone: '1234567890', loyalty_points: 100, visits: 5 }];
    } else if (table === 'stations') {
      data = [
        { id: 'STN-1', name: 'PC 1', type: 'PC' },
        { id: 'STN-2', name: 'PS5 1', type: 'Console' }
      ];
    } else if (table === 'products') {
      data = [{ id: 'PRD-1', name: 'Cola', category: 'Drink', mrp: 50, stock_quantity: 10 }];
    } else if (table === 'booking_settings') {
      data = [{ opening_time: '10:00', closing_time: '23:00', slot_minutes: 15 }];
    } else if (table === 'pricing_settings') {
      data = [{ config: {} }];
    } else if (table === 'loyalty_settings') {
      data = [{ earn_rate_points: 5, earn_rate_minutes: 30, redeem_rate_points: 70, redeem_rate_minutes: 60 }];
    } else if (table === 'bills') {
      data = [];
    } else if (table === 'bookings') {
      data = [];
    }

    if (isSingle) {
      return HttpResponse.json(data.length > 0 ? data[0] : null);
    }
    return HttpResponse.json(data);
  }),

  // Wildcard Table Write Handler
  http.post(`${SUPABASE_URL}/rest/v1/:table`, ({ params }) => {
    const table = params.table;
    if (table === 'customers') {
      return HttpResponse.json({ id: 'CUS-2', name: 'Jane Doe', phone: '0987654321' });
    }
    if (table === 'bookings') {
      return HttpResponse.json({ id: 'book-1' });
    }
    if (table === 'bills') {
      return HttpResponse.json({ id: 'BILL-1' });
    }
    return HttpResponse.json({ success: true });
  }),

  // RPC Handler
  http.post(`${SUPABASE_URL}/rest/v1/rpc/:function`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Wildcard Table Update Handler
  http.patch(`${SUPABASE_URL}/rest/v1/:table`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Wildcard Table Delete Handler
  http.delete(`${SUPABASE_URL}/rest/v1/:table`, () => {
    return HttpResponse.json({ success: true });
  }),
];
