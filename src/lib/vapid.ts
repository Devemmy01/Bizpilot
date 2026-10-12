export function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  // Keys must be stable: browsers bind each push subscription to the public key it was
  // created with, so regenerating keys per process silently breaks every existing device.
  if (!publicKey || !privateKey) {
    throw new Error(
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not configured (generate with `npx web-push generate-vapid-keys`)",
    );
  }

  return { publicKey, privateKey };
}
