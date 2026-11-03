import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuLoaderCircle as Loader2,
  LuSearch as Search,
  LuX as X,
} from "react-icons/lu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import ProductImage from "./ProductImage";
import PriceView from "./PriceView";
import AddToCart from "./AddToCart";

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { products, loading } = useProducts({
    search: debouncedSearch,
    enabled: showSearch && debouncedSearch.length > 0,
  });

  return (
    <Dialog open={showSearch} onOpenChange={setShowSearch}>
      <DialogTrigger asChild>
        <button type="button" aria-label="Search products">
          <Search
            size={24}
            className="w-5 h-5 hover:text-black text-gray-500 hoverEffect"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="!w-[70vw] !max-w-[90vw] !min-h-[90vh] !max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="mb-1">Product Searchbar</DialogTitle>
          <DialogDescription className="sr-only">
            Search the ClothsWear catalog by product name.
          </DialogDescription>
          <form className="relative" onSubmit={(event) => event.preventDefault()}>
            <Input
              placeholder="Search your Product here "
              className="flex-1 rounded-md py-5 border border:ring-1 border-gray-500"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <X
                onClick={() => setSearch("")}
                className="w-4 h-4 absolute top-3 right-12 hover:text-red-600 hoverEffect cursor-pointer"
              />
            )}
            <button
              type="submit"
              aria-label="Search"
              className={`absolute right-0 top-0 w-10 h-full flex items-center justify-center
              rounded-tr-md rounded-br-md hover:bg-gray-500 hover:text-white hoverEffect ${search ? "bg-black text-white" : "bg-black/10"}`}
            >
              <Search size={24} className="w-5 h-5" />
            </button>
          </form>
        </DialogHeader>
        <div className="w-full h-full overflow-y-scroll border border-black/20 rounded-md">
          <div>
            {loading ? (
              <p className="flex items-center px-6 py-10 gap-1 text-center text-yellow-600 font-semibold">
                <Loader2 size={24} className="w-5 h-5 animate-spin" />
                Searching for products...
              </p>
            ) : products.length ? (
              products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white overflow-hidden border-b last:border-b-0"
                >
                  <div className="flex items-center p-1">
                    <Link
                      to={`/product/${product.slug?.current ?? ""}`}
                      className="h-20 w-20 md:h-24 md:w-24 flex-shrink-0 border
                      border-black/20 rounded-md overflow-hidden group"
                      onClick={() => setShowSearch(false)}
                    >
                      <ProductImage
                        source={product.images?.[0]}
                        alt={product.name ?? "Product"}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full group-hover:scale-110 hoverEffect"
                        fallbackClassName="w-full h-full"
                      />
                    </Link>
                    <div className="px-4 py-2 flex-grow">
                      <Link
                        to={`/product/${product.slug?.current ?? ""}`}
                        onClick={() => setShowSearch(false)}
                      >
                        <h3 className="text-sm md:text-lg font-semibold text-gray-800 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {product.intro}
                        </p>
                      </Link>
                      <PriceView
                        price={product.price}
                        discount={product.discount}
                        className="md:text-lg"
                      />
                    </div>
                    <div className="w-60 mt-1">
                      <AddToCart product={product} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 font-semibold tracking-wide">
                {search && !loading ? (
                  <p>
                    Nothing matches the keyword{" "}
                    <span className="underline text-red-600">{search}</span>.
                    Please try something else.
                  </p>
                ) : (
                  <p className="text-green-600 flex items-center justify-center gap-1">
                    <Search size={24} className="w-5 h-5" />
                    Search and explore your products from ClothsWear
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
