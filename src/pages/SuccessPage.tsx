import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { mutate } from "swr";
import { LuCircleCheck as CheckCircle, LuCircleX as XCircle } from "react-icons/lu";
import Container from "@/components/layout/Container";
import Loading from "@/components/common/Loading";
import PriceFormatter from "@/components/product/PriceFormatter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCheckoutSession } from "@/hooks/useCheckoutSession";

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { isLoaded, isSignedIn } = useAuth();
  const { status, data, error } = useCheckoutSession(
    sessionId,
    isLoaded && Boolean(isSignedIn),
  );

  useEffect(() => {
    if (status === "paid") {
      void mutate("orders");
    }
  }, [status]);

  if (!isLoaded) {
    return <Loading />;
  }

  if (!isSignedIn) {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to view this order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your payment may already be complete. Sign in with the account
              used at checkout to confirm it.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full">Sign In</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!sessionId) {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Checkout session missing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We could not find a checkout session to verify.
            </p>
            <Button asChild className="w-full">
              <Link to="/orders">View Orders</Link>
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (status === "loading" || status === "processing" || status === "idle") {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Confirming your payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            <p className="text-muted-foreground">
              This usually takes a few seconds. Please keep this page open.
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (status === "paid" && data?.status === "paid") {
    const order = data.order;
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-lg text-center">
          <CardHeader className="items-center">
            <CheckCircle size={48} className="text-green-600" />
            <CardTitle className="text-2xl">Payment successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Thank you for your order. A confirmation was sent to{" "}
              <span className="font-medium text-black">{order.email}</span>.
            </p>
            <div className="rounded-lg border bg-gray-50 p-4 text-left text-sm">
              <div className="flex justify-between py-1">
                <span>Order number</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Total paid</span>
                <PriceFormatter
                  amount={order.totalPrice}
                  className="font-bold"
                />
              </div>
              <div className="flex justify-between py-1">
                <span>Status</span>
                <span className="font-medium capitalize">{order.status}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to="/orders">View Orders</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-md text-center">
        <CardHeader className="items-center">
          <XCircle size={48} className="text-red-500" />
          <CardTitle className="text-2xl">
            {status === "expired" ? "Checkout expired" : "We could not confirm payment"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {status === "expired"
              ? "This checkout session expired before payment was completed."
              : error ??
                "Your payment may still be processing. Check your orders again shortly."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link to="/orders">View Orders</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/cart">Back to Cart</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
