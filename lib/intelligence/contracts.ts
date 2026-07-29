export type IntelligenceInstitutionId = "ecb" | "eurostat" | "federal-reserve";

export type IntelligenceSourceId =
  | "ecb-policy-and-media"
  | "ecb-statistical-releases"
  | "eurostat-economy-and-finance"
  | "eurostat-international-trade"
  | "federal-reserve-monetary-policy";

export type IntelligenceTopic =
  "euro-area-economy" | "international-trade" | "monetary-policy";

export type IntelligenceFeedFormat = "atom" | "rss";

export type IntelligenceSourceDefinition = Readonly<{
  feedFormat: IntelligenceFeedFormat;
  feedUrl: string;
  homepageUrl: string;
  id: IntelligenceSourceId;
  institution: IntelligenceInstitutionId;
  name: string;
  priority: number;
  topic: IntelligenceTopic;
}>;

export type IntelligenceBriefingItem = Readonly<{
  canonicalUrl: string;
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
