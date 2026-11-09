export type UpiApp = {
  id: string;
  label: string;
  scheme: string;
  icon: string;
};

export const UPI_APPS: UpiApp[] = [
  {
    id: "gpay",
    label: "Google Pay",
    scheme: "gpay://upi/pay",
    icon: "/payment-logos/googlepay.svg",
  },
  {
    id: "phonepe",
    label: "PhonePe",
    scheme: "phonepe://pay",
    icon: "/payment-logos/phonepe.svg",
  },
  {
    id: "paytm",
    label: "Paytm",
    scheme: "paytmmp://pay",
    icon: "/payment-logos/paytm.svg",
  },
  {
    id: "bhim",
    label: "BHIM",
    scheme: "bhim://pay",
    icon: "/payment-logos/bhim.svg",
  },
  {
    id: "amazonpay",
    label: "Amazon Pay",
    scheme: "amazonpay://upi/pay",
    icon: "/payment-logos/amazonpay.svg",
  },
  {
    id: "cred",
    label: "CRED",
    scheme: "credpay://upi/pay",
    icon: "/payment-logos/cred.svg",
  },
  {
    id: "whatsapp",
    label: "WhatsApp Pay",
    scheme: "whatsapp://pay",
    icon: "/payment-logos/whatsapp.svg",
  },
  {
    id: "generic",
    label: "Any UPI app",
    scheme: "upi://pay",
    icon: "/payment-logos/upi.svg",
  },
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
