export type ChartSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export type ChartBar = {
  label: string;
  value: number;
};

export type DashboardOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
};

export type CustomerOrderItem = {
  id: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  unitPrice: number;
  sizeCode?: string | null;
  sizeLabelEn?: string | null;
  sizeLabelAr?: string | null;
  customMeasurementsJson?: string | null;
};

export type CustomerOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  promoCode: string | null;
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string | null;
  locale: string;
  createdAt: string;
  items: CustomerOrderItem[];
};

export type AdminDashboardData = {
  stats: {
    orders: number;
    revenue: number;
    customers: number;
    products: number;
    pendingOrders: number;
    weekRevenue: number;
  };
  statusBreakdown: ChartSegment[];
  revenueTrend: ChartBar[];
  recentOrders: DashboardOrderRow[];
};

export type AccountDashboardData = {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
    preferredLocale: string;
    role: string;
    memberSince: string;
    hasPassword: boolean;
  };
  stats: {
    orderCount: number;
    totalSpent: number;
    pendingCount: number;
  };
  statusBreakdown: ChartSegment[];
  recentOrders: DashboardOrderRow[];
  allOrders: DashboardOrderRow[];
};
