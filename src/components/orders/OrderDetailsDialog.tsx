import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import ProductImage from "@/components/product/ProductImage";
import PriceFormatter from "@/components/product/PriceFormatter";
import type { Order } from "@/types/api";

interface Props {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsDialog({ order, isOpen, onClose }: Props) {
  if (!order) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Order Details - {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Review the items, totals and invoice for this order.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-1">
          <p>
            <strong>Customer:</strong> {order.customerName}
          </p>
          <p>
            <strong>Email:</strong> {order.email}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {order.orderDate
              ? new Date(order.orderDate).toLocaleDateString()
              : "Unknown"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className="capitalize text-green-600 font-medium">
              {order.status}
            </span>
          </p>
          <p>
            <strong>Invoice Number:</strong> {order.invoice?.number ?? "—"}
          </p>
          {order.invoice?.hosted_invoice_url && (
            <Button
              asChild
              className="bg-transparent border text-black/80 mt-2 hover:text-black hover:border-black hover:bg-black/10 hoverEffect"
              variant="outline"
            >
              <a
                href={order.invoice.hosted_invoice_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Invoice
              </a>
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.products?.map((line) => (
              <TableRow key={line._key}>
                <TableCell className="flex items-center gap-2">
                  <ProductImage
                    source={line.product?.images?.[0]}
                    alt={line.name ?? line.product?.name ?? "Product"}
                    width={50}
                    height={50}
                    className="border rounded-sm w-14 h-14 object-contain"
                    fallbackClassName="w-14 h-14"
                  />
                  <p className="line-clamp-1">
                    {line.name ?? line.product?.name ?? "Product"}
                  </p>
                </TableCell>
                <TableCell className="text-center">{line.quantity}</TableCell>
                <TableCell>
                  <PriceFormatter
                    amount={
                      line.lineTotal ??
                      (line.unitPrice ?? 0) * (line.quantity ?? 0)
                    }
                    className="text-black font-medium"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-right flex items-center justify-end">
          <div className="w-44 flex flex-col gap-1">
            <div className="flex items-center justify-between w-full">
              <strong>Subtotal</strong>
              <PriceFormatter amount={order.subtotal} />
            </div>
            <div className="flex items-center justify-between w-full">
              <strong>Discount</strong>
              <PriceFormatter amount={order.amountDiscount} />
            </div>
            <div className="flex items-center justify-between w-full">
              <strong>Total :</strong>
              <PriceFormatter
                amount={order.totalPrice}
                className="text-black font-bold"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
