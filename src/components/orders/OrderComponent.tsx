import { useState } from "react";
import { format } from "date-fns";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import PriceFormatter from "@/components/product/PriceFormatter";
import OrderDetailsDialog from "./OrderDetailsDialog";
import type { Order } from "@/types/api";

export default function OrderComponent({ orders }: { orders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <>
      <TableBody>
        {orders.map((order) => (
          <TableRow
            key={order._id}
            onClick={() => setSelectedOrder(order)}
            className="cursor-pointer hover:bg-gray-100 h-12"
          >
            <TableCell className="font-medium">
              {order.orderNumber?.slice(-10) ?? "N/A"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {order.orderDate
                ? format(new Date(order.orderDate), "dd/MM/yyyy")
                : "—"}
            </TableCell>
            <TableCell>{order.customerName}</TableCell>
            <TableCell className="hidden md:table-cell">{order.email}</TableCell>
            <TableCell>
              <PriceFormatter
                amount={order.totalPrice}
                className="text-black font-medium"
              />
            </TableCell>
            <TableCell>
              {order.status && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "text-yellow-800"
                  }`}
                >
                  {order.status}
                </span>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {order.invoice?.number ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <OrderDetailsDialog
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
}
