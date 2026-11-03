import { Link } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";
import { LuFileX as FileX } from "react-icons/lu";
import Container from "@/components/layout/Container";
import Title from "@/components/common/Title";
import OrderComponent from "@/components/orders/OrderComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders } from "@/hooks/useOrders";

export default function OrdersPage() {
  const { orders, loading, error, isSignedIn } = useOrders();

  if (!isSignedIn) {
    return (
      <Container className="py-16">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Your Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Sign in to view your order history and invoices.
            </p>
            <SignInButton mode="modal">
              <Button className="w-full">Sign In</Button>
            </SignInButton>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg bg-gray-100">
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-lg bg-gray-100 text-center">
          <p className="text-gray-700">{error}</p>
        </div>
      ) : orders.length ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">Order List</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-auto">Order Number</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Invoice Number
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <OrderComponent orders={orders} />
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-5 md:py-10 px-4">
          <FileX size={24} className="h-24 w-24 text-gray-400 mb-4" />
          <Title>No orders found</Title>
          <p className="mt-2 text-sm text-gray-600 text-center max-w-md">
            It looks like you haven&apos;t placed any orders yet. Start
            shopping to show your orders here.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Browse Products</Link>
          </Button>
        </div>
      )}
    </Container>
  );
}
