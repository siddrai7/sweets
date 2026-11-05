import type {
  Coupon,
  CouponCheckInput,
  CouponInput,
  CouponPreview,
  CouponUpdateInput,
  ProductReviews,
  Review,
  ReviewEligibility,
  ReviewInput,
  ReviewModerationInput,
  ReviewQuery,
  BulkServiceAreaInput,
  DeliverySettings,
  DeliverySlot,
  GuestOrderInput,
  GuestOrderResponse,
  PincodeCheck,
  ProductSearchResult,
  SearchTermStat,
  ServiceArea,
  ServiceAreaInput,
  AddStockBatchInput,
  ApproveReturnInput,
  AdjustStockInput,
  AuthResponse,
  AuthUser,
  Category,
  CategoryInput,
  CategoryUpdateInput,
  CartItemsInput,
  CartView,
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
  ReturnQuery,
  ReturnRequest,
  ReturnRequestInput,
  SavedAddress,
  SavedAddressInput,
  SavedAddressUpdateInput,
  StaffRefundInput,
  StockBatch,
  StockSummaryRow,
  UpdateUserInput,
  UserQuery,
  Vendor,
  VendorInput,
  VendorUpdateInput,
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
    // JSON for API data; plain text for documents such as the HTML invoice.
    const isJson = res.headers.get('content-type')?.includes('json') ?? true;
    const data = text ? (isJson ? JSON.parse(text) : text) : undefined;
    if (!res.ok) throw new ApiError(res.status, data);
    return data as T;
  }

  const get = <T>(path: string, query?: Query, init?: FetchInit) =>
    request<T>('GET', path, { query, init });
  const post = <T>(path: string, body?: unknown) => request<T>('POST', path, { body });
  const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body });
  const del = <T>(path: string) => request<T>('DELETE', path);
  const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, { body });

  return {
    auth: {
      register: (input: RegisterInput) => post<AuthResponse>('/auth/register', input),
      login: (input: LoginInput) => post<AuthResponse>('/auth/login', input),
      refresh: (refreshToken: string) => post<AuthResponse>('/auth/refresh', { refreshToken }),
      logout: (refreshToken: string) => post<void>('/auth/logout', { refreshToken }),
      me: () => get<AuthUser>('/auth/me'),
    },
    /** The signed-in user's own cart (synced across devices) and saved addresses. */
    account: {
      cart: () => get<CartView>('/me/cart'),
      replaceCart: (items: CartItemsInput['items']) => put<CartView>('/me/cart', { items }),
      mergeCart: (items: CartItemsInput['items']) => post<CartView>('/me/cart/merge', { items }),
      addresses: () => get<SavedAddress[]>('/me/addresses'),
      createAddress: (input: SavedAddressInput) => post<SavedAddress>('/me/addresses', input),
      updateAddress: (id: string, input: SavedAddressUpdateInput) =>
        patch<SavedAddress>(`/me/addresses/${id}`, input),
      deleteAddress: (id: string) => del<void>(`/me/addresses/${id}`),
      wishlist: () => get<Product[]>('/me/wishlist'),
      wishlistIds: () => get<string[]>('/me/wishlist/ids'),
      addToWishlist: (productId: string) => put<string[]>(`/me/wishlist/${productId}`, {}),
      removeFromWishlist: (productId: string) => del<string[]>(`/me/wishlist/${productId}`),
    },
    coupons: {
      check: (input: CouponCheckInput) => post<CouponPreview>('/coupons/check', input),
      list: () => get<Coupon[]>('/coupons'),
      create: (input: CouponInput) => post<Coupon>('/coupons', input),
      update: (id: string, input: CouponUpdateInput) => patch<Coupon>(`/coupons/${id}`, input),
    },
    reviews: {
      forProduct: (idOrSlug: string, page = 1, init?: FetchInit) =>
        get<ProductReviews>(`/products/${encodeURIComponent(idOrSlug)}/reviews`, { page }, init),
      mine: (idOrSlug: string) =>
        get<ReviewEligibility>(`/products/${encodeURIComponent(idOrSlug)}/reviews/mine`),
      write: (idOrSlug: string, input: ReviewInput) =>
        put<Review>(`/products/${encodeURIComponent(idOrSlug)}/reviews/mine`, input),
      list: (q: Partial<ReviewQuery> = {}) => get<Paginated<Review>>('/reviews', q),
      moderate: (id: string, input: ReviewModerationInput) =>
        patch<Review>(`/reviews/${id}`, input),
    },
    shopper: {
      boughtTogether: (idOrSlug: string, init?: FetchInit) =>
        get<Product[]>(`/catalog/together/${encodeURIComponent(idOrSlug)}`, undefined, init),
      productsByIds: (ids: string[]) => get<Product[]>('/catalog/by-ids', { ids: ids.join(',') }),
      productsForVariants: (variantIds: string[]) =>
        get<Product[]>('/catalog/by-variants', { ids: variantIds.join(',') }),
      notifyWhenBack: (variantId: string, email: string) =>
        post<{ ok: true }>('/stock-alerts', { variantId, email }),
      stockAlerts: () =>
        get<
          { variantId: string; productName: string; label: string; sku: string; waiting: number }[]
        >('/stock-alerts'),
    },
    delivery: {
      check: (pincode: string) => get<PincodeCheck>('/delivery/check', { pincode }),
      slots: () => get<DeliverySlot[]>('/delivery/slots'),
      settings: () => get<DeliverySettings>('/delivery/settings'),
      updateSettings: (input: DeliverySettings) =>
        put<DeliverySettings>('/delivery/settings', input),
      areas: () => get<ServiceArea[]>('/delivery/areas'),
      createArea: (input: ServiceAreaInput) => post<ServiceArea>('/delivery/areas', input),
      bulkAreas: (input: BulkServiceAreaInput) =>
        post<{ added: number }>('/delivery/areas/bulk', input),
      updateArea: (id: string, input: Partial<ServiceAreaInput>) =>
        patch<ServiceArea>(`/delivery/areas/${id}`, input),
      deleteArea: (id: string) => del<void>(`/delivery/areas/${id}`),
    },
    returns: {
      list: (q: Partial<ReturnQuery> = {}) => get<Paginated<ReturnRequest>>('/returns', q),
      approve: (id: string, input: ApproveReturnInput) =>
        post<ReturnRequest>(`/returns/${id}/approve`, input),
      reject: (id: string, note: string) => post<ReturnRequest>(`/returns/${id}/reject`, { note }),
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
        get<ProductSearchResult>('/products', q, init),
      /** Staff: what customers search for (`zeroOnly`: searches that found nothing). */
      searchReport: (zeroOnly = false) =>
        get<SearchTermStat[]>('/products/search-report', { zero: zeroOnly || undefined }),
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
      /** By id or order number. */
      get: (idOrNumber: string) => get<Order>(`/orders/${encodeURIComponent(idOrNumber)}`),
      cancel: (id: string) => post<Order>(`/orders/${id}/cancel`),
      /** Checkout without an account. Keep the returned token: it opens the order later. */
      placeGuest: (input: GuestOrderInput) => post<GuestOrderResponse>('/orders/guest', input),
      getGuest: (orderNumber: string, token: string) =>
        get<Order>(`/orders/guest/${encodeURIComponent(orderNumber)}`, { token }),
      guestInvoiceHtml: (orderNumber: string, token: string) =>
        get<string>(`/orders/guest/${encodeURIComponent(orderNumber)}/invoice`, { token }),
      /** Printable GST tax invoice as an HTML document (issued on delivery). */
      invoiceHtml: (idOrNumber: string) =>
        get<string>(`/orders/${encodeURIComponent(idOrNumber)}/invoice`),
      /** Customer: report a problem with a delivered order. */
      requestReturn: (idOrNumber: string, input: ReturnRequestInput) =>
        post<ReturnRequest>(`/orders/${encodeURIComponent(idOrNumber)}/returns`, input),
      /** Staff: record a refund directly. */
      refund: (id: string, input: StaffRefundInput) =>
        post<ReturnRequest>(`/orders/${id}/refunds`, input),
      updateStatus: (id: string, status: OrderStatus, note?: string) =>
        patch<Order>(`/orders/${id}/status`, { status, note }),
    },
    inventory: {
      locations: () => get<Location[]>('/inventory/locations'),
      summary: () => get<StockSummaryRow[]>('/inventory/summary'),
      /** Sizes at or below their low-stock alert level, most urgent first. */
      lowStock: () => get<StockSummaryRow[]>('/inventory/low-stock'),
      batches: (q: { variantId?: string; locationId?: string } = {}) =>
        get<StockBatch[]>('/inventory/batches', q),
      expiring: (withinHours = 48) => get<StockBatch[]>('/inventory/expiring', { withinHours }),
      addBatch: (input: AddStockBatchInput) => post<StockBatch>('/inventory/batches', input),
      adjust: (input: AdjustStockInput) => post<StockBatch>('/inventory/adjustments', input),
    },
    vendors: {
      list: () => get<Vendor[]>('/vendors'),
      create: (input: VendorInput) => post<Vendor>('/vendors', input),
      /** Admin only. Deactivating signs out and blocks the vendor's logins. */
      update: (id: string, input: VendorUpdateInput) => patch<Vendor>(`/vendors/${id}`, input),
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
