// Skinport marketplace adapter

import { MarketplaceAdapter, MarketplaceQuote } from '../types';
import { calculateNetPayout } from '../math';

const SKINPORT_API_URL = 'https://api.skinport.com/v1';
const SKINPORT_FEE_PCT = 0.12; // 12% fee
const SKINPORT_WITHDRAWAL_FEE = 0; // No withdrawal fee

/**
 * Skinport marketplace adapter
 */
export const skinportAdapter: MarketplaceAdapter = {
  id: 'skinport',
  displayName: 'Skinport',
  
  async priceItem({ itemName, appId }) {
    try {
      // Skinport API endpoint for item prices
      const url = `${SKINPORT_API_URL}/items`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 } // Cache for 1 minute
      });

      if (!response.ok) {
        console.error('Skinport API error:', response.status);
        return null;
      }

      const items = await response.json();
      
      // Find matching item
      const item = items.find((i: any) => 
        i.market_hash_name === itemName && 
        i.app_id === appId
      );

      if (!item || !item.min_price) {
        return null;
      }

      const askPrice = item.min_price / 100; // Convert cents to dollars
      const netPayout = calculateNetPayout(askPrice, SKINPORT_FEE_PCT, SKINPORT_WITHDRAWAL_FEE);

      return {
        marketplace: 'Skinport',
        itemName,
        askPrice,
        currency: 'USD',
        feePct: SKINPORT_FEE_PCT,
        withdrawalFee: SKINPORT_WITHDRAWAL_FEE,
        netPayout,
        url: `https://skinport.com/item/${encodeURIComponent(itemName)}`
      };
    } catch (error) {
      console.error('Error fetching Skinport price:', error);
      return null;
    }
  }
};

/**
 * Get all items from Skinport (for caching/bulk operations)
 */
export async function getAllSkinportItems(appId: number): Promise<Map<string, number>> {
  try {
    const url = `${SKINPORT_API_URL}/items?app_id=${appId}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      return new Map();
    }

    const items = await response.json();
    const priceMap = new Map<string, number>();

    for (const item of items) {
      if (item.market_hash_name && item.min_price) {
        priceMap.set(item.market_hash_name, item.min_price / 100);
      }
    }

    return priceMap;
  } catch (error) {
    console.error('Error fetching all Skinport items:', error);
    return new Map();
  }
}
