import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  const body = await req.text();
  // @ts-ignore
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  await connectDB();
  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 });
    }

    await User.findByIdAndUpdate(session.metadata.userId, {
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      subscriptionStatus: 'active',
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await User.findOneAndUpdate(
      { subscriptionId: subscription.id },
      { subscriptionStatus: 'active' }
    );
  }

  return new NextResponse(null, { status: 200 });
}
