import type {
  IntelligenceBriefing as OfficialIntelligenceBriefing,
  IntelligenceTopic,
} from "@/lib/intelligence/contracts";
import type {
  EconomicPulseDirection,
  IntelligenceBriefingCategory,
  IntelligenceSource,
  WeeklyIntelligenceBriefing,
} from "@/lib/intelligence/weekly-briefing";

import type { IntelligenceBriefingDashboardState } from "./intelligence-briefing";
import styles from "./intelligence-briefing-dashboard.module.css";

const MAX_BRIEFING_ITEMS = 8;
const MAX_PULSE_OBSERVATIONS = 6;

const categoryLabels: Readonly<Record<IntelligenceBriefingCategory, string>> = {
  "business-and-industry": "Business & industry",
  "economic-indicator": "Economic indicator",
  "global-economy": "Global economy",
  geopolitics: "Geopolitics",
  "international-trade": "International trade",
  "spain-and-eu": "Spain & European Union",
  "technology-and-ai": "Technology & AI",
};

const directionLabels: Readonly<Record<EconomicPulseDirection, string>> = {
  down: "Decreasing",
  stable: "Stable",
  up: "Increasing",
};

const topicLabels: Readonly<Record<IntelligenceTopic, string>> = {
  "business-and-industry": "Business & industry",
  geopolitics: "World affairs",
  "global-economy": "Global economy",
  "international-trade": "International trade",
  "monetary-policy": "Monetary policy",
  "spain-and-eu": "Spain & European Union",
  "technology-and-ai": "Technology & AI",
};

export type IntelligenceBriefingDashboardProps = Readonly<{
  headingId?: string;
  state: IntelligenceBriefingDashboardState;
}>;

function SourceLink({ source }: Readonly<{ source: IntelligenceSource }>) {
  return (
    <a href={source.url} rel="noreferrer" target="_blank">
      <span>{source.name}</span>
      <small>{source.kind}</small>
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function BriefingHeader({
  edition,
  headingId,
}: Readonly<{
  edition: Readonly<{
    editionDateIso: string;
    editionDateLabel: string;
    generatedAtIso: string;
    generatedAtLabel: string;
  }> | null;
  headingId: string;
}>) {
  return (
    <header className={styles.header}>
      <div>
        <span className={styles.eyebrow}>Global intelligence station</span>
        <h1 id={headingId}>The Observatory</h1>
        <p>
          A concise daily view of the world developments most worth
          understanding.
        </p>
      </div>
      {edition === null ? null : (
        <div className={styles.edition}>
          <span>Daily brief</span>
          <time dateTime={edition.editionDateIso}>
            {edition.editionDateLabel}
          </time>
          <small>
            Compiled{" "}
            <time dateTime={edition.generatedAtIso}>
              {edition.generatedAtLabel}
            </time>
          </small>
        </div>
      )}
    </header>
  );
}

function ReadyBriefing({
  briefing,
}: Readonly<{ briefing: WeeklyIntelligenceBriefing }>) {
  const items = briefing.items.slice(0, MAX_BRIEFING_ITEMS);
  const pulse = briefing.economicPulse.slice(0, MAX_PULSE_OBSERVATIONS);

  return (
    <div className={styles.content}>
      <section
        aria-labelledby="observatory-brief-overview"
        className={styles.overview}
      >
        <span>Situation overview</span>
        <h2 id="observatory-brief-overview">{briefing.title}</h2>
        <p>{briefing.overview}</p>
      </section>

      {pulse.length === 0 ? null : (
        <section
          aria-labelledby="observatory-economic-pulse"
          className={styles.pulseSection}
        >
          <div className={styles.sectionHeading}>
            <div>
              <span>Economic pulse</span>
              <h2 id="observatory-economic-pulse">
                Signals, not a trading terminal
              </h2>
            </div>
            <small>{pulse.length} current observations</small>
          </div>
          <ul className={styles.pulseGrid}>
            {pulse.map((observation) => (
              <li key={observation.id}>
                <div className={styles.pulseTopline}>
                  <span>{observation.label}</span>
                  <span
                    className={styles.direction}
                    data-direction={observation.direction}
                  >
                    <span className={styles.visuallyHidden}>
                      {directionLabels[observation.direction]}
                    </span>
                    <span aria-hidden="true">
                      {observation.direction === "up"
                        ? "↑"
                        : observation.direction === "down"
                          ? "↓"
                          : "→"}
                    </span>
                  </span>
                </div>
                <strong>{observation.value}</strong>
                <p>{observation.interpretation}</p>
                <div className={styles.observationSource}>
                  <time dateTime={observation.observedAtIso}>
                    {observation.observedAtLabel}
                  </time>
                  <SourceLink source={observation.source} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="observatory-daily-intelligence"
        className={styles.briefSection}
      >
        <div className={styles.sectionHeading}>
          <div>
            <span>Daily intelligence</span>
            <h2 id="observatory-daily-intelligence">
              What changed and why it matters
            </h2>
          </div>
          <small>{items.length} developments</small>
        </div>
        <ol className={styles.briefList}>
          {items.map((item, index) => (
            <li key={item.id}>
              <article>
                <div className={styles.itemIndex} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemMeta}>
                    <span>{categoryLabels[item.category]}</span>
                    <time dateTime={item.publishedAtIso}>
                      {item.publishedAtLabel}
                    </time>
                  </div>
                  <h3>{item.headline}</h3>
                  <p className={styles.summary}>{item.summary}</p>
                  <dl>
                    <div>
                      <dt>Why it matters</dt>
                      <dd>{item.whyItMatters}</dd>
                    </div>
                    <div>
                      <dt>Business relevance</dt>
                      <dd>{item.businessRelevance}</dd>
                    </div>
                    {item.uncertainty === null ? null : (
                      <div>
                        <dt>Still uncertain</dt>
                        <dd>{item.uncertainty}</dd>
                      </div>
                    )}
                  </dl>
                  <div className={styles.sources}>
                    <span>Sources</span>
                    <ul>
                      {item.sources.map((source) => (
                        <li key={`${item.id}:${source.url}`}>
                          <SourceLink source={source} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function publicationLabel(publishedAt: string | null) {
  if (publishedAt === null) return "Publication time unavailable";

  const compactTimestamp = publishedAt.replace("T", " ").slice(0, 16);

  return publishedAt.endsWith("Z")
    ? `${compactTimestamp} UTC`
    : compactTimestamp;
}

function SourceFeedBriefing({
  briefing,
}: Readonly<{ briefing: OfficialIntelligenceBriefing }>) {
  const items = briefing.items.slice(0, MAX_BRIEFING_ITEMS);
  const sourceNames = new Map(
    briefing.sources.map((source) => [source.id, source.name]),
  );

  return (
    <div className={styles.content}>
      <section
        aria-labelledby="observatory-source-feed"
        className={styles.overview}
      >
        <span>Source watch</span>
        <h2 id="observatory-source-feed">
          Verified developments awaiting analysis
        </h2>
        <p>
          These headlines arrive directly from monitored publishers and public
          institutions. They remain available when the daily analysis layer is
          temporarily unavailable.
        </p>
      </section>

      {briefing.partial ? (
        <p className={styles.partialNotice} role="status">
          This edition is partial because one or more monitored feeds could not
          be reached. Available sources remain visible below.
        </p>
      ) : null}

      <section
        aria-labelledby="observatory-source-status"
        className={styles.sourceStatusSection}
      >
        <div className={styles.sectionHeading}>
          <div>
            <span>Source status</span>
            <h2 id="observatory-source-status">Monitored feeds</h2>
          </div>
          <small>{briefing.sources.length} monitored sources</small>
        </div>
        <ul className={styles.sourceStatusList}>
          {briefing.sources.map((source) => (
            <li key={source.id}>
              <span data-status={source.status} aria-hidden="true" />
              <div>
                <strong>{source.name}</strong>
                <small>
                  {source.status === "ready"
                    ? `${source.itemCount} recent items`
                    : "Feed temporarily unavailable"}
                </small>
              </div>
              <a href={source.feedUrl} rel="noreferrer" target="_blank">
                Feed <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="observatory-source-developments"
        className={styles.briefSection}
      >
        <div className={styles.sectionHeading}>
          <div>
            <span>Latest signals</span>
            <h2 id="observatory-source-developments">
              Developments from monitored sources
            </h2>
          </div>
          <small>{items.length} developments</small>
        </div>
        <ol className={styles.rawFeedList}>
          {items.map((item, index) => (
            <li key={item.id}>
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <article>
                <div>
                  <span>{topicLabels[item.topic]}</span>
                  <time dateTime={item.publishedAt ?? undefined}>
                    {publicationLabel(item.publishedAt)}
                  </time>
                </div>
                <h3>{item.title}</h3>
                <p>{sourceNames.get(item.sourceId) ?? item.sourceId}</p>
                <a href={item.url} rel="noreferrer" target="_blank">
                  Read at source <span aria-hidden="true">↗</span>
                </a>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function IntelligenceBriefingDashboard({
  headingId = "observatory-title",
  state,
}: IntelligenceBriefingDashboardProps) {
  const edition =
    state.status === "ready" && state.briefing !== null
      ? {
          editionDateIso: state.briefing.editionDateIso,
          editionDateLabel: state.briefing.editionDateLabel,
          generatedAtIso: state.briefing.generatedAtIso,
          generatedAtLabel: state.briefing.generatedAtLabel,
        }
      : state.status === "source-ready" && state.briefing !== null
        ? {
            editionDateIso: state.briefing.briefingDate,
            editionDateLabel: state.briefing.briefingDate,
            generatedAtIso: state.briefing.generatedAt,
            generatedAtLabel: publicationLabel(state.briefing.generatedAt),
          }
        : null;

  return (
    <section
      aria-busy={state.status === "loading"}
      aria-labelledby={headingId}
      className={styles.dashboard}
    >
      <BriefingHeader edition={edition} headingId={headingId} />

      {state.status === "loading" ? (
        <div className={styles.state} role="status">
          <span className={styles.stateMark} aria-hidden="true" />
          <strong>Receiving today’s intelligence</strong>
          <p>The Observatory is assembling a finite, source-grounded brief.</p>
        </div>
      ) : state.status === "error" ? (
        <div className={styles.state} role="alert">
          <span className={styles.errorMark} aria-hidden="true" />
          <strong>The daily brief is unavailable</strong>
          <p>{state.message}</p>
        </div>
      ) : state.briefing === null || state.briefing.items.length === 0 ? (
        <div className={styles.state}>
          <span className={styles.stateMark} aria-hidden="true" />
          <strong>No briefing has been published</strong>
          <p>
            The Observatory will remain quiet until verified developments
            arrive.
          </p>
        </div>
      ) : state.status === "source-ready" ? (
        <SourceFeedBriefing briefing={state.briefing} />
      ) : (
        <ReadyBriefing briefing={state.briefing} />
      )}
    </section>
  );
}
