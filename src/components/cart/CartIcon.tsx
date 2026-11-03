import { Link } from "react-router-dom";
import { LuShoppingBag as ShoppingBag } from "react-icons/lu";
import useCartStore from "@/store/cart";

export default function CartIcon() {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link to="/cart" className="group relative" aria-label="Shopping cart">
      <ShoppingBag
        size={24}
        className="w-5 h-5 hover:text-black text-gray-500 hoverEffect"
      />
      <span
        className="absolute -top-1 -right-1 bg-black text-white h-3.5 w-3.5
          rounded-full text-xs font-semibold flex items-center justify-center"
      >
        {itemCount}
      </span>
    </Link>
  );
}
