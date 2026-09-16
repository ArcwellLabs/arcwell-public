import { useEffect, useState } from "react";
import { initialBook, validBook } from "@/lib/quant";

export function usePaperBook() {
  const [book, setBook] = useState(initialBook),
    [loaded, setLoaded] = useState(false),
    [storageNote, setStorageNote] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("arcwell-paper-v1");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (validBook(parsed)) setBook(parsed);
        else
          setStorageNote("Saved account could not be read. Default starting balances are shown.");
      }
    } catch {
      setStorageNote("Browser storage is unavailable. Account changes last for this session.");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("arcwell-paper-v1", JSON.stringify(book));
    } catch {
      setStorageNote("Account changes could not be saved in this browser.");
    }
  }, [book, loaded]);
  return { book, setBook, loaded, storageNote };
}
