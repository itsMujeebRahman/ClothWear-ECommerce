import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { LuLoaderCircle as Loader2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "./ProductCard";
import NoProductsAvailable from "./NoProductsAvailable";
import type { Category } from "@/types/sanity.types";

interface Props {
  categories: Category[];
  slug: string;
}

export default function CategoryProducts({ categories, slug }: Props) {
  const { products, loading, error } = useProducts({ category: slug });

  return (
    <div className="py-5 flex flex-col md:flex-row items-start gap-5">
      <div className="flex flex-col md:min-w-40 border">
        {categories.map((item) => {
          const categorySlug = item.slug?.current ?? "";
          const active = categorySlug === slug;

          return (
            <Button
              key={item._id}
              asChild
              className={`bg-transparent border-0 rounded-none text-black shadow-none hover:bg-black/80
                hover:text-white font-semibold hoverEffect border-b last:border-b-0
                ${active ? "bg-black text-white border-black hover:bg-black" : ""}`}
            >
              <Link to={`/category/${categorySlug}`}>{item.title}</Link>
            </Button>
          );
        })}
      </div>
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 min-h-80 space-y-4 text-center bg-gray-100 rounded-lg w-full">
            <motion.div className="flex items-center space-x-2 text-blue-600">
              <Loader2 size={24} className="w-5 h-5 animate-spin" />
              <span>Product is loading...</span>
            </motion.div>
          </div>
        ) : error ? (
          <div className="flex min-h-80 w-full items-center justify-center rounded-lg bg-gray-100 py-10 text-center">
            <p className="text-gray-700">{error}</p>
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {products.map((product) => (
              <AnimatePresence key={product._id}>
                <motion.div
                  layout
                  initial={{ opacity: 0.2 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              </AnimatePresence>
            ))}
          </div>
        ) : (
          <NoProductsAvailable
            selectedTab={slug}
            className="mt-0 w-full"
          />
        )}
      </div>
    </div>
  );
}
