import { OrderStatus } from "@/types/db";

/** Fulfillment pipeline (excludes cancelled). */
export const ORDER_STATUS_PIPELINE = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const;

/** Orders that are finalized — no status changes or cancellation. */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

export function getOrderStatusLabels(t: (key: string) => string) {
  return {
    [OrderStatus.PENDING]: t("PENDING"),
    [OrderStatus.CONFIRMED]: t("CONFIRMED"),
    [OrderStatus.PAID]: t("PAID"),
    [OrderStatus.SHIPPED]: t("SHIPPED"),
    [OrderStatus.DELIVERED]: t("DELIVERED"),
    [OrderStatus.CANCELLED]: t("CANCELLED"),
  };
}

export function getPipelineStepIndex(status: string): number {
  if (status === OrderStatus.CANCELLED) return -1;
  return ORDER_STATUS_PIPELINE.indexOf(status as (typeof ORDER_STATUS_PIPELINE)[number]);
}

export function isOrderStatusLocked(status: string): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status as OrderStatus);
}

/** Whether an admin may cancel this order (not delivered or already cancelled). */
export function canCancelOrder(status: string): boolean {
  return !isOrderStatusLocked(status);
}

/**
 * Valid admin status transitions: forward in the pipeline, or cancel before delivery.
 * Delivered and cancelled orders cannot change.
 */
export function isValidOrderStatusTransition(current: string, next: OrderStatus): boolean {
  if (next === current) return true;
  if (isOrderStatusLocked(current)) return false;

  if (next === OrderStatus.CANCELLED) {
    return canCancelOrder(current);
  }

  const currentIdx = getPipelineStepIndex(current);
  const nextIdx = getPipelineStepIndex(next);
  if (currentIdx < 0 || nextIdx < 0) return false;

  return nextIdx >= currentIdx;
}

export function getAllowedOrderStatuses(current: string): OrderStatus[] {
  return Object.values(OrderStatus).filter((status) =>
    isValidOrderStatusTransition(current, status)
  );
}

export function getNextPipelineStatus(
  status: string,
  options?: { paymentMethod?: string }
): OrderStatus | null {
  if (status === OrderStatus.CANCELLED) return null;

  if (status === OrderStatus.PENDING && options?.paymentMethod === "STRIPE") {
    return null;
  }

  if (status === OrderStatus.CONFIRMED && options?.paymentMethod === "COD") {
    return OrderStatus.SHIPPED;
  }

  const index = getPipelineStepIndex(status);
  if (index < 0 || index >= ORDER_STATUS_PIPELINE.length - 1) return null;
  return ORDER_STATUS_PIPELINE[index + 1];
}

export function isPipelineComplete(status: string): boolean {
  return status === OrderStatus.DELIVERED;
}

