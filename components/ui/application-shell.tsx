import type { ReactNode } from "react";

type ApplicationShellProps = Readonly<{
  children: ReactNode;
}>;

export function ApplicationShell({ children }: ApplicationShellProps) {
  return <main className="dashboard-root">{children}</main>;
}
