import { describe, expect, it } from "vitest";
import { largestRemainder, roundTo } from "../rounding";

describe("roundTo", () => {
  it("rounds to the requested decimals", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(89.54545, 4)).toBe(89.5455);
  });
});

describe("largestRemainder", () => {
  it("makes rounded cells add up to the rounded total", () => {
    expect(largestRemainder([0.125, 0.125], 2)).toEqual([0.13, 0.12]);
    expect(largestRemainder([1 / 3, 1 / 3, 1 / 3], 2)).toEqual([0.34, 0.33, 0.33]);
  });

  it("leaves already-exact values alone and handles empty input", () => {
    expect(largestRemainder([0.5, 0.25, 0.25], 2)).toEqual([0.5, 0.25, 0.25]);
    expect(largestRemainder([], 2)).toEqual([]);
  });

  it("always sums to the rounded total", () => {
    const values = [0.575, 0.575, 0.575, 0.275];
    const rounded = largestRemainder(values, 2);
    const total = roundTo(
      values.reduce((a, b) => a + b, 0),
      2,
    );
    expect(
      roundTo(
        rounded.reduce((a, b) => a + b, 0),
        2,
      ),
    ).toBe(total);
  });
});
