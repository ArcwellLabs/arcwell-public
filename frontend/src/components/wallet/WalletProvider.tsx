import { useEffect, useState, type ComponentType, type PropsWithChildren } from "react";
import { useLocation } from "@tanstack/react-router";

// Keep wallet SDKs out of server bundles and the landing page's initial download.
export default function WalletProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const [Runtime, setRuntime] = useState<ComponentType<PropsWithChildren> | null>(null);
  const [failed, setFailed] = useState(false);
  const dashboard = location.pathname === "/dashboard";
  useEffect(() => {
    if (!dashboard || Runtime || import.meta.env.SSR) return;
    let active = true;
    void import("./WalletRuntime")
      .then((module) => {
        if (active) setRuntime(() => module.default);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [dashboard, Runtime]);
  return Runtime ? (
    <Runtime>{children}</Runtime>
  ) : (
    <>
      {children}
      {failed && dashboard && (
        <p className="aw-wallet-load-error" role="alert">
          Wallet connections could not load. Reload the page to try again.
        </p>
      )}
    </>
  );
}
