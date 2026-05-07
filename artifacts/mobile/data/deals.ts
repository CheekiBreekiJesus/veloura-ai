export type Deal = {
  id: string;
  retailer: string;
  eventTag: string;
  discount: string;
  saleUrl: string;
  expiresAt?: string;
};

export type Coupon = {
  id: string;
  retailer: string;
  code: string;
  description: string;
  expiresAt?: string;
};

const DEALS_ALL: Deal[] = [
  {
    id: "d-1",
    retailer: "Sephora",
    eventTag: "Beauty Insider Event",
    discount: "Up to 20% off",
    saleUrl: "https://www.sephora.com/sale",
    expiresAt: "2026-09-30",
  },
  {
    id: "d-2",
    retailer: "Ulta",
    eventTag: "21 Days of Beauty",
    discount: "Up to 50% off",
    saleUrl: "https://www.ulta.com/featured/sales",
    expiresAt: "2026-08-31",
  },
  {
    id: "d-3",
    retailer: "ASOS",
    eventTag: "Summer Sale",
    discount: "Up to 70% off",
    saleUrl: "https://www.asos.com/sale/",
    expiresAt: "2026-07-31",
  },
  {
    id: "d-4",
    retailer: "Amazon",
    eventTag: "Beauty Week",
    discount: "Save on top brands",
    saleUrl: "https://www.amazon.com/deals",
  },
  {
    id: "d-5",
    retailer: "H&M",
    eventTag: "Summer Clearance",
    discount: "Up to 60% off",
    saleUrl: "https://www2.hm.com/en_us/sale.html",
    expiresAt: "2026-08-15",
  },
  {
    id: "d-6",
    retailer: "Zara",
    eventTag: "Summer Sale",
    discount: "Up to 40% off",
    saleUrl: "https://www.zara.com/us/en/new-collection",
    expiresAt: "2026-07-20",
  },
  {
    id: "d-7",
    retailer: "Revolve",
    eventTag: "Flash Sale",
    discount: "Extra 25% off sale",
    saleUrl: "https://www.revolve.com/sale/",
    expiresAt: "2026-06-30",
  },
  {
    id: "d-8",
    retailer: "Nordstrom",
    eventTag: "Anniversary Sale",
    discount: "Up to 40% off",
    saleUrl: "https://www.nordstrom.com/sr?keyword=anniversary+sale",
    expiresAt: "2026-09-01",
  },
  {
    id: "d-9",
    retailer: "Paula's Choice",
    eventTag: "Friends & Family",
    discount: "20% off sitewide",
    saleUrl: "https://www.paulaschoice.com/sale",
    expiresAt: "2026-07-01",
  },
  {
    id: "d-10",
    retailer: "Mejuri",
    eventTag: "Member Sale",
    discount: "15% off all jewelry",
    saleUrl: "https://mejuri.com/en_ca/collections/sale",
    expiresAt: "2026-12-31",
  },
];

const COUPONS_ALL: Coupon[] = [
  {
    id: "c-1",
    retailer: "Sephora",
    code: "SAVEMORE20",
    description: "20% off for Beauty Insiders",
    expiresAt: "2026-08-31",
  },
  {
    id: "c-2",
    retailer: "Ulta",
    code: "ULTABEAUTY",
    description: "15% off any $30+ purchase",
    expiresAt: "2026-07-31",
  },
  {
    id: "c-3",
    retailer: "ASOS",
    code: "ASOS20NEW",
    description: "20% off your first order",
    expiresAt: "2026-12-31",
  },
  {
    id: "c-4",
    retailer: "ASOS",
    code: "ASOSSHIP",
    description: "Free standard delivery",
    expiresAt: "2026-12-31",
  },
  {
    id: "c-5",
    retailer: "Amazon",
    code: "BEAUTY15",
    description: "15% off beauty & skincare",
    expiresAt: "2026-09-30",
  },
  {
    id: "c-6",
    retailer: "H&M",
    code: "HMSUMMER15",
    description: "15% off full-price items",
    expiresAt: "2026-08-15",
  },
  {
    id: "c-7",
    retailer: "Revolve",
    code: "REVOLVENEW",
    description: "25% off for new customers",
    expiresAt: "2026-09-30",
  },
  {
    id: "c-8",
    retailer: "Nordstrom",
    code: "NSTYLE20",
    description: "20% off full-price fashion",
    expiresAt: "2026-10-31",
  },
  {
    id: "c-9",
    retailer: "Paula's Choice",
    code: "PAULA15",
    description: "15% off any order",
    expiresAt: "2026-08-31",
  },
  {
    id: "c-10",
    retailer: "Mejuri",
    code: "MEJURI10",
    description: "10% off your first order",
    expiresAt: "2026-12-31",
  },
  {
    id: "c-11",
    retailer: "Anthropologie",
    code: "ANTHRO20",
    description: "20% off your order",
    expiresAt: "2026-07-31",
  },
  {
    id: "c-12",
    retailer: "Zara",
    code: "ZARANEW",
    description: "Free shipping on orders $50+",
    expiresAt: "2026-12-31",
  },
];

function isActive(expiresAt?: string): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}

export function getActiveDeals(): Deal[] {
  return DEALS_ALL.filter((d) => isActive(d.expiresAt));
}

export function getActiveCoupons(): Coupon[] {
  return COUPONS_ALL.filter((c) => isActive(c.expiresAt));
}

export function getRetailersOnSale(): Set<string> {
  return new Set(getActiveDeals().map((d) => d.retailer));
}
