import { Link, useParams } from "react-router-dom";
import {
  LuBox as BoxIcon,
  LuFileQuestion as FileQuestion,
  LuHeart as Heart,
  LuListOrdered as ListOrderedIcon,
  LuShare as Share,
} from "react-icons/lu";
import Container from "@/components/layout/Container";
import AddToCart from "@/components/product/AddToCart";
import ImageView from "@/components/product/ImageView";
import PriceView from "@/components/product/PriceView";
import ProductCharacteristics from "@/components/product/ProductCharacteristics";
import Loading from "@/components/common/Loading";
import { useProduct } from "@/hooks/useProduct";

export default function ProductPage() {
  const { slug } = useParams();
  const { product, loading, notFound, error } = useProduct(slug);

  if (loading) {
    return <Loading />;
  }

  if (notFound) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-3xl font-bold">Product not found</h1>
        <p className="mt-3 text-gray-600">
          The product you are looking for may have been removed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full border border-black/30 px-6 py-2.5 text-sm font-semibold hover:bg-black hover:text-white hoverEffect"
        >
          Browse Products
        </Link>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-20 text-center">
        <h1 className="text-2xl font-bold">Unable to load this product</h1>
        <p className="mt-3 text-gray-600">
          {error ?? "Please try again in a moment."}
        </p>
      </Container>
    );
  }

  const inStock = typeof product.stock === "number" && product.stock > 0;

  return (
    <Container className="py-10 flex flex-col md:flex-row gap-10">
      <ImageView images={product.images ?? []} />
      <div className="w-full md:w-1/2 flex flex-col gap-5">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            {product.name}
          </h2>
          <PriceView
            price={product.price}
            discount={product.discount}
            className="text-lg font-bold"
          />
        </div>
        <p
          className={`w-24 text-center text-sm py-2.5 font-semibold rounded-lg ${
            inStock
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {inStock ? "In Stock" : "Out of Stock"}
        </p>
        <p className="text-sm text-gray-600 tracking-wide">
          {product.description}
        </p>
        <div className="flex items-center gap-2.5 lg:gap-3">
          <AddToCart
            product={product}
            className="bg-black/80 text-white hover:bg-black hoverEffect"
          />
          <button
            type="button"
            aria-label="Add to favourites"
            className="border-2 border-black/30 text-black/60 px-2.5 py-1.5 rounded hover:text-black hover:border-black hoverEffect"
          >
            <Heart size={24} className="w-5 h-5" />
          </button>
        </div>
        <ProductCharacteristics product={product} />
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-b-gray-200 py-5 -mt-2">
          <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
            <BoxIcon size={24} className="w-5 h-5" />
            <p>Compare Color</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
            <FileQuestion size={24} className="w-5 h-5" />
            <p>Ask a Question</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
            <ListOrderedIcon size={24} className="w-5 h-5" />
            <p>Delivery &amp; Return</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-black hover:text-red-600 hoverEffect">
            <Share size={24} className="w-5 h-5" />
            <p>Share</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="border border-gray-300 hover:border-gray-500 text-center p-3 hoverEffect rounded">
            <p className="text-base font-semibold text-black">Free Shipping</p>
            <p className="text-sm text-gray-500">
              Free Shipping over order $120
            </p>
          </div>

          <div className="border border-gray-300 hover:border-gray-500 text-center p-3 hoverEffect rounded">
            <p className="text-base font-semibold text-black">
              Flexible Payment
            </p>
            <p className="text-sm text-gray-500">
              Pay with Multiple Credit Cards
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
