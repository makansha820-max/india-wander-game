import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App";
import "./index.css";

inject();
injectSpeedInsights();

const rootEl = document.getElementById("root");

window.addEventListener("error", (event) => {
  console.error(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error(event.reason);
});

if (!rootEl) {
  throw new Error("Missing #root");
}

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (err) {
  rootEl.innerHTML = `<div style="padding:2rem;font-family:system-ui;color:#fff;background:#1c1914;min-height:100vh">
    <h1>Wander India failed to start</h1>
    <p>${err instanceof Error ? err.message : String(err)}</p>
    <p>Try another browser with WebGL enabled.</p>
  </div>`;
}
