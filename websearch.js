// language: JavaScript, file: api/search.js
// target: Vercel Serverless (Node.js 18+)
// purpose: DuckDuckGo HTML search proxy — GET only, no key, no auth.

const OWNER = "@RASHIK_69";

const DDG_HTML = "https://html.duckduckgo.com/html/";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function decodeHtml(s) {
  if (!s) return "";
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function stripTags(s) {
  return s ? s.replace(/<[^>]*>/g, "").trim() : "";
}

function cleanDdgUrl(href) {
  if (!href) return null;
  // DDG wraps links: //duckduckgo.com/l/?uddg=<encoded>&rut=...
  const m = href.match(/uddg=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return href;
    }
  }
  if (href.startsWith("//")) return "https:" + href;
  return href;
}

function parseResults(html) {
  const results = [];

  // Each result block: <div class="result ..."> ... </div> containing result__a, result__snippet
  const blockRe =
    /<div[^>]*class="[^"]*result[^"]*results_links[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*result[^"]*results_links|<div[^>]*class="[^"]*nav-link|<\/body>)/gi;

  const blocks = [...html.matchAll(blockRe)];

  for (const b of blocks) {
    const chunk = b[1];

    const linkMatch =
      chunk.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
      chunk.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/i);

    if (!linkMatch) continue;

    const url = cleanDdgUrl(linkMatch[1]);
    const title = decodeHtml(stripTags(linkMatch[2]));

    let snippet = "";
    const snippetMatch = chunk.match(
      /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    ) || chunk.match(
      /<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    );
    if (snippetMatch) {
      snippet = decodeHtml(stripTags(snippetMatch[1]));
    }

    if (url && title) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const q = (req.query.q || req.query.query || "").trim();
  if (!q) {
    return res.status(400).json({
      owner: OWNER,
      error: "Missing ?q= parameter.",
      usage: "/api/search?q=anime+wallpaper",
    });
  }

  let limit = parseInt(req.query.limit || "15", 10);
  if (isNaN(limit) || limit <= 0) limit = 15;
  if (limit > 30) limit = 30;

  let upstream;
  try {
    upstream = await fetch(DDG_HTML, {
      method: "POST",
      headers: {
        ...HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `q=${encodeURIComponent(q)}&kl=us-en`,
    });
  } catch (err) {
    return res.status(502).json({
      owner: OWNER,
      error: "Upstream fetch failed.",
      reason: err.message,
    });
  }

  if (!upstream.ok) {
    return res.status(upstream.status).json({
      owner: OWNER,
      error: "DuckDuckGo returned non-200.",
      status: upstream.status,
    });
  }

  const html = await upstream.text();
  const results = parseResults(html).slice(0, limit);

  return res.status(200).json({
    owner: OWNER,
    success: true,
    query: q,
    count: results.length,
    results,
  });
}
