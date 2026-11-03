import toast from "react-hot-toast";
import { LuMinus as Minus, LuPlus as Plus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import useCartStore from "@/store/cart";
import {
  canIncreaseQuantity,
  getAvailableStock,
  getMaxPurchasableQuantity,
} from "@/shared/cart";
import { twMerge } from "tailwind-merge";
import type { StoreProduct } from "@/types/product";

interface Props {
  product: StoreProduct;
  className?: string;
  borderStyle?: string;
}

export default function QuantityButtons({
  product,
  className,
  borderStyle,
}: Props) {
  const { addItem, getItemCount, removeItem } = useCartStore();
  const itemCount = getItemCount(product._id);
  const isOutOfStock = getAvailableStock(product) <= 0;

  const handleRemoveProduct = () => {
    removeItem(product._id);
    if (itemCount > 1) {
      toast.success("Quantity decreased successfully");
    } else {
      toast.success(`${product.name?.substring(0, 12) ?? "Item"} removed`);
    }
  };

  const handleAddProduct = () => {
    if (!canIncreaseQuantity(product, itemCount)) {
      toast.error(
        `Only ${getMaxPurchasableQuantity(product)} available for this item.`,
      );
      return;
    }
    addItem(product);
    toast.success(`${product.name?.substring(0, 12) ?? "Item"} added`);
  };

  return (
    <div
      className={twMerge(
        "flex items-center  gap-1 text-base pb-1",
        borderStyle,
        className,
      )}
    >
      <Button
        onClick={handleRemoveProduct}
        disabled={itemCount === 0 || isOutOfStock}
        variant="outline"
        size="icon"
        className="w-6 h-6"
      >
        <Minus size={24} />
      </Button>
      <span className="font-semibold w-8 text-center">{itemCount}</span>
      <Button
        onClick={handleAddProduct}
        disabled={!canIncreaseQuantity(product, itemCount)}
        variant="outline"
        size="icon"
        className="w-6 h-6 cursor-pointer"
      >
        <Plus size={24} />
      </Button>
    </div>
  );
}
