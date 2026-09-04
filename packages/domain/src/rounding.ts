// Moves the decimal point `by` places using exponent notation, avoiding multiplication error
function shift(value: number, by: number): number {
  const [mantissa, exponent = "0"] = value.toString().split("e");
  return Number(`${mantissa}e${Number(exponent) + by}`);
}

// Rounds half up to `dp` decimals. `roundTo(1.005, 2)` is `1.01`
export function roundTo(value: number, dp: number): number {
  if (!Number.isFinite(value)) return value;
  return shift(Math.round(shift(value, dp)), -dp);
}

// rounds each value to `dp` decimals so that the rounded values sum
//exactly to the rounded sum of the exact values
// The 1e-9 and Number.EPSILON nudges exist because 0.575 * 100 is 57.49999… in floating point. Without them, a value that should floor to 57 floors to 57 anyway but one that should floor to 58 may not. Ties break
// by position
export function largestRemainder(values: readonly number[], dp: number): number[] {
  const exactTotal = values.reduce((acc, v) => acc + v, 0);
  const target = Math.round(shift(exactTotal, dp));

  const scaled = values.map((v) => shift(v, dp));
  const floors = scaled.map((v) => Math.floor(v + 1e-9));
  let deficit = target - floors.reduce((acc, v) => acc + v, 0);

  const order = scaled
    .map((v, index) => ({ index, remainder: v - Math.floor(v + 1e-9) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const { index } of order) {
    if (deficit <= 0) break;
    floors[index] = (floors[index] ?? 0) + 1;
    deficit -= 1;
  }

  return floors.map((v) => shift(v, -dp));
}
