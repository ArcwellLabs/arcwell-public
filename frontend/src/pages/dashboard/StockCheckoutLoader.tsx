import { useEffect, useState, type ComponentType } from "react";
import type { StockAsset } from "../../../../src/stock-catalog-source";
type Props = { asset: StockAsset; onLockChange: (locked: boolean) => void };
export default function StockCheckoutLoader(props: Props) {
  const [Checkout, setCheckout] = useState<ComponentType<Props> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    if (!import.meta.env.SSR) {
      import("./ArcStockCheckout")
        .then((module) => {
          if (active) setCheckout(() => module.default);
        })
        .catch((error: unknown) => {
          console.error("Stock checkout module failed to load", error);
          if (active) setFailed(true);
        });
    }
    return () => {
      active = false;
    };
  }, []);
  if (failed)
    return (
      <p className="st-error" role="alert">
        The purchase provider could not load. Reload this page to try again.
      </p>
    );
  return Checkout ? (
    <Checkout {...props} />
  ) : (
    <p className="st-caption" role="status">
      Loading Arc purchase…
    </p>
  );
}
