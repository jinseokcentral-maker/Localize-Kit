import { useEffect, useState } from "react";

type LoadStatus = "idle" | "loading" | "loaded" | "error";

/**
 * Lazy-loads the WASM parser on the client without blocking initial render.
 * Logs success/failure to the console. Returns current load status for optional use.
 */
export function useLoadWasmParser(): LoadStatus {
  const [status, setStatus] = useState<LoadStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setStatus("loading");

    void import("~/lib/parser/index")
      .then(({ initWasm }: { initWasm: () => Promise<void> }) =>
        initWasm?.()
      )
      .then(() => {
        setStatus("loaded");
        console.info("[LocalizeKit] WASM parser loaded");
      })
      .catch((err) => {
        setStatus("error");
        console.warn("[LocalizeKit] WASM parser load failed", err);
      });
  }, []);

  return status;
}


