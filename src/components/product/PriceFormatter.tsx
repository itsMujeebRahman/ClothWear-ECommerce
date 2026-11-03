import { cn } from "@/lib/utils";
import { formatAmount } from "@/shared/pricing";

interface Props {
  amount: number | null | undefined;
  className?: string;
}

export default function PriceFormatter({ amount, className }: Props) {
  return (
    <span className={cn("text-sm font-semibold text-black", className)}>
      {formatAmount(amount)}
    </span>
  );
}
