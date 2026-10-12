export interface FlutterwaveTransaction {
  id: number;
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
  customer: { email: string; name: string };
  meta?: Record<string, string>;
}

/** Verify a Flutterwave transaction by ID using the secret key. */
export async function verifyFlutterwaveTransaction(
  transactionId: string,
): Promise<FlutterwaveTransaction | null> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    console.error("FLUTTERWAVE_SECRET_KEY is not configured");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "success") return null;

    return data.data as FlutterwaveTransaction;
  } catch {
    return null;
  }
}

/** Check whether a Flutterwave transaction matches expected amount and currency. */
export function isTransactionValid(
  tx: FlutterwaveTransaction,
  expectedAmount: number,
  expectedCurrency: string,
): boolean {
  return (
    tx.status === "successful" &&
    tx.amount >= expectedAmount &&
    tx.currency === expectedCurrency
  );
}
