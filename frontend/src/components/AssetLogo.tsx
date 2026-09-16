import { useState } from "react";
import "./asset-logo.css";

const stockMarks: Record<string, [string, string]> = {
  NVDA: ["nvidia", "NVIDIA"],
  AAPL: ["apple", "Apple"],
  MSFT: ["microsoft", "Microsoft"],
  GOOGL: ["alphabet", "Google (Alphabet)"],
  AMZN: ["amazon", "Amazon"],
  TSLA: ["tesla", "Tesla"],
  SPY: ["state-street", "State Street SPDR"],
  GLD: ["state-street", "State Street SPDR"],
  XLV: ["state-street", "State Street SPDR"],
  SLV: ["ishares", "iShares"],
  IWM: ["ishares", "iShares"],
  QQQ: ["invesco", "Invesco"],
  JPM: ["jpmorgan", "JPMorgan Chase"],
  V: ["visa", "Visa"],
  XOM: ["exxon", "ExxonMobil"],
};
// Never identify an onchain asset by ticker alone. Unknown contracts get a neutral image.
const arcMarks: Record<string, Record<string, string>> = {
  mainnet: {
    "0x3600000000000000000000000000000000000000": "usdc",
    "0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1": "eurc",
    "0x8a5d989bbb96929f689b0200f435f53da42bf490": "usyc",
  },
  testnet: {
    "0x3600000000000000000000000000000000000000": "usdc",
    "0x89b50855aa3be2f677cd6303cec089b5f319d72a": "eurc",
    "0xe9185f0c5f296ed1797aae4238d26ccabeadb86c": "usyc",
  },
};
export default function AssetLogo({
  symbol,
  network,
  address,
}: {
  symbol?: string;
  network?: string;
  address?: string;
}) {
  const mark = address
    ? arcMarks[network || ""]?.[address.toLowerCase()]
    : stockMarks[symbol || ""]?.[0];
  const name = address ? mark?.toUpperCase() : stockMarks[symbol || ""]?.[1];
  const src = mark ? `/asset-logos/${mark}.png` : "/asset-logos/unverified.svg";
  const [failed, setFailed] = useState("");
  const available = !!mark && failed !== src;
  return (
    <img
      className={`asset-logo${available && ["usdc", "eurc", "usyc"].includes(mark) ? " asset-logo-wordmark" : ""}`}
      src={available ? src : "/asset-logos/unverified.svg"}
      alt={available ? `${name} logo` : "Official logo unavailable"}
      title={available ? `${name} · official company or issuer mark` : "No verified issuer logo"}
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(src)}
    />
  );
}
