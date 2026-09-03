import type { MountModule, RemoteName } from "@baseline/contracts";
import { loadRemote } from "@module-federation/enhanced/runtime";
import { useEffect, useRef, useState } from "react";

type PanelStatus =
  | { readonly kind: "loading" }
  | { readonly kind: "ready" }
  | { readonly kind: "failed"; readonly message: string };

interface RemotePanelProps {
  readonly name: RemoteName;
}

export function RemotePanel({ name }: RemotePanelProps) {
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

    loadRemote<MountModule>(`${name}/mount`)
      .then((module) => {
        if (cancelled) return;
        if (!module) throw new Error(`${name}/mount resolved to nothing`);
        unmount = module.mount(host);
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
  }, [name, attempt]);

  return (
    <section aria-label={`${name} remote`}>
      {status.kind === "loading" && <p>Loading {name}…</p>}
      {status.kind === "failed" && (
        <div role="alert">
          <h2>{name} is unavailable</h2>
          <p>The remote could not be loaded. The rest of Baseline keeps working.</p>
          <pre>{status.message}</pre>
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </button>
        </div>
      )}
      <div ref={containerRef} />
    </section>
  );
}
