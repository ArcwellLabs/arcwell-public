import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type WorkspacePreferences = {
  name: string;
  timezone: string;
  density: "comfortable" | "compact";
  chart: "Line" | "Candles";
  reduceMotion: boolean;
};
export const defaultPreferences: WorkspacePreferences = {
  name: "My workspace",
  timezone: "America/New_York",
  density: "comfortable",
  chart: "Line",
  reduceMotion: false,
};
const Context = createContext({
  preferences: defaultPreferences,
  save: (_next: WorkspacePreferences): boolean => false,
});
export function WorkspacePreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("arcwell-workspace-v1") || "null");
      if (!saved || typeof saved !== "object") return;
      let timezone = defaultPreferences.timezone;
      try {
        new Intl.DateTimeFormat("en", { timeZone: saved.timezone }).format();
        timezone = saved.timezone || timezone;
      } catch {
        /* Keep the default zone. */
      }
      setPreferences({
        name:
          typeof saved.name === "string" && saved.name.trim()
            ? saved.name.slice(0, 60)
            : defaultPreferences.name,
        timezone,
        density: saved.density === "compact" ? "compact" : "comfortable",
        chart: saved.chart === "Candles" ? "Candles" : "Line",
        reduceMotion: saved.reduceMotion === true,
      });
    } catch {
      /* Preferences remain usable when storage is unavailable. */
    }
  }, []);
  const save = (next: WorkspacePreferences) => {
    setPreferences(next);
    try {
      localStorage.setItem("arcwell-workspace-v1", JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  };
  return <Context.Provider value={{ preferences, save }}>{children}</Context.Provider>;
}
export const useWorkspacePreferences = () => useContext(Context);
