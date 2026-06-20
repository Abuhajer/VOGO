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
    role: string;
    memberSince: string;
  };
  stats: {
    orderCount: number;
    totalSpent: number;
    pendingCount: number;
  };
  statusBreakdown: ChartSegment[];
  recentOrders: DashboardOrderRow[];
};
