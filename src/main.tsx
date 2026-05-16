import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Enhanced loading component for app hydration
function AppLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
        </div>
        <span className="text-sm text-slate-400 tracking-wide">Initializing...</span>
      </div>
    </div>
  );
}

// Mount the application
const rootElement = document.getElementById("root");

if (rootElement) {
  // Remove any loading styles immediately
  rootElement.style.background = "transparent";
  
  createRoot(rootElement).render(
    <StrictMode>
      <Suspense fallback={<AppLoader />}>
        <App />
      </Suspense>
    </StrictMode>
  );
}
