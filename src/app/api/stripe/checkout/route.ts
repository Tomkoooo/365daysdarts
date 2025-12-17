import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";

const dashboardUrl = absoluteUrl("/dashboard");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session?.user.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Kressz Platform Pro",
              description: "Unlimited access to all courses",
            },
            unit_amount: 2900, 
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
      },
      success_url: dashboardUrl,
      cancel_url: dashboardUrl,
      customer_email: session.user.email,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.log("[STRIPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
