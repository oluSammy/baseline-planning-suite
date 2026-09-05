import { useState } from "react";
import { resetToSeed } from "./store";
import { useAppDispatch } from "./store/hooks";

/**
 * Two-step reset, inline like the tree's delete confirmation. No browser dialog:
 * nothing blocks the page, the other remote, or automated checks.
 */
export function ResetToSeed() {
  const dispatch = useAppDispatch();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="delivery-reset" onClick={() => setConfirming(true)}>
        Reset to seed
      </button>
    );
  }

  return (
    <span
      className="delivery-reset-confirm"
      role="alertdialog"
      aria-label="Reset Delivery to seed"
      onKeyDown={(event) => {
        if (event.key === "Escape") setConfirming(false);
      }}
    >
      <span>Discard every edit in Delivery and restore the sample data?</span>
      <button
        type="button"
        className="btn-danger"
        autoFocus
        onClick={() => {
          dispatch(resetToSeed());
          setConfirming(false);
        }}
      >
        Reset
      </button>
      <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </span>
  );
}
