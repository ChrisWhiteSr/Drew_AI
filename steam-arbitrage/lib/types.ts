// Core types for Steam Arbitrage

export interface SteamInventoryItem {
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
  name: string;
  market_hash_name: string;
  market_name: string;
  name_color?: string;
  icon_url: string;
  type?: string;
  tradable: boolean;
  marketable: boolean;
}

export interface MarketplaceQuote {
  marketplace: string;
  itemName: string;
  askPrice: number;
  currency: string;
  feePct: number;
  withdrawalFee?: number;
  netPayout: number;
  url?: string;
}

export interface MarketplaceAdapter {
  id: string;
  displayName: string;
  priceItem: (params: {
    itemName: string;
    appId: number;
    contextId?: number;
  }) => Promise<MarketplaceQuote | null>;
}

export interface ProfitOpportunity {
  item: SteamInventoryItem;
  steamPrice: number;
  bestMarket: string;
  marketPrice: number;
  netPayout: number;
  profit: number;
  profitPercentage: number;
  allQuotes: MarketplaceQuote[];
}

export interface AnalysisResult {
  steamId: string;
  appId: number;
  totalProfit: number;
  itemsAnalyzed: number;
  profitableItems: number;
  opportunities: ProfitOpportunity[];
}
