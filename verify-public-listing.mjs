// Verify that the public Store page is reachable and contains the approved copy.
const url = 'https://apify.com/spbotdel/facebook-comments-scraper';
const response = await fetch(url, { redirect: 'follow' });
const html = await response.text();

const firstMatch = (pattern) => {
  const match = html.match(pattern);
  return match?.[1]?.replace(/\s+/g, ' ').trim().slice(0, 500) || null;
};

const result = {
  status: response.status,
  finalUrl: response.url,
  bytes: html.length,
  title: firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i),
  description: firstMatch(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
  ),
  ogTitle: firstMatch(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i,
  ),
  ogDescription: firstMatch(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i,
  ),
  hasPricing: html.includes('$1.20') || html.includes('1.20 per 1,000'),
  hasMcp: html.includes('mcp.apify.com'),
  hasReadmeHeading: html.includes(
    'What can this Facebook comments scraper extract',
  ),
};

console.log(JSON.stringify(result, null, 2));
if (response.status !== 200) throw new Error(`Store page returned ${response.status}`);
if (!result.hasReadmeHeading) throw new Error('Approved README copy is not visible');
if (!result.hasMcp) throw new Error('MCP section is not visible');
