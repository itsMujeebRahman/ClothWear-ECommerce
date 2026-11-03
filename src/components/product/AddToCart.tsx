
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import PriceFormatter from "./PriceFormatter";
import QuantityButtons from "./QuantityButtons";
import { cn } from "@/lib/utils";
import useCartStore from "@/store/cart";
import {
  canIncreaseQuantity,
  getAvailableStock,
  getMaxPurchasableQuantity,
} from "@/shared/cart";
import { getFinalUnitPrice } from "@/shared/pricing";
import type { StoreProduct } from "@/types/product";

interface Props {
  product: StoreProduct;
  className?: string;
}

export default function AddToCart({ product, className }: Props) {
  const { addItem, getItemCount } = useCartStore();
  const itemCount = getItemCount(product._id);
  const availableStock = getAvailableStock(product);
  const isOutOfStock = availableStock <= 0;
  const finalPrice = getFinalUnitPrice(product.price, product.discount);

  const handleAdd = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock.");
      return;
    }
    if (!canIncreaseQuantity(product, itemCount)) {
      toast.error(
        `Only ${getMaxPurchasableQuantity(product)} available for this item.`,
      );
      return;
    }
    addItem(product);
    toast.success(`${product.name ?? "Item"} added successfully!`);
  };

  return (
    <div className="w-full h-12 flex items-center">
      {itemCount ? (
        <div className="w-full text-sm ">
          <div className="flex item-center justify-between">
            <span className="text-xs text-muted-foreground">Quantity</span>
            <QuantityButtons product={product} />
          </div>
          <div className="flex items-center justify-between border-t pt-1">
            <span className="text-xs font-semibold">Subtotal</span>
            <PriceFormatter amount={finalPrice * itemCount} />
          </div>
        </div>
      ) : (
        <Button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={cn(
            "w-full bg-transparent text-black shadow-none border border-black/30 font-semibold tracking-wide hover:text-white cursor-pointer hoverEffect",
            className,
          )}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      )}
    </div>
  );
}
