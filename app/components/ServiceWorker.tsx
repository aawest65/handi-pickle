"use client";

import { useEffect } from "react";

const CURRENT_SW_VERSION = "handipick-v4";

export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // Force the browser to check for a new SW version immediately.
      // This ensures stale SWs are replaced without waiting up to 24 hours.
      reg.update();
    }).catch(console.error);

    // If any active SW is serving a stale cache version, unregister it
    // immediately so the page reloads clean on next navigation.
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg?.active) return;
      const controller = navigator.serviceWorker.controller;
      if (!controller) return;

      // Ask the active SW what cache version it's using
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data?.version && event.data.version !== CURRENT_SW_VERSION) {
          reg.unregister().then(() => {
            // Clear all caches then reload once
            caches.keys().then((keys) =>
              Promise.all(keys.map((k) => caches.delete(k)))
            ).then(() => window.location.reload());
          });
        }
      };
      controller.postMessage({ type: "GET_VERSION" }, [channel.port2]);
    });
  }, []);

  return null;
}
