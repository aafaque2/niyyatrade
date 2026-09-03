/* One-off: import full NASDAQ + NYSE symbol lists from NASDAQ Trader.
 * Usage: node scripts/import-nasdaq-trader.js
 * Idempotent — merges by ticker into asset-universe.json.
 * Sources (free, official, updated daily by Nasdaq):
 *   https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt      (NASDAQ)
 *   https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt       (NYSE/AMEX/ARCA)
 * LSE/XETRA have no free bulk source; BSE blocks bots — those stay curated.
 */
const fs = require('fs');
const path = require('path');

const SEED = path.join(__dirname, '..', 'src', 'modules', 'asset', 'data', 'asset-universe.json');

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'NiyyaTrade/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parsePipeTable(text) {
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
  const header = lines[0].split('|');
  return lines.slice(1)
    .filter((l) => l.trim().length > 0 && !l.startsWith('File Creation Time'))
    .map((l) => {
      const cols = l.split('|');
      const row = {};
      header.forEach((h, i) => { row[h.trim()] = (cols[i] || '').trim(); });
      return row;
    });
}

async function main() {
  const seed = JSON.parse(fs.readFileSync(SEED, 'utf8'));
  const known = new Set(seed.map((a) => a.ticker.toUpperCase()));
  let addedNasdaq = 0;
  let addedNyse = 0;
  let skipped = 0;

  // 1. NASDAQ-listed
  const nasdaqRows = parsePipeTable(
    await fetchText('https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt'),
  );
  for (const r of nasdaqRows) {
    const sym = r['Symbol'];
    if (!sym || sym.includes('$') || sym.includes('/') || r['Test Issue'] === 'Y') {
      skipped += 1;
      continue;
    }
    const ticker = sym.toUpperCase();
    if (known.has(ticker)) continue;
    seed.push({
      ticker,
      name: r['Security Name'] || ticker,
      sector: 'Unknown',
      industry: null,
      exchange: 'NASDAQ',
      currency: 'USD',
    });
    known.add(ticker);
    addedNasdaq += 1;
  }

  // 2. Other-listed, NYSE only (Exchange === 'N'). AMEX/ARCA skipped to avoid
  //    mislabeling — their tickers resolve via live Yahoo search anyway.
  const otherRows = parsePipeTable(
    await fetchText('https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt'),
  );
  for (const r of otherRows) {
    const sym = r['ACT Symbol'];
    if (!sym || r['Exchange'] !== 'N' || sym.includes('$') || sym.includes('/') || r['Test Issue'] === 'Y') {
      skipped += 1;
      continue;
    }
    const ticker = sym.toUpperCase();
    if (known.has(ticker)) continue;
    seed.push({
      ticker,
      name: r['Security Name'] || ticker,
      sector: 'Unknown',
      industry: null,
      exchange: 'NYSE',
      currency: 'USD',
    });
    known.add(ticker);
    addedNyse += 1;
  }

  seed.sort((a, b) => a.ticker.localeCompare(b.ticker));
  fs.writeFileSync(SEED, JSON.stringify(seed, null, 2) + '\n');
  const counts = seed.reduce((m, x) => ((m[x.exchange] = (m[x.exchange] || 0) + 1), m), {});
  console.log(`Done. total=${seed.length} +NASDAQ=${addedNasdaq} +NYSE=${addedNyse} skipped=${skipped}`);
  console.log(counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
