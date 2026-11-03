import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { clerkPublishableKey } from "@/lib/env";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        afterSignOutUrl="/"
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    ) : (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-lg rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            ClothsWear is not configured
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Set <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> in
            your local environment, then restart the Vite dev server.
          </p>
        </div>
      </main>
    )}
  </StrictMode>,
);
