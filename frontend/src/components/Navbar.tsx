import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { getLenis } from "@/lib/lenis";
import MenuOverlay from "@/components/MenuOverlay";

function useTorontoTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

/**
 * Fixed 72px navbar, mix-blend-difference, 3 zones:
 * wordmark / live Toronto clock / Work link + Menu pill.
 * Layout owns the matching pt-[72px] content offset.
 */
export default function Navbar({
  dashboard = false,
  arcWorkspace = false,
}: {
  dashboard?: boolean;
  arcWorkspace?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const time = useTorontoTime();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[70] h-[72px] mix-blend-difference transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled && !open && "border-b border-white/10 bg-[rgba(10,10,11,0.6)] backdrop-blur-xl",
        )}
      >
        <div className="container-infini flex h-full items-center justify-between text-white">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight"
            onClick={() => setOpen(false)}
          >
            <img src="/logo-mark.png" alt="ARCWELL logo" className="h-5 w-auto" />
            ARCWELL®
          </Link>

          <div className="hidden font-mono text-xs uppercase tracking-[0.18em] text-white/60 lg:block">
            {arcWorkspace ? "Arc workspace" : dashboard ? "Paper investing beta" : "ARC Network"} ·{" "}
            {time} EST
          </div>

          <nav className="flex items-center gap-7" aria-label="Primary">
            <Link
              to={dashboard ? "/dashboard" : "/projects"}
              search={dashboard ? { view: "markets" } : {}}
              className="group relative hidden text-sm font-medium sm:block"
            >
              {dashboard ? "Markets" : "Records"}
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:origin-left group-hover:scale-x-100"
              />
            </Link>
            {dashboard ? (
              <Link
                to="/dashboard"
                search={{ view: "settings" }}
                className="flex h-10 items-center rounded-full border border-white/25 px-4 font-mono text-xs uppercase tracking-[0.18em] hover:border-white/60"
              >
                Settings
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                className="flex h-10 items-center gap-3 rounded-full border border-white/25 px-4 transition-colors duration-300 hover:border-white/60"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em]">
                  {open ? "Close" : "Menu"}
                </span>
                <span className="relative block h-3 w-5" aria-hidden>
                  <span
                    className={cn(
                      "absolute left-0 top-0 h-px w-full bg-white transition-all duration-300",
                      open && "top-1/2 -translate-y-1/2 rotate-45",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 h-px w-full bg-white transition-all duration-300",
                      open && "bottom-1/2 translate-y-1/2 -rotate-45",
                    )}
                  />
                </span>
              </button>
            )}
          </nav>
        </div>
      </header>
      <MenuOverlay open={open && !dashboard} onClose={() => setOpen(false)} />
    </>
  );
}
