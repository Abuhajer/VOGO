"use client";

import { useLocale } from "next-intl";
import { updateOrderStatus } from "@/server/orders";
import { OrderStatus } from "@/types/db";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  total: number;
};

export default function AdminOrdersClient({ orders }: { orders: Order[] }) {
  const locale = useLocale();

  return (
    <div className="space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gold-glow/15 rounded-sm p-4 bg-obsidian"
        >
          <div>
            <p className="text-ivory font-serif">{order.orderNumber}</p>
            <p className="text-sm text-ivory-muted">{order.customerName}</p>
          </div>
          <select
            value={order.status}
            onChange={async (event) => {
              await updateOrderStatus(order.id, event.target.value as OrderStatus);
              window.location.reload();
            }}
            className="bg-void border border-gold-glow/20 rounded-sm px-3 py-2 text-sm"
          >
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
