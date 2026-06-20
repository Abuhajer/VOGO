import { NextResponse } from "next/server";
import { OrderStatus } from "@/types/db";
import { prisma } from "@/lib/db";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isStripeEnabled()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
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
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID, stripeSessionId: session.id },
      });
    }
  }

  return NextResponse.json({ received: true });
}
