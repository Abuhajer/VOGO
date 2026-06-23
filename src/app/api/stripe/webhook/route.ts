import { NextResponse } from "next/server";
import { OrderStatus } from "@/types/db";
import { getPrisma } from "@/lib/db";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { incrementPromotionUsage } from "@/server/promotions";

export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] invalid signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      const orderId = session.metadata?.orderId;
      if (!orderId) {
        console.error("[stripe/webhook] checkout.session.completed missing orderId");
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        console.error("[stripe/webhook] order not found", orderId);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.status !== OrderStatus.PAID) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID, stripeSessionId: session.id },
        });

        if (order.promotionId) {
          const incremented = await incrementPromotionUsage(order.promotionId);
          if (!incremented) {
            console.warn("[stripe/webhook] promo usage limit reached after payment", order.promotionId);
          }
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.updateMany({
          where: { id: orderId, status: OrderStatus.PENDING },
          data: { status: OrderStatus.CANCELLED },
        });
      }
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
