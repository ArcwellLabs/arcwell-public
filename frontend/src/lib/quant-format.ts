export const usd = (v: number, decimals = 0) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  });
// Opaque integer colors avoid browser alpha quantization during SSR hydration.
export function chartShade(positive: boolean, strength: number) {
  const color = positive ? [185, 205, 225] : [175, 145, 115];
  const alpha = Math.max(0, Math.min(0.75, strength));
  return (
    "#" +
    color
      .map((v, i) =>
        Math.round([17, 17, 20][i] * (1 - alpha) + v * alpha)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export const pct = (v: number, decimals = 2) => `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
