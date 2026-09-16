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
          setStorageNote(
            "Stored paper account could not be read. A fresh sample account is shown.",
          );
      }
    } catch {
      setStorageNote("Browser storage is unavailable. Paper trades last for this session.");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("arcwell-paper-v1", JSON.stringify(book));
    } catch {
      setStorageNote("Paper account changes could not be saved in this browser.");
    }
  }, [book, loaded]);
  return { book, setBook, loaded, storageNote };
}
