import type { RemoteName } from "@baseline/contracts";

export interface ShellConfig {
  readonly remotes: Readonly<Record<RemoteName, string>>;
}

const REMOTE_NAMES: readonly RemoteName[] = ["people", "delivery"];

function isShellConfig(value: unknown): value is ShellConfig {
  if (typeof value !== "object" || value === null) return false;
  const remotes = (value as { remotes?: unknown }).remotes;
  if (typeof remotes !== "object" || remotes === null) return false;
  return REMOTE_NAMES.every(
    (name) => typeof (remotes as Record<string, unknown>)[name] === "string",
  );
}

function applyBreakOverride(config: ShellConfig, search: URLSearchParams): ShellConfig {
  const broken = search.get("break");
  if (broken === null || !REMOTE_NAMES.includes(broken as RemoteName)) return config;
  return {
    remotes: { ...config.remotes, [broken]: `/broken/${broken}/remoteEntry.js` },
  };
}

export async function loadShellConfig(): Promise<ShellConfig> {
  const response = await fetch("/config.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`config.json: HTTP ${response.status}`);
  }
  const json: unknown = await response.json();
  if (!isShellConfig(json)) {
    throw new Error("config.json: expected { remotes: { people, delivery } }");
  }
  return applyBreakOverride(json, new URLSearchParams(window.location.search));
}
