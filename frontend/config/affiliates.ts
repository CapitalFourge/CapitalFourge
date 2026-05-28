export interface AffiliatePartner {
  name: string;
  id: string;
  referralUrl: string;
  categories: string[];
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    name: "Binance",
    id: "binance",
    referralUrl: "https://www.binance.com/register?ref=TU_REFERIDO",
    categories: ["CRYPTO"],
  },
  {
    name: "Bybit",
    id: "bybit",
    referralUrl: "https://www.bybit.com/register?ref=TU_REFERIDO",
    categories: ["CRYPTO"],
  },
  {
    name: "Interactive Brokers",
    id: "ibkr",
    referralUrl: "https://www.interactivebrokers.com/referral/TU_REFERIDO",
    categories: ["STOCKS", "COMMODITIES", "FOREX"],
  },
];

export function getPartnerForCategory(category: string): AffiliatePartner | undefined {
  return AFFILIATE_PARTNERS.find((p) => p.categories.includes(category));
}
