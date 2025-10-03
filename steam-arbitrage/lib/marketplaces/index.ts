// Marketplace adapters index

import { MarketplaceAdapter } from '../types';
import { skinportAdapter } from './skinport';
import { dmarketAdapter } from './dmarket';

/**
 * All available marketplace adapters
 */
export const marketplaceAdapters: MarketplaceAdapter[] = [
  skinportAdapter,
  dmarketAdapter,
];

/**
 * Get adapter by ID
 */
export function getMarketplaceAdapter(id: string): MarketplaceAdapter | null {
  return marketplaceAdapters.find(adapter => adapter.id === id) || null;
}

/**
 * Get all enabled adapters
 */
export function getEnabledAdapters(): MarketplaceAdapter[] {
  // For now, return all adapters
  // In the future, this could check environment variables or user preferences
  return marketplaceAdapters;
}

export { skinportAdapter, dmarketAdapter };
