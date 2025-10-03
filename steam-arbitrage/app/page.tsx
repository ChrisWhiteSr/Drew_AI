'use client';

import { useState } from 'react';

interface AnalysisResult {
  success: boolean;
  steamId: string;
  appId: number;
  totalProfit: number;
  itemsAnalyzed: number;
  profitableItems: number;
  opportunities: Array<{
    item: {
      name: string;
      market_hash_name: string;
      icon_url: string;
    };
    steamPrice: number;
    bestMarket: string;
    marketPrice: number;
    netPayout: number;
    profit: number;
    profitPercentage: number;
  }>;
  error?: string;
}

export default function Home() {
  const [steamId, setSteamId] = useState('');
  const [appId, setAppId] = useState('730');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steamid: steamId,
          appId: parseInt(appId),
          maxItems: 25
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">⚡ Steam Arbitrage</h1>
          <p className="text-gray-400">Find hidden profits in your Steam inventory</p>
        </header>

        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label htmlFor="steamid" className="block text-sm font-medium mb-2">
                Steam ID or Profile URL
              </label>
              <input
                type="text"
                id="steamid"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="76561198000000000 or steamcommunity.com/profiles/..."
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />
              <p className="text-sm text-gray-400 mt-1">
                ℹ️ Your inventory must be public
              </p>
            </div>

            <div>
              <label htmlFor="appid" className="block text-sm font-medium mb-2">
                Game
              </label>
              <select
                id="appid"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              >
                <option value="730">Counter-Strike 2</option>
                <option value="570">Dota 2</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? '🔍 Analyzing...' : '🔍 Analyze My Inventory'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-8">
            <p className="text-red-200">⚠️ {error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">📊 Analysis Results</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-400">
                    ${result.totalProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Total Potential Profit</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-3xl font-bold text-cyan-400">
                    {result.itemsAnalyzed}
                  </div>
                  <div className="text-sm text-gray-400">Items Analyzed</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-400">
                    {result.profitableItems}
                  </div>
                  <div className="text-sm text-gray-400">Profitable Items</div>
                </div>
              </div>
            </div>

            {result.opportunities.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">💎 Best Opportunities</h2>
                <div className="space-y-3">
                  {result.opportunities
                    .filter(opp => opp.profit > 0)
                    .slice(0, 10)
                    .map((opp, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={`https://community.cloudflare.steamstatic.com/economy/image/${opp.item.icon_url}`}
                            alt={opp.item.name}
                            className="w-16 h-16 object-contain bg-gray-800 rounded"
                          />
                          <div>
                            <div className="font-semibold">{opp.item.market_hash_name}</div>
                            <div className="text-sm text-gray-400">
                              Steam: ${opp.steamPrice.toFixed(2)} → {opp.bestMarket}: $
                              {opp.marketPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-400">
                            +${opp.profit.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">
                            +{opp.profitPercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {result.opportunities.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-400">No profitable opportunities found.</p>
              </div>
            )}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            🔒 We only access public inventory data. No login required.
            <br />
            Steam Arbitrage is not affiliated with Valve Corporation.
          </p>
        </footer>
      </div>
    </main>
  );
}
