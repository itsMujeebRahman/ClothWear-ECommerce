import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LuLoaderCircle as Loader2 } from "react-icons/lu";
import { productType } from "@/constants";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "./ProductCard";
import ProductTab from "./ProductTabBar";
import NoProductsAvailable from "./NoProductsAvailable";

export default function ProductGrid() {
  const [selectedTab, setSelectedTab] = useState(
    productType[0]?.title ?? "",
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedVariant =
    productType.find((item) => item.title === selectedTab)?.value ??
    productType[0]?.value ??
    "";

  const { products, loading, error, reload } = useProducts({
    variant: selectedVariant,
  });

  useEffect(() => {
    if (loading || !products.length || !gridRef.current) {
      return;
    }

    const animation = gsap.from(
      gridRef.current.querySelectorAll(".product-item"),
      {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      },
    );

    return () => {
      animation.kill();
    };
  }, [loading, products]);

  return (
    <div className="mt-10 flex flex-col items-center gap-0">
      <ProductTab selectedTab={selectedTab} onTabSelect={setSelectedTab} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 min-h-80 space-y-4 text-center bg-gray-100 rounded-lg w-full mt-10">
          <div className="flex items-center space-x-2 text-blue-400">
            <Loader2 size={24} className="w-5 h-5 animate-spin" />
            <span className="text-xl font-semibold">
              Loading your clothes....
            </span>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 min-h-80 space-y-4 text-center bg-gray-100 rounded-lg w-full mt-10">
          <p className="text-gray-700">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="rounded-full border border-black/30 px-5 py-2 text-sm font-semibold hover:text-white hover:bg-black hoverEffect"
          >
            Try again
          </button>
        </div>
      ) : products.length ? (
        <div
          ref={gridRef}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8 mt-10 w-full"
        >
          {products.map((product) => (
            <div key={product._id} className="product-item">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <NoProductsAvailable selectedTab={selectedTab} />
      )}
    </div>
  );
}
