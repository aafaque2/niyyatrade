/* One-off: enrich asset-universe.json with non-NSE blue-chips.
 * Usage: node scripts/enrich-universe.js
 * Idempotent — merges by ticker, skips failures (rerun to retry them).
 */
const fs = require('fs');
const path = require('path');
const YahooFinance = require('yahoo-finance2').default;

const SEED = path.join(__dirname, '..', 'src', 'modules', 'asset', 'data', 'asset-universe.json');

const LISTS = {
  NASDAQ: {
    currency: 'USD',
    tickers: [
      'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'AVGO', 'TSLA',
      'COST', 'PEP', 'NFLX', 'AMD', 'ADBE', 'AMGN', 'TXN', 'INTU', 'QCOM',
      'HON', 'AMAT', 'BKNG', 'SBUX', 'GILD', 'MU', 'ADI', 'LRCX', 'PANW',
      'CSX', 'KLAC', 'SNPS', 'CDNS', 'MELI', 'MAR', 'NXPI', 'ORLY', 'CTAS',
      'CSGP', 'PAYX', 'ROST', 'MNST', 'KDP', 'PYPL', 'ABNB', 'EA', 'KHC',
      'EXC', 'AEP', 'TTD', 'CRWD', 'DDOG',
    ],
  },
  NYSE: {
    currency: 'USD',
    tickers: [
      'BRK.B', 'JPM', 'V', 'XOM', 'UNH', 'MA', 'JNJ', 'PG', 'LLY', 'HD',
      'CVX', 'MRK', 'KO', 'WMT', 'DIS', 'BAC', 'ABBV', 'CRM', 'ORCL', 'ACN',
      'LMT', 'NKE', 'TMO', 'DHR', 'MCD', 'LIN', 'ABT', 'WFC', 'CAT', 'GE',
      'IBM', 'T', 'GS', 'MS', 'RTX', 'AXP', 'SPGI', 'BLK', 'C', 'PFE',
    ],
  },
  BSE: {
    currency: 'INR',
    suffix: '.BO',
    tickers: [
      'RELIANCE', 'HDFCBANK', 'ICICIBANK', 'INFY', 'SBIN', 'BHARTIARTL',
      'ITC', 'KOTAKBANK', 'LT', 'HCLTECH', 'AXISBANK', 'MARUTI', 'SUNPHARMA',
      'TITAN', 'ULTRACEMCO', 'NTPC', 'POWERGRID', 'TATAMOTORS', 'TATASTEEL',
      'WIPRO', 'BAJFINANCE', 'INDUSINDBK', 'TECHM', 'NESTLEIND', 'ASIANPAINT',
      'ADANIENT', 'ADANIPORTS', 'TATAPOWER', 'ONGC', 'COALINDIA',
    ],
  },
  LSE: {
    currency: 'GBP',
    suffix: '.L',
    tickers: [
      'SHEL', 'HSBA', 'AZN', 'GSK', 'BP', 'RIO', 'BATS', 'DGE', 'LLOY',
      'VOD', 'GLEN', 'NG', 'BARC', 'AAL', 'PRU', 'STAN', 'RKT', 'AV',
      'LSEG', 'SGE', 'REL', 'AHT', 'CPG', 'FLTR', 'DCC', 'WTB', 'TSCO',
      'BDEV', 'MKS', 'BT-A',
    ],
  },
  XETRA: {
    currency: 'EUR',
    suffix: '.DE',
    tickers: [
      'SAP', 'SIE', 'ALV', 'DTE', 'MBG', 'BMW', 'VOW3', 'BAS', 'BAYN',
      'DBK', 'DB1', 'EOAN', 'RWE', 'VNA', 'HEN3', 'FRE', 'IFX', 'MTX',
      'ADS', 'BEI', 'CON', 'PUM', 'TKA', 'HEI', 'SY1',
    ],
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  const byTicker = new Map(seed.map((a) => [a.ticker.toUpperCase(), a]));
  let added = 0;
  let updated = 0;
  const failed = [];

  for (const [exchange, cfg] of Object.entries(LISTS)) {
    for (const base of cfg.tickers) {
      const ticker = cfg.suffix ? `${base}${cfg.suffix}` : base;
      if (byTicker.has(ticker.toUpperCase())) continue;
      try {
        const r = await yf.quoteSummary(ticker, { modules: ['assetProfile', 'price'] });
        const name =
          r?.price?.longName || r?.price?.shortName || base;
        const entry = {
          ticker,
          name,
          sector: r?.assetProfile?.sector || 'Unknown',
          industry: r?.assetProfile?.industry || null,
          exchange,
          currency: r?.price?.currency || cfg.currency,
        };
        seed.push(entry);
        byTicker.set(ticker.toUpperCase(), entry);
        added += 1;
        console.log(`+ ${ticker} | ${name} | ${entry.sector}`);
      } catch (e) {
        failed.push(ticker);
        console.log(`x ${ticker} FAILED: ${e.message}`);
      }
      await sleep(250);
    }
  }

  // Refresh the thin legacy non-NSE rows (they had placeholder names/sectors)
  // when Yahoo now returns real data — but never touch NSE rows.
  for (const a of seed) {
    if (['NASDAQ', 'NYSE', 'BSE', 'LSE', 'XETRA'].includes(a.exchange) && a.sector === 'Unknown') {
      try {
        const r = await yf.quoteSummary(a.ticker, { modules: ['assetProfile', 'price'] });
        if (r?.assetProfile?.sector) {
          a.sector = r.assetProfile.sector;
          a.industry = r.assetProfile.industry || a.industry || null;
          if (r?.price?.longName) a.name = r.price.longName;
          updated += 1;
          console.log(`~ ${a.ticker} enriched: ${a.sector}`);
        }
      } catch {
        failed.push(a.ticker);
      }
      await sleep(250);
    }
  }

  seed.sort((a, b) => a.ticker.localeCompare(b.ticker));
  fs.writeFileSync(SEED, JSON.stringify(seed, null, 2) + '\n');
  console.log(`\nDone. total=${seed.length} added=${added} updated=${updated} failed=${failed.length}`);
  if (failed.length) console.log('Failed:', failed.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
