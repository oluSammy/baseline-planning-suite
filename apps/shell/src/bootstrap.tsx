import { registerRemotes } from "@module-federation/enhanced/runtime";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadShellConfig } from "./config";

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Shell: #root element not found");
  }

  const config = await loadShellConfig();

  registerRemotes(Object.entries(config.remotes).map(([name, entry]) => ({ name, entry })));

  createRoot(container).render(<App />);
}

void start();
