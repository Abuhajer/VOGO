"use server";

import { auth } from "@/lib/auth";
import { buildRevenueTrend } from "@/lib/dashboard-charts";
import { prisma } from "@/lib/db";
import { Role, OrderStatus } from "@/types/db";
import type {
  AccountDashboardData,
  AdminDashboardData,
  ChartSegment,
  DashboardOrderRow,
} from "@/types/dashboard";

export type {
  AccountDashboardData,
  AdminDashboardData,
  ChartBar,
  ChartSegment,
  DashboardOrderRow,
} from "@/types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#C9A84C",
  CONFIRMED: "#B8954A",
  PAID: "#6EE7B7",
  SHIPPED: "#93C5FD",
  DELIVERED: "#34D399",
  CANCELLED: "#71717A",
};

function buildStatusBreakdown(
  rows: { status: string }[],
  labels: Record<string, string>
): ChartSegment[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  return Object.values(OrderStatus)
    .map((status) => ({
      key: status,
      label: labels[status] ?? status,
      value: counts.get(status) ?? 0,
      color: STATUS_COLORS[status] ?? "#C9A84C",
    }))
    .filter((segment) => segment.value > 0);
}

const REVENUE_STATUSES = {
  status: { not: OrderStatus.CANCELLED },
} as const;

function mapOrderRow(order: {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date;
  items: unknown[];
}): DashboardOrderRow {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.length,
  };
}

export async function getAdminDashboardData(
  statusLabels: Record<string, string>,
  locale: string
): Promise<AdminDashboardData> {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const [orders, revenue, customers, products, pendingOrders, weekOrders, allOrders, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ where: REVENUE_STATUSES, _sum: { total: true } }),
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
      prisma.product.count({ where: { active: true } }),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.findMany({
        where: { createdAt: { gte: weekStart }, ...REVENUE_STATUSES },
        select: { total: true, createdAt: true },
      }),
      prisma.order.findMany({ select: { status: true } }),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    stats: {
      orders,
      revenue: revenue._sum.total ?? 0,
      customers,
      products,
      pendingOrders,
      weekRevenue,
    },
    statusBreakdown: buildStatusBreakdown(allOrders, statusLabels),
    revenueTrend: buildRevenueTrend(weekOrders, locale),
    recentOrders: recentOrders.map(mapOrderRow),
  };
}

export async function getAccountDashboardData(
  userId: string,
  locale: string,
  statusLabels: Record<string, string>
): Promise<AccountDashboardData> {
  const session = await auth();
  if (!session?.user || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = orders
    .filter((order) => order.status !== OrderStatus.CANCELLED)
    .reduce((sum, order) => sum + order.total, 0);
  const pendingCount = orders.filter((order) => order.status === OrderStatus.PENDING).length;
  const activeOrders = orders.filter((order) => order.status !== OrderStatus.CANCELLED);

  return {
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      memberSince: user.createdAt.toISOString(),
    },
    stats: {
      orderCount: activeOrders.length,
      totalSpent,
      pendingCount,
    },
    statusBreakdown: buildStatusBreakdown(activeOrders, statusLabels),
    recentOrders: activeOrders.slice(0, 5).map(mapOrderRow),
  };
}
