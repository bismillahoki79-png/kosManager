// Placeholder for Midtrans integration

export function createSnapTransaction(invoiceId: number, amount: number) {
  // construct payload, call Midtrans Snap API
  // return { orderId, redirectUrl }
  return {
    orderId: `MIDTRANS_ORDER_${invoiceId}`,
    redirectUrl: "https://app.midtrans.com/snap/v2/vtweb/example",
  };
}

export function validateSignature(
  key: string,
  payload: string,
  signature: string,
): boolean {
  // placeholder for verifying signature key
  return key === signature;
}
