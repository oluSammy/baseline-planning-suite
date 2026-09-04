import type { MountContext, RemoteName } from "@baseline/contracts";
import { useEffect, useState } from "react";
import { RemotePanel } from "./RemotePanel";

const ROUTES: ReadonlyArray<{
  readonly path: string;
  readonly remote: RemoteName;
  readonly label: string;
}> = [
  { path: "/people", remote: "people", label: "People" },
  { path: "/delivery", remote: "delivery", label: "Delivery" },
];

function remoteForPath(pathname: string): RemoteName {
  return ROUTES.find((route) => pathname.startsWith(route.path))?.remote ?? "people";
}

interface AppProps {
  readonly contexts: Readonly<Record<RemoteName, MountContext>>;
}

export function App({ contexts }: AppProps) {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, "", path + window.location.search);
    setPathname(path);
  };

  const active = remoteForPath(pathname);

  return (
    <>
      <header>
        <h1>Baseline</h1>
        <nav aria-label="Primary">
          {ROUTES.map((route) => (
            <a
              key={route.path}
              href={route.path}
              aria-current={route.remote === active ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigate(route.path);
              }}
            >
              {route.label}
            </a>
          ))}
        </nav>
      </header>
      <RemotePanel name={active} context={contexts[active]} />
    </>
  );
}
