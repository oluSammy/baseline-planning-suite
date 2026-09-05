import { findRateConflict, hourlyCost, isoDate, type RateRecord } from "@baseline/domain";
import { useState } from "react";

export interface RateFormValue {
  readonly validFrom: ReturnType<typeof isoDate>;
  readonly hourlyCost: ReturnType<typeof hourlyCost>;
}

interface RateFormProps {
  readonly initial?: { readonly validFrom: string; readonly hourlyCost: number };
  readonly employeeRecords: readonly RateRecord[];
  readonly excludeId: RateRecord["id"] | null;
  readonly submitLabel: string;
  readonly onSubmit: (value: RateFormValue) => void;
  readonly onCancel?: () => void;
}

export function RateForm({
  initial,
  employeeRecords,
  excludeId,
  submitLabel,
  onSubmit,
  onCancel,
}: RateFormProps) {
  const [validFrom, setValidFrom] = useState(initial?.validFrom ?? "");
  const [cost, setCost] = useState(initial ? String(initial.hourlyCost) : "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const value: RateFormValue = {
        validFrom: isoDate(validFrom),
        hourlyCost: hourlyCost(Number(cost)),
      };
      const employeeId = employeeRecords[0]?.employeeId;
      if (employeeId && findRateConflict(employeeRecords, employeeId, value.validFrom, excludeId)) {
        setError(`A rate already starts on ${validFrom}.`);
        return;
      }
      setError(null);
      onSubmit(value);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid input");
    }
  };

  return (
    <form className="people-form" onSubmit={handleSubmit}>
      Valid from
      <input
        className="field people-form-date"
        type="date"
        aria-label="Valid from"
        value={validFrom}
        onChange={(e) => setValidFrom(e.target.value)}
        required
      />
      <input
        className="field people-form-cost num"
        type="number"
        aria-label="Euros per hour"
        min="0.01"
        step="0.01"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        required
      />
      <span className="people-form-hint">€ per hour</span>
      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className="error-line people-form-error">
          {error}
        </p>
      )}
    </form>
  );
}
