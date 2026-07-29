import { createHash } from "node:crypto";

import type {
  IntelligenceBriefing,
  IntelligenceBriefingItem,
  IntelligenceIngestionResult,
  IntelligenceSourceDefinition,
  IntelligenceSourceFailureReason,
  IntelligenceSourceStatus,
} from "@/lib/intelligence/contracts";
import { officialIntelligenceSources } from "@/lib/intelligence/official-sources";

const feedTimeoutMs = 6_000;
const maximumFeedBytes = 2_000_000;
const maximumItemsPerSource = 8;
const maximumBriefingItems = 24;
const trackingParameters = new Set(["fbclid", "gclid", "mc_cid", "mc_eid"]);
const sourcePriorities = new Map(
  officialIntelligenceSources.map(({ id, priority }) => [id, priority]),
);

type ParsedFeedItem = Readonly<{
  publishedAt: string | null;
  title: string;
  url: string;
}>;

type ReadySourceRun = Readonly<{
  items: readonly IntelligenceBriefingItem[];
  source: IntelligenceSourceDefinition;
  status: IntelligenceSourceStatus;
}>;

type FailedSourceRun = Readonly<{
  items: readonly [];
  source: IntelligenceSourceDefinition;
  status: IntelligenceSourceStatus;
}>;

type SourceRun = FailedSourceRun | ReadySourceRun;

class IntelligenceFeedError extends Error {
  readonly reason: IntelligenceSourceFailureReason;

  constructor(reason: IntelligenceSourceFailureReason) {
    super(reason);
    this.name = "IntelligenceFeedError";
    this.reason = reason;
  }
}

function decodeXmlEntities(value: string) {
  const withoutCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/giu, "$1");

  return withoutCdata.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/giu,
    (entity, encoded: string) => {
      const normalized = encoded.toLowerCase();

      switch (normalized) {
        case "amp":
          return "&";
        case "apos":
          return "'";
        case "gt":
          return ">";
        case "lt":
          return "<";
        case "quot":
          return '"';
        default: {
          const radix = normalized.startsWith("#x") ? 16 : 10;
          const digits = normalized.slice(radix === 16 ? 2 : 1);
          const codePoint = Number.parseInt(digits, radix);

          if (!Number.isInteger(codePoint) || codePoint > 0x10ffff) {
            return entity;
          }

          return String.fromCodePoint(codePoint);
        }
      }
    },
  );
}

function normalizeText(value: string) {
  return decodeXmlEntities(value)
    .replace(/<[^>]*>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractElementValue(block: string, names: readonly string[]) {
  for (const name of names) {
    const escapedName = escapeRegularExpression(name);
    const match = new RegExp(
      `<${escapedName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedName}\\s*>`,
      "iu",
    ).exec(block);

    if (match?.[1] !== undefined) {
      return normalizeText(match[1]);
    }
  }

  return null;
}

function extractAttribute(element: string, attribute: string) {
  const escapedAttribute = escapeRegularExpression(attribute);
  const match = new RegExp(
    `\\b${escapedAttribute}\\s*=\\s*(["'])(.*?)\\1`,
    "iu",
  ).exec(element);
  return match?.[2] === undefined ? null : decodeXmlEntities(match[2]).trim();
}

function extractLink(block: string) {
  const elementValue = extractElementValue(block, ["link"]);

  if (elementValue !== null && elementValue.length > 0) {
    return elementValue;
  }

  const linkElements = block.match(/<link\b[^>]*\/?\s*>/giu) ?? [];
  const alternateLink = linkElements.find((element) => {
    const relation = extractAttribute(element, "rel");
    return relation === null || relation.toLowerCase() === "alternate";
  });
  const href =
    alternateLink === undefined
      ? null
      : extractAttribute(alternateLink, "href");

  if (href !== null && href.length > 0) {
    return href;
  }

  return extractElementValue(block, ["guid", "id"]);
}

function normalizePublicationDate(value: string | null) {
  if (value === null) return null;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function resolveArticleUrl(value: string, feedUrl: string) {
  try {
    const url = new URL(value, feedUrl);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function parseEntryBlock(
  block: string,
  feedUrl: string,
): ParsedFeedItem | null {
  const title = extractElementValue(block, ["title"]);
  const rawUrl = extractLink(block);

  if (title === null || rawUrl === null || title.length === 0) {
    return null;
  }

  const url = resolveArticleUrl(rawUrl, feedUrl);

  if (url === null) return null;

  const publishedAt = normalizePublicationDate(
    extractElementValue(block, ["pubDate", "published", "updated", "dc:date"]),
  );

  return {
    publishedAt,
    title: title.slice(0, 500),
    url: url.slice(0, 2_048),
  };
}

function getEntryBlocks(
  xml: string,
  format: IntelligenceSourceDefinition["feedFormat"],
) {
  const rssBlocks = Array.from(
    xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item\s*>/giu),
    (match) => match[1],
  ).filter((block): block is string => block !== undefined);
  const atomBlocks = Array.from(
    xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry\s*>/giu),
    (match) => match[1],
  ).filter((block): block is string => block !== undefined);

  return format === "rss"
    ? rssBlocks.length > 0
      ? rssBlocks
      : atomBlocks
    : atomBlocks.length > 0
      ? atomBlocks
      : rssBlocks;
}

function parseFeed(
  xml: string,
  source: IntelligenceSourceDefinition,
): readonly ParsedFeedItem[] {
  const blocks = getEntryBlocks(xml, source.feedFormat);
  const items = blocks
    .map((block) => parseEntryBlock(block, source.feedUrl))
    .filter((item): item is ParsedFeedItem => item !== null);

  if (items.length === 0) {
    throw new IntelligenceFeedError("invalid-feed");
  }

  return items;
}

export function canonicalizeIntelligenceUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();

  for (const key of Array.from(url.searchParams.keys())) {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey.startsWith("utm_") ||
      trackingParameters.has(normalizedKey)
    ) {
      url.searchParams.delete(key);
    }
  }

  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/{2,}/gu, "/");

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/u, "");
  }

  return url.toString();
}

function createItemId(canonicalUrl: string) {
  const digest = createHash("sha256")
    .update(canonicalUrl)
    .digest("hex")
    .slice(0, 24);
  return `intelligence-item:${digest}`;
}

function compareItems(
  first: IntelligenceBriefingItem,
  second: IntelligenceBriefingItem,
) {
  const firstTimestamp =
    first.publishedAt === null ? 0 : Date.parse(first.publishedAt);
  const secondTimestamp =
    second.publishedAt === null ? 0 : Date.parse(second.publishedAt);

  return (
    secondTimestamp - firstTimestamp ||
    (sourcePriorities.get(first.sourceId) ?? Number.MAX_SAFE_INTEGER) -
      (sourcePriorities.get(second.sourceId) ?? Number.MAX_SAFE_INTEGER) ||
    first.canonicalUrl.localeCompare(second.canonicalUrl)
  );
}

function normalizeTitleForDeduplication(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function deduplicateIntelligenceItems(
  items: readonly IntelligenceBriefingItem[],
) {
  const canonicalUrls = new Set<string>();
  const normalizedTitles = new Set<string>();
  const uniqueItems: IntelligenceBriefingItem[] = [];

  for (const item of [...items].sort(compareItems)) {
    const normalizedTitle = normalizeTitleForDeduplication(item.title);

    if (
      canonicalUrls.has(item.canonicalUrl) ||
      normalizedTitles.has(normalizedTitle)
    ) {
      continue;
    }

    canonicalUrls.add(item.canonicalUrl);
    normalizedTitles.add(normalizedTitle);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

function toBriefingItem(
  item: ParsedFeedItem,
  source: IntelligenceSourceDefinition,
): IntelligenceBriefingItem {
  const canonicalUrl = canonicalizeIntelligenceUrl(item.url);

  return {
    canonicalUrl,
    id: createItemId(canonicalUrl),
    publishedAt: item.publishedAt,
    sourceId: source.id,
    title: item.title,
    topic: source.topic,
    url: item.url,
  };
}

function getFailureReason(error: unknown, timedOut: boolean) {
  if (timedOut) return "timeout" satisfies IntelligenceSourceFailureReason;

  return error instanceof IntelligenceFeedError
    ? error.reason
    : ("network-error" satisfies IntelligenceSourceFailureReason);
}

async function fetchSource(
  source: IntelligenceSourceDefinition,
  now: Date,
): Promise<SourceRun> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), feedTimeoutMs);
  const fetchedAt = now.toISOString();

  try {
    const response = await fetch(source.feedUrl, {
      cache: "no-store",
      headers: {
        Accept:
          "application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9",
        "User-Agent": "Mission-Control-Intelligence/1.0",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new IntelligenceFeedError("http-error");
    }

    const contentLength = response.headers.get("content-length");

    if (
      contentLength !== null &&
      Number.parseInt(contentLength, 10) > maximumFeedBytes
    ) {
      throw new IntelligenceFeedError("response-too-large");
    }

    const xml = await response.text();

    if (new TextEncoder().encode(xml).byteLength > maximumFeedBytes) {
      throw new IntelligenceFeedError("response-too-large");
    }

    const parsedItems = parseFeed(xml, source);
    const items = deduplicateIntelligenceItems(
      parsedItems.map((item) => toBriefingItem(item, source)),
    )
      .slice(0, maximumItemsPerSource)
      .sort(compareItems);

    return {
      items,
      source,
      status: {
        fetchedAt,
        feedUrl: source.feedUrl,
        id: source.id,
        itemCount: items.length,
        name: source.name,
        status: "ready",
      },
    };
  } catch (error: unknown) {
    return {
      items: [],
      source,
      status: {
        failureReason: getFailureReason(error, controller.signal.aborted),
        fetchedAt,
        feedUrl: source.feedUrl,
        id: source.id,
        itemCount: 0,
        name: source.name,
        status: "failed",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function createBriefing(sourceRuns: readonly SourceRun[], now: Date) {
  const readyRuns = sourceRuns.filter(
    (run): run is ReadySourceRun => run.status.status === "ready",
  );

  if (readyRuns.length === 0) return null;

  const items = deduplicateIntelligenceItems(
    readyRuns.flatMap((run) => run.items),
  )
    .slice(0, maximumBriefingItems)
    .sort(compareItems);
  const generatedAt = now.toISOString();
  const briefingDate = generatedAt.slice(0, 10);

  return {
    briefingDate,
    generatedAt,
    id: `intelligence-briefing:${briefingDate}`,
    items,
    partial: readyRuns.length !== sourceRuns.length,
    sources: sourceRuns.map(({ status }) => status),
  } satisfies IntelligenceBriefing;
}

export async function ingestOfficialIntelligenceFeeds(
  now = new Date(),
): Promise<IntelligenceIngestionResult> {
  const sourceRuns = await Promise.all(
    officialIntelligenceSources.map((source) => fetchSource(source, now)),
  );
  const sources = sourceRuns.map(({ status }) => status);

  return {
    briefing: createBriefing(sourceRuns, now),
    sources,
  };
}
