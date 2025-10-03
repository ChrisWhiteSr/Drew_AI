// API route for fetching Steam inventory

import { NextRequest, NextResponse } from 'next/server';
import { fetchSteamInventory, validateSteamId, extractSteamId } from '@/lib/steam/inventory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steamIdInput = searchParams.get('steamid');
    const appIdParam = searchParams.get('appId');
    const contextIdParam = searchParams.get('contextId');

    // Validate required parameters
    if (!steamIdInput) {
      return NextResponse.json(
        { error: 'steamid parameter is required' },
        { status: 400 }
      );
    }

    if (!appIdParam) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
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

    const appId = parseInt(appIdParam);
    const contextId = contextIdParam ? parseInt(contextIdParam) : 2;

    // Validate app ID
    if (isNaN(appId) || (appId !== 730 && appId !== 570)) {
      return NextResponse.json(
        { error: 'Invalid appId. Use 730 for CS2 or 570 for Dota 2' },
        { status: 400 }
      );
    }

    // Fetch inventory
    const items = await fetchSteamInventory(steamId, appId, contextId);

    return NextResponse.json({
      success: true,
      steamId,
      appId,
      contextId,
      itemCount: items.length,
      items: items.slice(0, 100) // Limit to first 100 items for performance
    });

  } catch (error: any) {
    console.error('Inventory API error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch inventory',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Using Node.js runtime for better Steam API compatibility
export const runtime = 'nodejs';
