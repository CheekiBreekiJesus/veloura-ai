/**
 * Affiliate URL builder module.
 *
 * Reads affiliate IDs from environment variables and builds tracked URLs
 * per retailer and country. All tracking parameters are appended server-side —
 * never exposed to the client.
 *
 * Required environment variables (set as secrets; empty values are safe until IDs are issued):
 *   AMAZON_AFFILIATE_TAG        — Amazon Associates tracking tag (e.g. "veloura-20")
 *   SEPHORA_AFFILIATE_ID        — Sephora affiliate ID via Rakuten/CJ network
 *   AWIN_PUBLISHER_ID           — AWIN publisher ID (covers H&M, ASOS, Zara, LookFantastic)
 *   LOOKFANTASTIC_AFFILIATE_ID  — LookFantastic affiliate ID (via AWIN or direct)
 *   CJ_PUBLISHER_ID             — Commission Junction publisher ID (Nordstrom, Revolve, etc.)
 *   ULTA_AFFILIATE_ID           — Ulta affiliate ID via Impact/CJ
 */

const AMAZON_AFFILIATE_TAG = process.env["AMAZON_AFFILIATE_TAG"] ?? "";
const SEPHORA_AFFILIATE_ID = process.env["SEPHORA_AFFILIATE_ID"] ?? "";
const AWIN_PUBLISHER_ID = process.env["AWIN_PUBLISHER_ID"] ?? "";
const LOOKFANTASTIC_AFFILIATE_ID = process.env["LOOKFANTASTIC_AFFILIATE_ID"] ?? "";
const CJ_PUBLISHER_ID = process.env["CJ_PUBLISHER_ID"] ?? "";

export type AffiliateEntry = { url: string; retailer: string };
export type AffiliateUrls = Record<string, AffiliateEntry>;

function kw(s: string): string {
  return encodeURIComponent(s.trim());
}

function appendTag(url: string, param: string, value: string): string {
  if (!value) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${param}=${encodeURIComponent(value)}`;
}

export function buildAmazonUrl(keyword: string, country: "US" | "GB" | "AU" | "CA" | "FR" | "DE"): AffiliateEntry {
  const k = kw(keyword);
  const domains: Record<string, string> = {
    US: "www.amazon.com",
    GB: "www.amazon.co.uk",
    AU: "www.amazon.com.au",
    CA: "www.amazon.ca",
    FR: "www.amazon.fr",
    DE: "www.amazon.de",
  };
  const domain = domains[country] ?? "www.amazon.com";
  let url = `https://${domain}/s?k=${k}`;
  url = appendTag(url, "tag", AMAZON_AFFILIATE_TAG);
  return { url, retailer: "Amazon" };
}

export function buildSephoraUrl(keyword: string, country: "US" | "GB" | "AU" | "CA" | "FR" | "DE"): AffiliateEntry {
  const k = kw(keyword);
  let url: string;
  let retailer: string;
  if (country === "US") {
    url = `https://www.sephora.com/search?keyword=${k}`;
    retailer = "Sephora";
  } else if (country === "GB") {
    url = `https://www.sephora.co.uk/search?q=${k}`;
    retailer = "Sephora";
  } else if (country === "AU") {
    url = `https://www.mecca.com.au/search?q=${k}`;
    retailer = "Mecca";
  } else if (country === "CA") {
    url = `https://www.sephora.ca/en/search?keyword=${k}`;
    retailer = "Sephora";
  } else if (country === "FR") {
    url = `https://www.sephora.fr/search?keyword=${k}`;
    retailer = "Sephora";
  } else {
    url = `https://www.douglas.de/search?searchTerm=${k}`;
    retailer = "Douglas";
  }
  if (SEPHORA_AFFILIATE_ID && (country === "US" || country === "CA")) {
    url = appendTag(url, "publisher_id", SEPHORA_AFFILIATE_ID);
  }
  return { url, retailer };
}

export function buildZaraUrl(keyword: string, country: "US" | "GB" | "AU" | "CA" | "FR" | "DE"): AffiliateEntry {
  const k = kw(keyword);
  const locales: Record<string, string> = {
    US: "https://www.zara.com/us/en/search",
    GB: "https://www.zara.com/gb/en/search",
    AU: "https://www.zara.com/au/en/search",
    CA: "https://www.zara.com/ca/en/search",
    FR: "https://www.zara.com/fr/fr/search",
    DE: "https://www.zara.com/de/de/search",
  };
  let url = `${locales[country] ?? locales.GB}?searchTerm=${k}`;
  if (AWIN_PUBLISHER_ID) {
    url = appendTag(url, "awinaffid", AWIN_PUBLISHER_ID);
  }
  return { url, retailer: "Zara" };
}

export function buildHmUrl(keyword: string, country: "US" | "GB" | "AU" | "CA" | "FR" | "DE"): AffiliateEntry {
  const k = kw(keyword);
  const locales: Record<string, string> = {
    US: "https://www2.hm.com/en_us/search-results.html",
    GB: "https://www2.hm.com/en_gb/search-results.html",
    AU: "https://www2.hm.com/en_au/search-results.html",
    CA: "https://www2.hm.com/en_ca/search-results.html",
    FR: "https://www2.hm.com/fr_fr/search-results.html",
    DE: "https://www2.hm.com/de_de/search-results.html",
  };
  let url = `${locales[country] ?? locales.GB}?q=${k}`;
  if (AWIN_PUBLISHER_ID) {
    url = appendTag(url, "awinaffid", AWIN_PUBLISHER_ID);
  }
  return { url, retailer: "H&M" };
}

export function buildAsosUrl(keyword: string, country: "US" | "GB" | "AU" | "CA" | "FR" | "DE"): AffiliateEntry {
  const k = kw(keyword);
  const bases: Record<string, string> = {
    US: "https://www.asos.com/search/",
    GB: "https://www.asos.com/search/",
    AU: "https://www.asos.com/search/",
    CA: "https://www.asos.com/search/",
    FR: "https://www.asos.com/fr/search/",
    DE: "https://www.asos.com/de/search/",
  };
  let url = `${bases[country] ?? bases.GB}?q=${k}`;
  if (AWIN_PUBLISHER_ID) {
    url = appendTag(url, "awinaffid", AWIN_PUBLISHER_ID);
  }
  return { url, retailer: "ASOS" };
}

export function buildLookFantasticUrl(keyword: string): AffiliateEntry {
  const k = kw(keyword);
  let url = `https://www.lookfantastic.com/search?q=${k}`;
  const id = LOOKFANTASTIC_AFFILIATE_ID || AWIN_PUBLISHER_ID;
  if (id) {
    url = appendTag(url, "awinaffid", id);
  }
  return { url, retailer: "LookFantastic" };
}

export function buildUltaUrl(keyword: string): AffiliateEntry {
  const k = kw(keyword);
  let url = `https://www.ulta.com/search?search=${k}`;
  if (CJ_PUBLISHER_ID) {
    url = appendTag(url, "publisher_id", CJ_PUBLISHER_ID);
  }
  return { url, retailer: "Ulta" };
}

export function buildNordstromUrl(keyword: string, country: "US" | "GB" | "AU" | "CA" | "FR" | "DE"): AffiliateEntry {
  const k = kw(keyword);
  if (country === "US" || country === "CA") {
    let url = `https://www.nordstrom.com/sr?keyword=${k}`;
    if (CJ_PUBLISHER_ID) url = appendTag(url, "publisher_id", CJ_PUBLISHER_ID);
    return { url, retailer: "Nordstrom" };
  }
  return { url: `https://www.net-a-porter.com/search?q=${k}`, retailer: "Net-a-Porter" };
}

const COUNTRIES = ["US", "GB", "AU", "CA", "FR", "DE"] as const;
type Country = typeof COUNTRIES[number];

type RetailerName = "Amazon" | "Sephora" | "Zara" | "H&M" | "ASOS" | "LookFantastic" | "Ulta" | "Nordstrom";

export function buildAffiliateUrls(keyword: string, retailer: RetailerName): AffiliateUrls {
  const result: AffiliateUrls = {};
  for (const country of COUNTRIES) {
    let entry: AffiliateEntry;
    switch (retailer) {
      case "Amazon":
        entry = buildAmazonUrl(keyword, country as Country);
        break;
      case "Sephora":
        entry = buildSephoraUrl(keyword, country as Country);
        break;
      case "Zara":
        entry = buildZaraUrl(keyword, country as Country);
        break;
      case "H&M":
        entry = buildHmUrl(keyword, country as Country);
        break;
      case "ASOS":
        entry = buildAsosUrl(keyword, country as Country);
        break;
      case "LookFantastic":
        entry = buildLookFantasticUrl(keyword);
        break;
      case "Ulta":
        entry = buildUltaUrl(keyword);
        break;
      case "Nordstrom":
        entry = buildNordstromUrl(keyword, country as Country);
        break;
      default:
        entry = buildAmazonUrl(keyword, country as Country);
    }
    result[country] = entry;
  }
  return result;
}
