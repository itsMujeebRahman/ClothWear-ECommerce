import type Stripe from "stripe";

/**
 * Stripe returns at most 100 line items per page. Orders can contain more, so
 * always follow `has_more` instead of reading only the first page.
 */
export async function listAllCheckoutLineItems(
  stripe: Stripe,
  sessionId: string,
): Promise<Stripe.LineItem[]> {
  const lineItems: Stripe.LineItem[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ["data.price.product"],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    lineItems.push(...page.data);

    if (!page.has_more) {
      break;
    }

    const next = page.data.at(-1)?.id;
    if (!next || next === startingAfter) {
      break;
    }
    startingAfter = next;
  }

  return lineItems;
}

export function toOrderInvoice(
  invoice: Stripe.Invoice | null,
): {
  id: string;
  number: string | null;
  hosted_invoice_url: string | null;
} | null {
  if (!invoice) {
    return null;
  }
  return {
    id: invoice.id,
    number: invoice.number ?? null,
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
  };
}

export async function retrieveInvoiceForSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<Stripe.Invoice | null> {
  if (!session.invoice) {
    return null;
  }

  if (typeof session.invoice === "string") {
    return stripe.invoices.retrieve(session.invoice);
  }

  return session.invoice;
}
