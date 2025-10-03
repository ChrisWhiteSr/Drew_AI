// Math utilities for profit calculations

/**
 * Calculate net payout after marketplace fees
 * @param grossPrice - The gross price before fees
 * @param feePct - Fee percentage (0-1, e.g., 0.10 for 10%)
 * @param withdrawalFee - Optional flat withdrawal fee
 * @returns Net amount received after all fees
 */
export function calculateNetPayout(
  grossPrice: number,
  feePct: number,
  withdrawalFee: number = 0
): number {
  const afterPercentageFee = grossPrice * (1 - feePct);
  const netPayout = afterPercentageFee - withdrawalFee;
  return Math.max(0, netPayout); // Never return negative
}

/**
 * Calculate profit and profit percentage
 */
export function calculateProfit(
  steamPrice: number,
  marketNetPayout: number
): { profit: number; profitPercentage: number } {
  const profit = marketNetPayout - steamPrice;
  const profitPercentage = steamPrice > 0 ? (profit / steamPrice) * 100 : 0;
  
  return {
    profit: parseFloat(profit.toFixed(2)),
    profitPercentage: parseFloat(profitPercentage.toFixed(2))
  };
}

/**
 * Convert currency (simple implementation - could use external API)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = {}
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Simple conversion using rates map
  const rate = rates[`${fromCurrency}_${toCurrency}`] || 1;
  return amount * rate;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
