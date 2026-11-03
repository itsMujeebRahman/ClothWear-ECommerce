import { useEffect } from "react";
import { mutate } from "swr";
import { apiUrl } from "@/lib/env";

/**
 * Mounted once in the app layout. The API streams product/category
 * invalidations from Sanity; no dataset token or content is exposed to the
 * browser. Product hooks listen for PRODUCTS_CHANGED_EVENT, categories use SWR.
 */
export const PRODUCTS_CHANGED_EVENT = "sanity:products-changed";

export default function SanityLive() {
  useEffect(() => {
    const source = new EventSource(apiUrl("/api/live"));
    let timer: number | undefined;

    const scheduleRefresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void mutate("categories");
        window.dispatchEvent(new Event(PRODUCTS_CHANGED_EVENT));
      }, 200);
    };

    source.addEventListener("invalidate", scheduleRefresh);
    source.addEventListener("error", () => {
      // EventSource reconnects automatically. Keep the UI usable while offline.
    });

    return () => {
      window.clearTimeout(timer);
      source.removeEventListener("invalidate", scheduleRefresh);
      source.close();
    };
  }, []);

  return null;
}
