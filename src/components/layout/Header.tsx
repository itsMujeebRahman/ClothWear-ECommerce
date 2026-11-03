import Container from "./Container";
import HeaderMenu from "./HeaderMenu";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import CartIcon from "@/components/cart/CartIcon";
import SearchBar from "@/components/product/SearchBar";
import {
  ClerkLoaded,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { LuListOrdered as ListOrdered } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { useOrders } from "@/hooks/useOrders";

export default function Header() {
  const { categories } = useCategories();
  const { orders } = useOrders();

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-b-gray-200 py-5">
      <Container className="flex items-center justify-between gap-7 lightColor">
        <HeaderMenu categories={categories} />
        <div className="w-auto md:w1/3 flex items-center justify-center gap-2.5">
          <MobileMenu categories={categories} />
          <Logo className="italic ">ClothsWear</Logo>
        </div>
        <div className="w-auto md:w-1/3 flex items-center justify-end gap-5">
          <SearchBar />
          <CartIcon />
          <ClerkLoaded>
            <SignedIn>
              <Link to="/orders" className="group relative">
                <ListOrdered
                  size={24}
                  className="w-5 h-5 hover:text-black text-gray-500 hoverEffect"
                />
                <span
                  className="absolute -top-1 -right-1 bg-black text-white h-3.5 w-3.5
                    rounded-full text-xs font-semibold flex items-center justify-center"
                >
                  {orders.length}
                </span>
              </Link>
              <span
                className="inline-flex items-center justify-center border-3 rounded-full
              hover:border-black hoverEffect"
              >
                <UserButton />
              </span>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold hover:text-black hoverEffect text-gray-500">
                  Login
                </button>
              </SignInButton>
            </SignedOut>
          </ClerkLoaded>
        </div>
      </Container>
    </header>
  );
}
