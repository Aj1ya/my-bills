import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    // Offline support is optional; the app still works without it.
  });
}
// Ask the browser not to evict our data under storage pressure.
navigator.storage?.persist?.().catch(() => {});
