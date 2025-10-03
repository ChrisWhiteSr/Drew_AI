// API route for analyzing inventory and finding profit opportunities

import { NextRequest, NextResponse } from 'next/server';
import { fetchSteamInventory, getSteamMarketPrice, validateSteamId, extractSteamId } from '@/lib/steam/inventory';
import { getEnabledAdapters } from '@/lib/marketplaces';
import { calculateProfit } from '@/lib/math';
import { AnalysisResult, ProfitOpportunity, MarketplaceQuote } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { steamid: steamIdInput, appId, currency = 'USD', maxItems = 50 } = body;

    // Validate required parameters
    if (!steamIdInput) {
      return NextResponse.json(
        { error: 'steamid is required' },
        { status: 400 }
      );
    }

    if (!appId) {
      return NextResponse.json(
        { error: 'appId is required' },
        { status: 400 }
      );
    }

    // Validate and extract Steam ID
    if (!validateSteamId(steamIdInput)) {
      return NextResponse.json(
        { error: 'Invalid Steam ID or profile URL' },
        { status: 400 }
      );
    }

    const steamId = await extractSteamId(steamIdInput);
    if (!steamId) {
      return NextResponse.json(
        { error: 'Could not extract Steam ID. Please use SteamID64 or profile URL with numeric ID.' },
        { status: 400 }
      );
    }

    // Fetch inventory
    console.log(`Fetching inventory for ${steamId}, appId: ${appId}`);
    const items = await fetchSteamInventory(steamId, appId);
    
    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No marketable items found in inventory',
        steamId,
        appId,
        totalProfit: 0,
        itemsAnalyzed: 0,
        profitableItems: 0,
        opportunities: []
      });
    }

    // Limit items for performance
    const itemsToAnalyze = items.slice(0, maxItems);
    
    // Get enabled marketplace adapters
    const adapters = getEnabledAdapters();
    
    console.log(`Analyzing ${itemsToAnalyze.length} items across ${adapters.length} marketplaces`);

    // Analyze each item
    const opportunities: ProfitOpportunity[] = [];
    
    for (const item of itemsToAnalyze) {
      try {
        // Get Steam market price
        const steamPrice = await getSteamMarketPrice(appId, item.market_hash_name);
        
        if (!steamPrice || steamPrice === 0) {
          continue; // Skip items without Steam price
        }

        // Get quotes from all marketplaces
        const quotePromises = adapters.map(adapter =>
          adapter.priceItem({
            itemName: item.market_hash_name,
            appId,
            contextId: 2
          }).catch(err => {
            console.error(`Error getting quote from ${adapter.displayName}:`, err);
            return null;
          })
        );

        const quotes = (await Promise.all(quotePromises))
          .filter((q): q is MarketplaceQuote => q !== null);

        if (quotes.length === 0) {
          continue; // Skip if no marketplace quotes
        }

        // Find best marketplace quote
        const bestQuote = quotes.reduce((best, current) =>
          current.netPayout > best.netPayout ? current : best
        );

        // Calculate profit
        const { profit, profitPercentage } = calculateProfit(steamPrice, bestQuote.netPayout);

        opportunities.push({
          item,
          steamPrice,
          bestMarket: bestQuote.marketplace,
          marketPrice: bestQuote.askPrice,
          netPayout: bestQuote.netPayout,
          profit,
          profitPercentage,
          allQuotes: quotes
        });

      } catch (error) {
        console.error(`Error analyzing item ${item.market_hash_name}:`, error);
        continue;
      }
    }

    // Sort by profit (highest first)
    opportunities.sort((a, b) => b.profit - a.profit);

    // Calculate summary statistics
    const totalProfit = opportunities
      .filter(o => o.profit > 0)
      .reduce((sum, o) => sum + o.profit, 0);
    
    const profitableItems = opportunities.filter(o => o.profit > 0).length;

    const result: AnalysisResult = {
      steamId,
      appId,
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      itemsAnalyzed: itemsToAnalyze.length,
      profitableItems,
      opportunities
    };

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('Analysis API error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze inventory',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Using Node.js runtime for Steam API compatibility
export const runtime = 'nodejs';
