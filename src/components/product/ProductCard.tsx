import { Link } from "react-router-dom";
import PriceView from "./PriceView";
import AddToCart from "./AddToCart";
import ProductImage from "./ProductImage";
import { getAvailableStock } from "@/shared/cart";
import type { StoreProduct } from "@/types/product";

export default function ProductCard({ product }: { product: StoreProduct }) {
  const outOfStock = getAvailableStock(product) <= 0;

  return (
    <div className="group rounded-lg text-sm overflow-hidden">
      <div className="bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 overflow-hidden relative">
        <Link to={`/product/${product.slug?.current ?? ""}`}>
          <ProductImage
            source={product.images?.[0]}
            alt={product.name ?? "Product"}
            width={500}
            height={500}
            className={`w-full h-72 object-cover overflow-hidden hoverEffect ${
              !outOfStock ? "group-hover:scale-105" : ""
            }`}
            fallbackClassName="w-full h-72"
          />
        </Link>
        {outOfStock && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
            <p className="text-xl text-white font-semibold text-center">
              Out of stock :(
            </p>
          </div>
        )}
      </div>
      <div className="py-3 px-2 flex flex-col gap-1.5 bg-zinc-50 border border-t-0 rounded-lg rounded-tl-none rounded-tr-none">
        <h2 className="font-semibold line-clamp-1">{product.name}</h2>
        <p className="line-clamp-1 text-gray-600">{product.intro}</p>
        <PriceView
          className="text-lg"
          price={product.price}
          discount={product.discount}
        />
        <AddToCart product={product} />
      </div>
    </div>
  );
}
