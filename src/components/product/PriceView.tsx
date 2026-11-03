import PriceFormatter from "./PriceFormatter";
import { cn } from "@/lib/utils";
import {
  getFinalUnitPrice,
  getOriginalUnitPrice,
  isValidPrice,
} from "@/shared/pricing";

interface Props {
  price: number | null | undefined;
  discount: number | null | undefined;
  className?: string;
}

/**
 * `price` is the original list price and `discount` is a percentage off it.
 * The final price is shown first; the struck-through value is the original.
 */
export default function PriceView({ price, discount, className }: Props) {
  const finalPrice = getFinalUnitPrice(price, discount);
  const originalPrice = isValidPrice(price) ? getOriginalUnitPrice(price) : 0;
  const showOriginal = finalPrice < originalPrice;

  return (
    <div className="flex items-center gap-2 ">
      <PriceFormatter amount={finalPrice} className={className} />
      {showOriginal && (
        <PriceFormatter
          amount={originalPrice}
          className={cn("line-through font-medium text-zinc-500", className)}
        />
      )}
    </div>
  );
}
