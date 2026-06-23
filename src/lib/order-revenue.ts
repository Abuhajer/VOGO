import { OrderStatus } from "@/types/db";

/** Order statuses that count toward revenue (excludes unpaid Stripe PENDING). */
export const REVENUE_ORDER_STATUSES: string[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export function isRevenueOrderStatus(status: string): boolean {
  return REVENUE_ORDER_STATUSES.includes(status);
}

export const REVENUE_ORDER_STATUS_FILTER = {
  status: { in: REVENUE_ORDER_STATUSES },
};
