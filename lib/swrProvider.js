// src/lib/swrProvider.js
"use client";

import { SWRConfig } from "swr";

// ✅ LocalStorage cache provider
function localStorageProvider() {
  // ✅ Run only in browser
  if (typeof window === "undefined") return new Map();

  // On init: restore SWR cache from localStorage
  const map = new Map(JSON.parse(localStorage.getItem("swr-cache") || "[]"));

  // Before leaving page, save SWR cache to localStorage
  window.addEventListener("beforeunload", () => {
    const appCache = JSON.stringify(Array.from(map.entries()));
    localStorage.setItem("swr-cache", appCache);
  });

  return map;
}

// ✅ Global SWRConfig wrapper
export default function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        provider: localStorageProvider,
        onError: (err) => console.error("SWR Error:", err),
        keepPreviousData: true, // show old data instantly on refetch
        revalidateOnReconnect: false,
        dedupingInterval: 1000 * 60 * 10, // 10 min cache
        suspense: false,
        revalidateOnFocus: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
