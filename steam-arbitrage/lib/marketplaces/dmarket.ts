// DMarket marketplace adapter

import { MarketplaceAdapter, MarketplaceQuote } from '../types';
import { calculateNetPayout } from '../math';

const DMARKET_API_URL = 'https://api.dmarket.com';
const DMARKET_FEE_PCT = 0.05; // 5% fee
const DMARKET_WITHDRAWAL_FEE = 0; // No withdrawal fee

/**
 * DMarket marketplace adapter
 */
export const dmarketAdapter: MarketplaceAdapter = {
  id: 'dmarket',
  displayName: 'DMarket',
  
  async priceItem({ itemName, appId }) {
    try {
      // DMarket uses different game identifiers
      const gameId = appId === 730 ? 'a8db' : appId === 570 ? '9a92' : null;
      
      if (!gameId) {
        return null;
      }

      // DMarket API endpoint for item prices
      const url = `${DMARKET_API_URL}/exchange/v1/market/items?gameId=${gameId}&title=${encodeURIComponent(itemName)}&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 } // Cache for 1 minute
      });

      if (!response.ok) {
        console.error('DMarket API error:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.objects || data.objects.length === 0) {
        return null;
      }

      const item = data.objects[0];
      
      if (!item.price || !item.price.USD) {
        return null;
      }

      const askPrice = parseFloat(item.price.USD) / 100; // Convert cents to dollars
      const netPayout = calculateNetPayout(askPrice, DMARKET_FEE_PCT, DMARKET_WITHDRAWAL_FEE);

      return {
        marketplace: 'DMarket',
        itemName,
        askPrice,
        currency: 'USD',
        feePct: DMARKET_FEE_PCT,
        withdrawalFee: DMARKET_WITHDRAWAL_FEE,
        netPayout,
        url: `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(itemName)}`
      };
    } catch (error) {
      console.error('Error fetching DMarket price:', error);
      return null;
    }
  }
};

/**
 * Get game ID for DMarket
 */
export function getDMarketGameId(appId: number): string | null {
  const gameIdMap: Record<number, string> = {
    730: 'a8db', // CS2
    570: '9a92', // Dota 2
  };
  
  return gameIdMap[appId] || null;
}
