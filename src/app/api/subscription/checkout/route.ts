import { NextResponse } from "next/server";
import { verifyFirebaseBearerToken } from "@/lib/firebase/admin";
import {
  SUBSCRIPTION_CURRENCY,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_PRICE,
} from "@/lib/subscription";

/** Returns the Flutterwave inline payment configuration for the $3/month plan. */
export async function POST(request: Request) {
  const decodedToken = await verifyFirebaseBearerToken(
    request.headers.get("authorization"),
  );

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, name } = await request.json();

    const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
    if (!publicKey) {
      return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
    }

    const config = {
      public_key: publicKey,
      // verify checks this prefix, so a payment can only unlock the account that started it
      tx_ref: `biz-sub-${decodedToken.uid}-${Date.now()}`,
      amount: SUBSCRIPTION_PRICE,
      currency: SUBSCRIPTION_CURRENCY,
      payment_options: "card",
      customer: {
        email: email || decodedToken.email,
        name: name || "Bizpilot User",
      },
      customizations: {
        title: "Bizpilot Analytics",
        description: "Monthly subscription — Full analytics & report generation",
        logo: "/icons/icon-512.png",
      },
      meta: {
        userId: decodedToken.uid,
        plan: SUBSCRIPTION_PLAN,
      },
    };

    return NextResponse.json({ config });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
