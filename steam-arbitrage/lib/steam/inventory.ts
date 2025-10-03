// Steam API client for fetching inventory

import { SteamInventoryItem } from '../types';

interface SteamInventoryResponse {
  assets?: Array<{
    assetid: string;
    classid: string;
    instanceid: string;
    amount: string;
  }>;
  descriptions?: Array<{
    classid: string;
    instanceid: string;
    market_hash_name: string;
    market_name: string;
    name: string;
    type: string;
    icon_url: string;
    name_color?: string;
    tradable: number;
    marketable: number;
  }>;
  success: boolean;
  total_inventory_count?: number;
}

/**
 * Fetch Steam inventory for a user
 * @param steamId64 - Steam ID (64-bit)
 * @param appId - Game app ID (730 for CS2, 570 for Dota2)
 * @param contextId - Context ID (default 2 for most games)
 * @returns Array of inventory items
 */
export async function fetchSteamInventory(
  steamId64: string,
  appId: number,
  contextId: number = 2
): Promise<SteamInventoryItem[]> {
  try {
    // Steam Community API endpoint
    const url = `https://steamcommunity.com/inventory/${steamId64}/${appId}/${contextId}?l=english&count=5000`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://steamcommunity.com/',
      },
      cache: 'no-store' // Don't use Next.js caching for now
    });

    if (!response.ok) {
      // Try to get more details from the response
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        // Ignore
      }

      if (response.status === 403) {
        throw new Error('Inventory is private. Please make your Steam inventory public in Steam Privacy Settings.');
      }
      if (response.status === 400) {
        // 400 often means no items or game-specific privacy
        throw new Error(`Steam returned a 400 error. This usually means you have NO items for this game (CS2 or Dota 2). Check: https://steamcommunity.com/inventory/${steamId64}/${appId}/2`);
      }
      if (response.status === 429) {
        throw new Error('Too many requests to Steam. Please wait a moment and try again.');
      }
      throw new Error(`Failed to fetch inventory (Status ${response.status}). Details: ${responseText.substring(0, 100)}`);
    }

    const data: SteamInventoryResponse = await response.json();

    if (!data.success) {
      throw new Error('Steam returned unsuccessful response. Your inventory may be empty or private for this game.');
    }

    if (!data.assets || !data.descriptions || data.assets.length === 0) {
      throw new Error(`No items found in your ${appId === 730 ? 'CS2' : 'Dota 2'} inventory. Your inventory might be empty for this game.`);
    }

    // Merge assets with descriptions
    const items: SteamInventoryItem[] = data.assets
      .map(asset => {
        const description = data.descriptions?.find(
          desc => desc.classid === asset.classid && desc.instanceid === asset.instanceid
        );

        if (!description) {
          return null;
        }

        return {
          assetid: asset.assetid,
          classid: asset.classid,
          instanceid: asset.instanceid,
          amount: asset.amount,
          name: description.name,
          market_hash_name: description.market_hash_name,
          market_name: description.market_name,
          name_color: description.name_color,
          icon_url: description.icon_url,
          type: description.type,
          tradable: description.tradable === 1,
          marketable: description.marketable === 1
        } as SteamInventoryItem;
      })
      .filter((item): item is SteamInventoryItem => item !== null);

    return items.filter(item => item.marketable); // Only return marketable items
  } catch (error) {
    console.error('Error fetching Steam inventory:', error);
    throw error;
  }
}

/**
 * Get Steam market price for an item
 * @param appId - Game app ID
 * @param marketHashName - Market hash name of the item
 * @returns Price in USD or null if not found
 */
export async function getSteamMarketPrice(
  appId: number,
  marketHashName: string
): Promise<number | null> {
  try {
    const encodedName = encodeURIComponent(marketHashName);
    const url = `https://steamcommunity.com/market/priceoverview/?appid=${appId}&currency=1&market_hash_name=${encodedName}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SteamArbitrageBot/1.0)',
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success && data.lowest_price) {
      // Parse price string (e.g., "$1.23" or "1,23€")
      const priceStr = data.lowest_price.replace(/[^0-9.,]/g, '');
      const price = parseFloat(priceStr.replace(',', '.'));
      return isNaN(price) ? null : price;
    }

    return null;
  } catch (error) {
    console.error('Error fetching Steam market price:', error);
    return null;
  }
}

/**
 * Validate Steam ID format
 */
export function validateSteamId(steamId: string): boolean {
  // SteamID64 pattern
  const steamID64Pattern = /^7656119[0-9]{10}$/;
  
  // Profile URL patterns
  const profileURLPattern = /steamcommunity\.com\/(id|profiles)\/([^\/\s]+)/;
  
  return steamID64Pattern.test(steamId) || profileURLPattern.test(steamId);
}

/**
 * Extract SteamID64 from profile URL or resolve custom URL
 */
export async function extractSteamId(input: string): Promise<string | null> {
  // If already a SteamID64
  const steamID64Pattern = /^7656119[0-9]{10}$/;
  if (steamID64Pattern.test(input)) {
    return input;
  }

  // Try to extract from numeric profile URL
  const profileURLPattern = /steamcommunity\.com\/profiles\/([0-9]+)/;
  const match = input.match(profileURLPattern);
  
  if (match && match[1]) {
    return match[1];
  }

  // Try to extract custom URL (steamcommunity.com/id/username)
  const customURLPattern = /steamcommunity\.com\/id\/([^\/\s?]+)/;
  const customMatch = input.match(customURLPattern);
  
  if (customMatch && customMatch[1]) {
    const vanityName = customMatch[1];
    
    try {
      // Use Steam's resolve vanity URL API
      const apiKey = process.env.STEAM_API_KEY || process.env.STEAM_PARTNER_API_KEY;
      
      if (!apiKey) {
        // Without API key, we can't resolve custom URLs
        // Try to scrape from profile page as fallback
        return await resolveSteamIdFromProfile(vanityName);
      }

      const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${vanityName}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.response && data.response.success === 1) {
        return data.response.steamid;
      }
    } catch (error) {
      console.error('Error resolving vanity URL:', error);
    }
  }

  return null;
}

/**
 * Resolve SteamID from profile page (fallback when no API key)
 */
async function resolveSteamIdFromProfile(vanityName: string): Promise<string | null> {
  try {
    const url = `https://steamcommunity.com/id/${vanityName}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SteamArbitrageBot/1.0)',
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Look for steamid in the HTML
    const match = html.match(/g_steamID = "(\d+)"/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Alternative pattern
    const match2 = html.match(/steamcommunity\.com\/profiles\/(\d+)/);
    if (match2 && match2[1]) {
      return match2[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error scraping profile:', error);
    return null;
  }
}
