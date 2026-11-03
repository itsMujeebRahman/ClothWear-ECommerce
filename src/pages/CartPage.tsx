import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  LuHeart as Heart,
  LuShoppingBag as ShoppingBag,
  LuTrash as Trash,
} from "react-icons/lu";
import Container from "@/components/layout/Container";
import Loading from "@/components/common/Loading";
import EmptyCart from "@/components/cart/EmptyCart";
import NoAccessToCart from "@/components/cart/NoAccessToCart";
import ProductImage from "@/components/product/ProductImage";
import PriceFormatter from "@/components/product/PriceFormatter";
import QuantityButtons from "@/components/product/QuantityButtons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthedFetch } from "@/hooks/useAuthedFetch";
import { getErrorMessage } from "@/lib/api";
import { getFinalUnitPrice } from "@/shared/pricing";
import useCartStore from "@/store/cart";
import paypalLogo from "@/assets/paypalLogo.png";
import type { CheckoutResponse } from "@/types/api";

export default function CartPage() {
  const [loading, setLoading] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const authedFetch = useAuthedFetch();
  const {
    deleteCartProduct,
    getDiscountAmount,
    getGroupedItem,
    getSubTotalPrice,
    getTotalPrice,
    resetCart,
  } = useCartStore();

  if (!isLoaded) {
    return <Loading />;
  }

  const cartProducts = getGroupedItem();

  const handleResetCart = () => {
    const confirmed = window.confirm("Are you sure you want to reset your cart?");
    if (confirmed) {
      resetCart();
      toast.success("Your cart was reset successfully");
    }
  };

  const handleDeleteProduct = (id: string) => {
    deleteCartProduct(id);
    toast.success("Product deleted successfully");
  };

  const handleCheckout = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to continue.");
      return;
    }

    setLoading(true);
    try {
      const result = await authedFetch<CheckoutResponse>("/api/checkout", {
        method: "POST",
        body: {
          items: cartProducts.map(({ product, quantity }) => ({
            productId: product._id,
            quantity,
          })),
        },
      });

      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      throw new Error("Checkout did not return a payment URL.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const summary = (
    <div className="space-y-4">
      <div className="flex justify-between">
        <span>Sub Total</span>
        <PriceFormatter amount={getSubTotalPrice()} />
      </div>
      <div className="flex justify-between">
        <span>Discount</span>
        <PriceFormatter amount={getDiscountAmount()} />
      </div>
      <div className="flex justify-between border-t pt-5">
        <span>Total</span>
        <PriceFormatter
          amount={getTotalPrice()}
          className="text-lg font-bold text-black"
        />
      </div>
      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded-full font-semibold tracking-wide"
        size="lg"
      >
        {loading ? "Processing" : "Proceed to Checkout"}
      </Button>
      <Link
        to="/"
        className="flex items-center justify-center py-2 border border-black/50
        rounded-full hover:border-black hover:bg-black/10 hoverEffect"
      >
        <img src={paypalLogo} alt="PayPal" className="w-20" />
      </Link>
    </div>
  );

  return (
    <div className="bg-gray-50 pb-52 md:pb-10">
      {isSignedIn ? (
        <Container>
          {cartProducts.length ? (
            <>
              <div className="flex items-center gap-2 py-5">
                <ShoppingBag size={24} />
                <h1 className="text-2xl font-semibold">Shopping Cart</h1>
              </div>
              <div className="grid lg:grid-cols-3 md:gap-8">
                <div className="lg:col-span-2 rounded-lg">
                  <div className="border bg-white rounded-md">
                    {cartProducts.map(({ product, quantity }) => {
                      const unitPrice = getFinalUnitPrice(
                        product.price,
                        product.discount,
                      );

                      return (
                        <div
                          key={product._id}
                          className="border-b p-2.5 last:border-b-0 flex items-center justify-between gap-5"
                        >
                          <div className="flex flex-1 items-center gap-2 h-36 md:h-44">
                            <Link
                              to={`/product/${product.slug?.current ?? ""}`}
                              className="border p-0.5 md:p-1 mr-2 rounded-md overflow-hidden group"
                            >
                              <ProductImage
                                source={product.images?.[0]}
                                alt={product.name ?? "Product"}
                                width={500}
                                height={500}
                                className="w-32 md:w-40 h-32 md:h-40 object-cover group-hover:scale-105 overflow-hidden hoverEffect"
                                fallbackClassName="w-32 md:w-40 h-32 md:h-40"
                              />
                            </Link>
                            <div className="h-full flex flex-1 items-start flex-col justify-between py-1">
                              <div className="space-y-1.5">
                                <h2 className="font-semibold line-clamp-1">
                                  {product.name}
                                </h2>
                                <p className="text-sm text-gray-500 font-medium">
                                  {product.intro}
                                </p>
                                <p className="text-sm capitalize">
                                  Variant:{" "}
                                  <span className="font-semibold">
                                    {product.variant}
                                  </span>
                                </p>
                                <p className="text-sm capitalize">
                                  Status:{" "}
                                  <span className="font-semibold">
                                    {product.status}
                                  </span>
                                </p>
                              </div>
                              <div className="text-gray-500 flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Add to favourites"
                                    >
                                      <Heart
                                        size={24}
                                        className="w-4 h-4 md:w-5 md:h-5 hover:text-green-600"
                                      />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-sm bg-green-500 text-white rounded-full px-2 py-1">
                                    Add to Favorite
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Delete product"
                                      onClick={() =>
                                        handleDeleteProduct(product._id)
                                      }
                                    >
                                      <Trash
                                        size={24}
                                        className="w-4 h-4 md:w-5 md:h-5 hover:text-red-600"
                                      />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-sm bg-red-500 text-white rounded-full px-2 py-1">
                                    Delete Product
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="flex flex-col items-start justify-between h-36 md:h-44 p-0.5 md:p-1">
                              <PriceFormatter
                                amount={unitPrice * quantity}
                                className="font-bold text-lg"
                              />
                              <QuantityButtons product={product} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      onClick={handleResetCart}
                      className="m-5 font-semibold hoverEffect border hover:border-red-500 hover:bg-white hover:text-red-500"
                      variant="destructive"
                    >
                      Reset Cart
                    </Button>
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <div className="hidden md:block w-full bg-white p-6 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-4">
                      Order Summary
                    </h2>
                    {summary}
                  </div>
                </div>
                <div className="md:hidden fixed bottom-0 left-0 w-full bg-white pt-2 z-40">
                  <div className="p-4 rounded-lg border mx-4">
                    <h2 className="text-xl font-semibold mb-4">
                      Order Summary
                    </h2>
                    {summary}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyCart />
          )}
        </Container>
      ) : (
        <NoAccessToCart />
      )}
    </div>
  );
}
