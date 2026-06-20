export const Role = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  STRIPE: "STRIPE",
  COD: "COD",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
