import { useEffect, useState } from "react";

/** Current time in ms, re-rendering every `intervalMs`. Keeps render itself pure (no Date.now() in components). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
