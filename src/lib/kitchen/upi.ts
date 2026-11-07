export type UpiApp = {
  id: string;
  label: string;
  scheme: string;
};

export const UPI_APPS: UpiApp[] = [
  { id: "gpay", label: "Google Pay", scheme: "gpay://upi/pay" },
  { id: "phonepe", label: "PhonePe", scheme: "phonepe://pay" },
  { id: "paytm", label: "Paytm", scheme: "paytmmp://pay" },
  { id: "bhim", label: "BHIM", scheme: "bhim://pay" },
  { id: "amazonpay", label: "Amazon Pay", scheme: "amazonpay://upi/pay" },
  { id: "cred", label: "CRED", scheme: "credpay://upi/pay" },
  { id: "whatsapp", label: "WhatsApp Pay", scheme: "whatsapp://pay" },
  { id: "generic", label: "Any UPI app", scheme: "upi://pay" },
];

export function upiQuery(opts: {
  vpa: string;
  name: string;
  paise: number;
  note: string;
  tr: string;
}): string {
  const rupees = (opts.paise / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: opts.vpa,
    pn: opts.name,
    am: rupees,
    cu: "INR",
    tn: opts.note,
    tr: opts.tr,
  });
  return params.toString();
}

export function upiUri(
  app: UpiApp,
  opts: { vpa: string; name: string; paise: number; note: string; tr: string },
): string {
  return `${app.scheme}?${upiQuery(opts)}`;
}

export function genericUpiUri(opts: {
  vpa: string;
  name: string;
  paise: number;
  note: string;
  tr: string;
}): string {
  return `upi://pay?${upiQuery(opts)}`;
}
