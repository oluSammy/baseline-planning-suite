import type { MountFn } from "@baseline/contracts";
import { createRoot } from "react-dom/client";
import { App } from "./App";

export const mount: MountFn = (container) => {
  const root = createRoot(container);
  root.render(<App />);

  return () => root.unmount();
};
