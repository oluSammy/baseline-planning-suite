import type { MountContext, MountModule, RemoteName } from "@baseline/contracts";
import { loadRemote, registerRemotes } from "@module-federation/enhanced/runtime";
import { useEffect, useRef, useState } from "react";

type PanelStatus =
  | { readonly kind: "loading" }
  | { readonly kind: "ready" }
  | { readonly kind: "failed"; readonly message: string };

interface RemotePanelProps {
  readonly name: RemoteName;
  /** The remoteEntry URL this remote was registered with, needed to re-register on retry. */
  readonly entry: string;
  readonly context: MountContext;
}

export function RemotePanel({ name, entry, context }: RemotePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<PanelStatus>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A fresh host element per attempt, so a retry never mounts into
    // DOM that a previous React root is still tearing down.
    const host = document.createElement("div");
    container.replaceChildren(host);

    let cancelled = false;
    let unmount: (() => void) | undefined;
    setStatus({ kind: "loading" });

    // The federation runtime memoises a failed remote entry. A retry must
    // re-register the remote to clear that cache, or it would fail again
    // without a single network request.
    if (attempt > 0) {
      registerRemotes([{ name, entry }], { force: true });
    }

    loadRemote<MountModule>(`${name}/mount`)
      .then((module) => {
        if (cancelled) return;
        if (!module) throw new Error(`${name}/mount resolved to nothing`);
        unmount = module.mount(host, context);
        setStatus({ kind: "ready" });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setStatus({ kind: "failed", message });
      });

    return () => {
      cancelled = true;
      // Defer: React refuses to unmount another root synchronously
      // while it is committing this one.
      setTimeout(() => unmount?.(), 0);
    };
  }, [name, entry, context, attempt]);

  const label = name === "people" ? "People" : "Delivery";

  return (
    <section aria-label={`${label} remote`}>
      {status.kind === "loading" && <p className="shell-panel-loading">Loading {label}…</p>}
      {status.kind === "failed" && (
        <div className="shell-panel-failed" role="alert">
          <h2>{label} is unavailable</h2>
          <p>
            The remote could not be loaded. The rest of Baseline keeps working. You can switch apps
            in the header, and your data is safe.
          </p>
          <pre>{status.message}</pre>
          <button type="button" className="btn-primary" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </button>
        </div>
      )}
      <div ref={containerRef} />
    </section>
  );
}
