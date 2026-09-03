// contracts between the three Baseline apps. Types and names only

export type RemoteName = "people" | "delivery";

// every remote should expose /mount that follows this shape
export type MountFn = (container: HTMLElement) => () => void;

export interface MountModule {
  readonly mount: MountFn;
}
