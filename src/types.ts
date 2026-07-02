export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  RETURNED = 'Returned',
  CANCELLED = 'Cancelled'
}

export interface Variation {
  id?: string;
  name: string;
  // one or more media items (image or video)
  media?: string | string[];
  youtubeLinks?: string[];
  price: number;
  discountPrice?: number;
  costOfGoods?: number;
  weight?: number;
  stock?: number;
  sku?: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number;
  // Cost of goods for simple products
  costOfGoods?: number;
  // 'simple' = single product, 'variation' = has multiple variation units
  productType?: 'simple' | 'variation';
  // For variation products
  variations?: Variation[];
  category: string;
  images: string[];
  youtubeLinks?: string[];
  stock: number;
  weight?: number;
  weightUnit?: 'kg';
  rating: number;
  reviews: Review[];
  features?: string[];
  badge?: string;
  tags?: string;
}

export interface ProductListing {
  id: string;
  sku?: string;
  name: string;
  price: number;
  discountPrice?: number;
  productType?: 'simple' | 'variation';
  variations?: Variation[];
  category: string;
  images: string[];
  stock: number;
  rating: number;
  badge?: string;
  tags?: string;
}

export interface PaginatedProducts {
  items: ProductListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Admin' | 'Editor' | 'Order Manager';
  phone: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  address?: string;
  role: 'User' | 'Admin';
  orders: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  variation?: Variation;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  address: string;
  area: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  paymentMethod: string;
  note?: string;
  couponId?: string | null;
  couponCode?: string | null;
  couponType?: CouponType | string | null;
  couponDiscount?: number;
  couponNoteMessage?: string | null;
  eventId?: string;
  event_source_url?: string;
  page_url?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
  parentId?: string | null;
}

export type CouponType = 'fixed' | 'percentage' | 'note';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  type: CouponType;
  amount: number;
  percentage: number;
  noteMessage?: string | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  timesUsed?: number;
  productIds: string[];
  categoryIds: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CouponApplicationResult {
  valid: boolean;
  error?: string;
  coupon?: Coupon | null;
  discount: number;
  message?: string;
  matchedProducts?: string[];
  matchedCategories?: string[];
}

export interface CouponFormData {
  id?: string;
  code: string;
  name: string;
  type: CouponType;
  amount?: string | number;
  percentage?: string | number;
  noteMessage?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  usageLimit?: string | number;
  productIds: string[];
  categoryIds: string[];
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  link: string;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  buttonTextColor?: string;
  buttonBgColor?: string;
  titleColor?: string;
}

export interface StoreSettings {
  companyName: string;
  tagline?: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  contactPhone: string;
  whatsappNumber?: string;
  hotlineHours?: string;
  email: string;
  address?: string;
  socialLinks: {
    facebook: { enabled: boolean; url: string };
    instagram: { enabled: boolean; url: string };
    youtube: { enabled: boolean; url: string };
    twitter: { enabled: boolean; url: string };
    linkedin: { enabled: boolean; url: string };
    whatsapp: { enabled: boolean; url: string };
  };
  shippingCharges: {
    base: number;
    exceptions: Array<{ district: string; charge: number }>;
    dynamicShipping: {
      enabled: boolean;
      perKgCharge: number;
      startKg: number;
    };
    insideDhaka?: number;
    outsideDhaka?: number;
  };
  paymentGateways: {
    cod: { enabled: boolean; };
    bkash: { enabled: boolean; number: string; type: 'Personal' | 'Agent' | 'Merchant'; instructions: string; };
    nagad: { enabled: boolean; number: string; type: 'Personal' | 'Agent' | 'Merchant'; instructions: string; };
    rocket: { enabled: boolean; number: string; type: 'Personal' | 'Agent' | 'Merchant'; instructions: string; };
    bank: { enabled: boolean; accountName: string; accountNumber: string; bankName: string; branchName: string; instructions: string; };
  };
  orders?: {
    orderIdPrefix: string;
  };
  thankYouPage?: { title: string; subtitle: string; description: string; };
  gtm?: {
    containerId?: string;
  };
  ga4?: {
    enabled?: boolean;
    measurementId?: string;
  };
}
