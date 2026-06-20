import { OrderStatus } from "@/types/db";

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
