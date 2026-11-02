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
  Role,
} from './enums.js';

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
  items: OrderItem[];
  payments?: Payment[];
  statusHistory?: OrderStatusEvent[];
  createdAt: string;
  updatedAt: string;
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
  sku: string;
  productName: string;
  variantLabel: string;
  available: number;
  nextExpiry: string | null;
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
