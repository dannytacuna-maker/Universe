import type { IntelligenceSourceDefinition } from "@/lib/intelligence/contracts";

export const officialIntelligenceSources = [
  {
    feedFormat: "rss",
    feedUrl: "https://www.ecb.europa.eu/rss/press.html",
    homepageUrl: "https://www.ecb.europa.eu/press/html/index.en.html",
    id: "ecb-policy-and-media",
    institution: "ecb",
    name: "European Central Bank",
    priority: 10,
    topic: "monetary-policy",
  },
  {
    feedFormat: "rss",
    feedUrl: "https://www.ecb.europa.eu/rss/statpress.html",
    homepageUrl: "https://www.ecb.europa.eu/press/stats/html/index.en.html",
    id: "ecb-statistical-releases",
    institution: "ecb",
    name: "ECB Statistical Releases",
    priority: 20,
    topic: "euro-area-economy",
  },
  {
    feedFormat: "atom",
    feedUrl:
      "https://ec.europa.eu/eurostat/en/search?_estatsearchportlet_WAR_estatsearchportlet_collection=CAT_PREREL&_estatsearchportlet_WAR_estatsearchportlet_theme=PER_ECOFIN&p_p_id=estatsearchportlet_WAR_estatsearchportlet&p_p_lifecycle=2&p_p_mode=view&p_p_resource_id=atom&p_p_state=maximized",
    homepageUrl: "https://ec.europa.eu/eurostat/news/euro-indicators",
    id: "eurostat-economy-and-finance",
    institution: "eurostat",
    name: "Eurostat Economy and Finance",
    priority: 30,
    topic: "euro-area-economy",
  },
  {
    feedFormat: "atom",
    feedUrl:
      "https://ec.europa.eu/eurostat/en/search?_estatsearchportlet_WAR_estatsearchportlet_collection=CAT_PREREL&_estatsearchportlet_WAR_estatsearchportlet_theme=PER_EXTTRA&p_p_id=estatsearchportlet_WAR_estatsearchportlet&p_p_lifecycle=2&p_p_mode=view&p_p_resource_id=atom&p_p_state=maximized",
    homepageUrl:
      "https://ec.europa.eu/eurostat/web/international-trade-in-goods",
    id: "eurostat-international-trade",
    institution: "eurostat",
    name: "Eurostat International Trade",
    priority: 40,
    topic: "international-trade",
  },
  {
    feedFormat: "rss",
    feedUrl: "https://www.federalreserve.gov/feeds/press_monetary.xml",
    homepageUrl: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
    id: "federal-reserve-monetary-policy",
    institution: "federal-reserve",
    name: "Federal Reserve Monetary Policy",
    priority: 50,
    topic: "monetary-policy",
  },
] as const satisfies readonly IntelligenceSourceDefinition[];
