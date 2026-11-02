import type {
  AddStockBatchInput,
  AdjustStockInput,
  AuthResponse,
  AuthUser,
  Category,
  CategoryInput,
  CategoryUpdateInput,
  ContactMessageInput,
  CreateUserInput,
  DashboardStats,
  Location,
  LoginInput,
  ManagedUser,
  NewsletterInput,
  Order,
  OrderQuery,
  OrderStatus,
  Paginated,
  PlaceOrderInput,
  Product,
  ProductInput,
  ProductQuery,
  ProductUpdateInput,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderStatus,
  RawMaterial,
  RegisterInput,
  StockBatch,
  StockSummaryRow,
  UpdateUserInput,
  UserQuery,
  Vendor,
  VendorInput,
} from '@sweets/types';

/** RequestInit plus Next.js' caching options, passed straight through to fetch. */
export type FetchInit = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };

export interface ApiClientOptions {
  /** e.g. http://localhost:4000/api/v1 */
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  /** Called once on a 401; return a fresh access token to retry, or null to give up. */
  refreshAccessToken?: () => Promise<string | null>;
  fetch?: typeof fetch;
}

/** Readable message from an API error body, preferring field-level validation messages. */
function errorMessage(status: number, body: unknown): string {
  if (typeof body !== 'object' || !body) return `HTTP ${status}`;
  const errors = 'errors' in body && Array.isArray(body.errors) ? body.errors : [];
  const details = errors
    .map((e: unknown) => (typeof e === 'object' && e && 'message' in e ? String(e.message) : ''))
    .filter(Boolean);
  if (details.length) return [...new Set(details)].join('. ');
  return 'message' in body ? String(body.message) : `HTTP ${status}`;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(errorMessage(status, body));
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

export function createApiClient(options: ApiClientOptions) {
  const doFetch = options.fetch ?? fetch;

  async function request<T>(
    method: string,
    path: string,
    { body, query, init }: { body?: unknown; query?: Query; init?: FetchInit } = {},
    retried = false,
  ): Promise<T> {
    const url = new URL(options.baseUrl.replace(/\/$/, '') + path);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }

    const token = options.getAccessToken?.();
    const res = await doFetch(url, {
      ...init,
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...init?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !retried && token && options.refreshAccessToken) {
      const fresh = await options.refreshAccessToken();
      if (fresh) return request<T>(method, path, { body, query, init }, true);
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) throw new ApiError(res.status, data);
    return data as T;
  }

  const get = <T>(path: string, query?: Query, init?: FetchInit) =>
    request<T>('GET', path, { query, init });
  const post = <T>(path: string, body?: unknown) => request<T>('POST', path, { body });
  const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body });
  const del = <T>(path: string) => request<T>('DELETE', path);

  return {
    auth: {
      register: (input: RegisterInput) => post<AuthResponse>('/auth/register', input),
      login: (input: LoginInput) => post<AuthResponse>('/auth/login', input),
      refresh: (refreshToken: string) => post<AuthResponse>('/auth/refresh', { refreshToken }),
      logout: (refreshToken: string) => post<void>('/auth/logout', { refreshToken }),
      me: () => get<AuthUser>('/auth/me'),
    },
    users: {
      list: (q: Partial<UserQuery> = {}) => get<Paginated<ManagedUser>>('/users', q),
      create: (input: CreateUserInput) => post<ManagedUser>('/users', input),
      update: (id: string, input: UpdateUserInput) => patch<ManagedUser>(`/users/${id}`, input),
      setActive: (id: string, isActive: boolean) =>
        patch<ManagedUser>(`/users/${id}/active`, { isActive }),
      /** Sets a new password and signs the user out everywhere. */
      resetPassword: (id: string, password: string) =>
        post<void>(`/users/${id}/password`, { password }),
    },
    catalog: {
      categories: (init?: FetchInit) => get<Category[]>('/categories', undefined, init),
      createCategory: (input: CategoryInput) => post<Category>('/categories', input),
      updateCategory: (id: string, input: CategoryUpdateInput) =>
        patch<Category>(`/categories/${id}`, input),
      products: (q: Partial<ProductQuery> = {}, init?: FetchInit) =>
        get<Paginated<Product>>('/products', q, init),
      product: (idOrSlug: string, init?: FetchInit) =>
        get<Product>(`/products/${encodeURIComponent(idOrSlug)}`, undefined, init),
      createProduct: (input: ProductInput) => post<Product>('/products', input),
      updateProduct: (id: string, input: ProductUpdateInput) =>
        patch<Product>(`/products/${id}`, input),
      /** Admin only. Hides the product from the shop; past orders keep it. */
      archiveProduct: (id: string) => del<Product>(`/products/${id}`),
      /** Admin only. */
      restoreProduct: (id: string) => post<Product>(`/products/${id}/restore`),
    },
    orders: {
      place: (input: PlaceOrderInput) =>
        post<{ order: Order; payment: Record<string, unknown> | null }>('/orders', input),
      list: (q: Partial<OrderQuery> = {}) => get<Paginated<Order>>('/orders', q),
      get: (id: string) => get<Order>(`/orders/${id}`),
      cancel: (id: string) => post<Order>(`/orders/${id}/cancel`),
      updateStatus: (id: string, status: OrderStatus, note?: string) =>
        patch<Order>(`/orders/${id}/status`, { status, note }),
    },
    inventory: {
      locations: () => get<Location[]>('/inventory/locations'),
      summary: () => get<StockSummaryRow[]>('/inventory/summary'),
      batches: (q: { variantId?: string; locationId?: string } = {}) =>
        get<StockBatch[]>('/inventory/batches', q),
      expiring: (withinHours = 48) => get<StockBatch[]>('/inventory/expiring', { withinHours }),
      addBatch: (input: AddStockBatchInput) => post<StockBatch>('/inventory/batches', input),
      adjust: (input: AdjustStockInput) => post<StockBatch>('/inventory/adjustments', input),
    },
    vendors: {
      list: () => get<Vendor[]>('/vendors'),
      create: (input: VendorInput) => post<Vendor>('/vendors', input),
      rawMaterials: () => get<RawMaterial[]>('/raw-materials'),
    },
    purchaseOrders: {
      list: () => get<PurchaseOrder[]>('/purchase-orders'),
      get: (id: string) => get<PurchaseOrder>(`/purchase-orders/${id}`),
      create: (input: PurchaseOrderInput) => post<PurchaseOrder>('/purchase-orders', input),
      setStatus: (id: string, status: PurchaseOrderStatus) =>
        patch<PurchaseOrder>(`/purchase-orders/${id}/status`, { status }),
    },
    dashboard: {
      stats: () => get<DashboardStats>('/dashboard'),
    },
    engagement: {
      subscribe: (input: NewsletterInput) => post<void>('/newsletter', input),
      contact: (input: ContactMessageInput) => post<void>('/contact', input),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Format a decimal string from the API as currency, e.g. "1024" → "₹1,024.00". */
export function formatMoney(amount: string | number, currency = 'INR', locale = 'en-IN') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount));
}
