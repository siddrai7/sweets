/**
 * Response shapes returned by the API. Money and decimal fields are serialised as strings.
 */
import type {
  FulfillmentType,
  LocationType,
  MeasurementUnit,
  OrderChannel,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  PurchaseOrderStatus,
  RefundMethod,
  ReturnReason,
  ReturnStatus,
  Role,
} from './enums.js';
import type { Paginated } from './common.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  vendorId: string | null;
}

/** A user as admins see them in the ERP's user management. */
export interface ManagedUser extends AuthUser {
  isActive: boolean;
  /** Created by guest checkout (no password yet). */
  isGuest: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  vendor: { id: string; name: string } | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  /** Products directly in this category. Only returned to staff. */
  productCount?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  label: string;
  weightGrams: number | null;
  price: string;
  mrp: string | null;
  isActive: boolean;
  sortOrder: number;
  /** Low-stock alert level shown in the ERP. */
  lowStockThreshold?: number;
  /** Units currently sellable (sum of unexpired batches). Present on catalog reads. */
  available?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
  images: string[];
  tags: string[];
  searchAliases: string[];
  isVeg: boolean;
  isActive: boolean;
  isFeatured: boolean;
  shelfLifeDays: number | null;
  hsnCode: string | null;
  taxRatePercent: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ingredients: string | null;
  allergens: string | null;
  storageInstructions: string | null;
  basePrice: string | null;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  taxRatePercent: string;
  hsnCode: string | null;
  lineTotal: string;
}

export interface Payment {
  id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: string;
  providerRef: string | null;
  createdAt: string;
}

export interface OrderStatusEvent {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  /** Who made the change; null for system changes. */
  changedBy?: { name: string; role: Role } | null;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  status: ReturnStatus;
  reason: ReturnReason;
  items: { orderItemId: string; quantity: number }[];
  note: string | null;
  requestedAmount: string;
  refundAmount: string | null;
  refundMethod: RefundMethod | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  createdBy?: { name: string; role: Role };
  resolvedBy?: { name: string } | null;
  /** On the ERP returns list. */
  order?: Pick<Order, 'id' | 'orderNumber' | 'total' | 'fulfillment'> & {
    customer: { name: string; phone: string | null };
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Pick<AuthUser, 'id' | 'name' | 'email' | 'phone'>;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  channel: OrderChannel;
  address: Record<string, string> | null;
  deliverySlotStart: string | null;
  deliverySlotEnd: string | null;
  subtotal: string;
  taxTotal: string;
  deliveryFee: string;
  discountTotal: string;
  total: string;
  notes: string | null;
  /** Set once the GST invoice has been issued (on delivery). */
  invoiceNumber: string | null;
  invoicedAt: string | null;
  items: OrderItem[];
  payments?: Payment[];
  statusHistory?: OrderStatusEvent[];
  returns?: ReturnRequest[];
  createdAt: string;
  updatedAt: string;
}

/** A cart line with live catalog details (price and stock are always current). */
export interface CartItemView {
  variantId: string;
  quantity: number;
  productSlug: string;
  productName: string;
  variantLabel: string;
  unitPrice: string;
  mrp: string | null;
  image: string | null;
  /** Units sellable right now. */
  available: number;
}

export interface CartView {
  items: CartItemView[];
}

export interface SavedAddress {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

/** A product search page: results plus a spelling suggestion when nothing matched. */
export interface ProductSearchResult extends Paginated<Product> {
  /** e.g. "kaju katli" for "kaju katri", shown as "Did you mean…". */
  suggestion?: string | null;
}

export interface ServiceArea {
  id: string;
  pincode: string;
  label: string;
  isActive: boolean;
}

export interface PincodeCheck {
  pincode: string;
  serviceable: boolean;
  /** Area name when serviceable. */
  label: string | null;
}

/** One bookable delivery window. Times are ISO strings in UTC. */
export interface DeliverySlot {
  start: string;
  end: string;
  /** "Today, 3–5 pm" style label in the shop's timezone. */
  label: string;
  /** YYYY-MM-DD in the shop's timezone. */
  date: string;
  available: boolean;
}

export interface SearchTermStat {
  term: string;
  searches: number;
  zeroResults: number;
  lastResults: number;
  lastSearchedAt: string;
}

export interface GuestOrderResponse {
  order: Order;
  /** Private token for the order link (/orders/track/<number>?t=<token>). Shown once. */
  token: string;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: string | null;
  isActive: boolean;
}

export interface StockBatch {
  id: string;
  variantId: string;
  locationId: string;
  batchCode: string;
  quantity: number;
  initialQuantity: number;
  producedAt: string;
  expiresAt: string | null;
  unitCost: string | null;
  variant?: Pick<ProductVariant, 'id' | 'sku' | 'label'> & {
    product: Pick<Product, 'id' | 'name'>;
  };
  location?: Pick<Location, 'id' | 'name'>;
}

export interface StockSummaryRow {
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantLabel: string;
  available: number;
  nextExpiry: string | null;
  /** Alert level set on the pack size in the product editor. */
  lowStockThreshold: number;
  /** `available <= lowStockThreshold`. */
  isLow: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  isActive: boolean;
  createdAt?: string;
  /** Active ERP logins linked to this vendor. */
  loginCount?: number;
  /** Purchase orders sent or acknowledged but not yet received. */
  openPurchaseOrders?: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: MeasurementUnit;
  reorderLevel: string;
  currentStock: string;
}

export interface PurchaseOrderItem {
  id: string;
  rawMaterialId: string | null;
  description: string;
  quantity: string;
  unit: MeasurementUnit;
  unitPrice: string;
  lineTotal: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor?: Pick<Vendor, 'id' | 'name'>;
  status: PurchaseOrderStatus;
  expectedAt: string | null;
  notes: string | null;
  total: string;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export interface DashboardStats {
  ordersToday: number;
  revenueToday: string;
  pendingOrders: number;
  lowStockVariants: number;
  expiringBatches: number;
}
