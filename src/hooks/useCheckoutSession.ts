import { useEffect, useState } from "react";
import { useAuthedFetch } from "@/hooks/useAuthedFetch";
import { getErrorMessage } from "@/lib/api";
import type { CheckoutSessionResponse } from "@/types/api";

export type CheckoutVerificationStatus =
  | "idle"
  | "loading"
  | "processing"
  | "paid"
  | "expired"
  | "error";

interface State {
  status: CheckoutVerificationStatus;
  data: CheckoutSessionResponse | null;
  error: string | null;
}

const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 10;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Verifies the Stripe session on the server. When the webhook is delayed the
 * endpoint performs fulfillment; the page polls briefly while payment settles.
 */
export function useCheckoutSession(
  sessionId: string | null,
  enabled: boolean,
) {
  const authedFetch = useAuthedFetch();
  const [state, setState] = useState<State>({
    status: "idle",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    let cancelled = false;

    async function verify() {
      setState({ status: "loading", data: null, error: null });

      for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
        if (cancelled) {
          return;
        }

        try {
          const data = await authedFetch<CheckoutSessionResponse>(
            `/api/checkout/session?session_id=${encodeURIComponent(sessionId!)}`,
          );

          if (cancelled) {
            return;
          }

          if (data.status === "paid") {
            setState({ status: "paid", data, error: null });
            return;
          }

          if (data.status === "expired") {
            setState({ status: "expired", data, error: null });
            return;
          }

          setState({ status: "processing", data, error: null });
        } catch (error) {
          if (cancelled) {
            return;
          }
          setState({
            status: "error",
            data: null,
            error: getErrorMessage(error),
          });
          return;
        }

        await delay(POLL_INTERVAL_MS);
      }

      if (!cancelled) {
        setState((current) => ({
          status: current.status === "processing" ? "processing" : "error",
          data: current.data,
          error:
            current.status === "processing"
              ? null
              : "We could not confirm your payment yet. Please check your orders shortly.",
        }));
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [authedFetch, enabled, sessionId]);

  if (enabled && !sessionId) {
    return {
      status: "error" as const,
      data: null,
      error: "Missing checkout session.",
    };
  }

  return state;
}
