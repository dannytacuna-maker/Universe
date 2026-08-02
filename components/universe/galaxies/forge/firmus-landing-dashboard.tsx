"use client";

import styles from "./firmus-landing-dashboard.module.css";

type FirmusLandingDashboardProps = Readonly<{
  isVisible: boolean;
}>;

export function FirmusLandingDashboard({
  isVisible,
}: FirmusLandingDashboardProps) {
  if (!isVisible) return null;

  return (
    <section
      aria-label="Firmus Landing"
      className={`immersive-dashboard ${styles.dashboard}`}
    >
      <div className={styles.panel}>
        <p className={styles.eyebrow}>The Forge · Firmus</p>
        <h1>Landing page</h1>
        <p className={styles.lede}>
          Public site workspace for Firmus — positioning, proof, and the assets
          that ship the first impression.
        </p>

        <dl className={styles.meta}>
          <div>
            <dt>Status</dt>
            <dd>In forge</dd>
          </div>
          <div>
            <dt>Surface</dt>
            <dd>Marketing landing</dd>
          </div>
          <div>
            <dt>Next</dt>
            <dd>Attach live URL, mocks, and ship checklist</dd>
          </div>
        </dl>

        <p className={styles.note}>
          File and link intake for this planet comes next — for now this is the
          spatial home of the Firmus landing page project.
        </p>
      </div>
    </section>
  );
}
