import { SignInButton, SignOutButton } from "@clerk/nextjs";

import styles from "./mission-auth-gate.module.css";

type MissionAuthGateProps = Readonly<{
  state: "forbidden" | "signed-out";
}>;

export function MissionAuthGate({ state }: MissionAuthGateProps) {
  const isForbidden = state === "forbidden";

  return (
    <section className={styles.gate}>
      <div className={styles.content}>
        <span className={styles.eyebrow}>Daniel&apos;s universe</span>
        <h1>Mission Control</h1>
        <p>
          {isForbidden
            ? "This universe belongs to another Google identity. Sign out and continue with Daniel's approved account."
            : "Continue with your approved Google account to enter your synchronized personal universe."}
        </p>
        {isForbidden ? (
          <SignOutButton>
            <button className={styles.signInButton} type="button">
              Use another Google account
            </button>
          </SignOutButton>
        ) : (
          <SignInButton forceRedirectUrl="/" mode="modal">
            <button className={styles.signInButton} type="button">
              Continue with Google
            </button>
          </SignInButton>
        )}
      </div>
    </section>
  );
}
