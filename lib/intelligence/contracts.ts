export type IntelligenceInstitutionId =
  | "bbc"
  | "ecb"
  | "eurostat"
  | "federal-reserve"
  | "guardian"
  | "united-nations";

export type IntelligenceSourceId =
  | "bbc-business"
  | "bbc-technology"
  | "bbc-world"
  | "ecb-policy-and-media"
  | "eurostat-economy-and-finance"
  | "eurostat-international-trade"
  | "federal-reserve-monetary-policy"
  | "guardian-business"
  | "guardian-world"
  | "united-nations-world";

export type IntelligenceTopic =
  | "business-and-industry"
  | "geopolitics"
  | "global-economy"
  | "international-trade"
  | "monetary-policy"
  | "spain-and-eu"
  | "technology-and-ai";

export type IntelligenceFeedFormat = "atom" | "rss";
export type IntelligenceSourceKind = "journalism" | "official" | "research";

export type IntelligenceSourceDefinition = Readonly<{
  feedFormat: IntelligenceFeedFormat;
  feedUrl: string;
  homepageUrl: string;
  id: IntelligenceSourceId;
  institution: IntelligenceInstitutionId;
  kind: IntelligenceSourceKind;
  name: string;
  priority: number;
  topic: IntelligenceTopic;
}>;

export type IntelligenceBriefingItem = Readonly<{
  canonicalUrl: string;
  excerpt: string | null;
  id: string;
  publishedAt: string | null;
  sourceId: IntelligenceSourceId;
  title: string;
  topic: IntelligenceTopic;
  url: string;
}>;

export type IntelligenceSourceFailureReason =
  | "http-error"
  | "invalid-feed"
  | "network-error"
  | "response-too-large"
  | "timeout";

export type IntelligenceSourceStatus = Readonly<{
  failureReason?: IntelligenceSourceFailureReason;
  fetchedAt: string;
  feedUrl: string;
  id: IntelligenceSourceId;
  itemCount: number;
  name: string;
  status: "failed" | "ready";
}>;

export type IntelligenceBriefing = Readonly<{
  briefingDate: string;
  generatedAt: string;
  id: string;
  items: readonly IntelligenceBriefingItem[];
  partial: boolean;
  sources: readonly IntelligenceSourceStatus[];
}>;

export type IntelligenceIngestionResult = Readonly<{
  briefing: IntelligenceBriefing | null;
  sources: readonly IntelligenceSourceStatus[];
}>;
