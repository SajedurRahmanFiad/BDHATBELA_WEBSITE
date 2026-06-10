export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  RETURNED = 'Returned',
  CANCELLED = 'Cancelled'
}

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  images: string[];
  stock: number;
  rating: number;
  reviews: Review[];
  features?: string[];
  badge?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Order Manager';
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
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
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  link: string;
}

export interface StoreSettings {
  companyName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  contactPhone: string;
  email: string;
  socialLinks: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
  shippingCharges: {
    insideDhaka: number;
    outsideDhaka: number;
  };
  paymentGateways: {
    cod: { enabled: boolean; };
    bkash: { enabled: boolean; number: string; type: 'Personal' | 'Agent'; instructions: string; };
    nagad: { enabled: boolean; number: string; type: 'Personal' | 'Agent'; instructions: string; };
    rocket: { enabled: boolean; number: string; type: 'Personal' | 'Agent'; instructions: string; };
    bank: { enabled: boolean; accountName: string; accountNumber: string; bankName: string; branchName: string; instructions: string; };
  };
}
