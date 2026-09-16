import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Send, Twitter } from "lucide-react";
import { comingSoon } from "@/lib/comingSoon";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/studio", label: "Operating model" },
  { to: "/roadmap", label: "Roadmap" },
  { to: "/projects", label: "Record explorer" },
  { to: "/articles", label: "Field notes" },
  { to: "/contact", label: "Start a pilot" },
  { to: "/dashboard", label: "Dashboard" },
];

const SOCIALS = [
  { icon: Twitter, label: "X" },
  { icon: Send, label: "Telegram" },
];

/** Full-screen menu: clip-path wipe, staggered giant links, contact/social footer row. */
export default function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-bg"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="container-infini flex flex-1 flex-col justify-between pt-[120px]">
        <div className="grid flex-1 grid-cols-12 items-center gap-6">
          {/* Left lockup */}
          <div className="hidden h-full flex-col justify-end pb-10 lg:col-span-5 lg:flex">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="kicker"
            >
              Proof infrastructure, ARC
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.56, duration: 0.5 }}
              className="mt-3 font-display text-6xl font-bold tracking-tight text-ink"
            >
              ARCWELL®
            </motion.p>
          </div>

          {/* Right nav links */}
          <nav className="col-span-12 lg:col-span-7" aria-label="Main">
            <ul className="flex flex-col items-start gap-1 lg:items-end">
              {LINKS.map((link, i) => (
                <li key={link.to} className="overflow-hidden">
                  <motion.div
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.28 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      to={link.to}
                      onClick={onClose}
                      className="group flex items-baseline gap-4 font-display text-[clamp(40px,6vw,88px)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink transition-colors duration-300 hover:text-transparent hover:[-webkit-text-stroke:1px_#EDEDEA]"
                    >
                      <span className="font-mono text-xs tracking-[0.18em] text-faint opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        [0{i + 1}]
                      </span>
                      {link.label}
                    </Link>
                  </motion.div>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="pb-safe flex flex-col gap-6 border-t border-hairline py-8 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => comingSoon(label)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-ink-muted transition-colors duration-300 hover:border-hairline-strong hover:text-ink"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.18em] text-faint">
            <Link
              to="/dashboard"
              search={{ view: "settings" }}
              onClick={onClose}
              className="transition-colors hover:text-ink-muted"
            >
              Product limits
            </Link>
            <Link
              to="/contact"
              onClick={onClose}
              className="transition-colors hover:text-ink-muted"
            >
              Pilot terms
            </Link>
            <span>ARC mainnet</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
