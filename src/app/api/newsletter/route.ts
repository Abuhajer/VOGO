import { NextResponse } from "next/server";
import { subscribeNewsletter } from "@/server/newsletter-actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await subscribeNewsletter(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
