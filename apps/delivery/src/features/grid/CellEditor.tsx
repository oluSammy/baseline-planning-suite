import { useState } from "react";

interface CellEditorProps {
  readonly initial: string;
  readonly onCommit: (text: string) => void;
  readonly onCancel: () => void;
}

// Enter commits, Escape cancels. Nothing is written until Enter.
export function CellEditor({ initial, onCommit, onCancel }: CellEditorProps) {
  const [text, setText] = useState(initial);
  return (
    <input
      autoFocus
      inputMode="decimal"
      aria-label="Cell value"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit(text);
        if (event.key === "Escape") onCancel();
      }}
    />
  );
}
