import { Product } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";
import Link from "next/link";
import Image from "next/image";
import PriceView from "./PriceView";
import AddToCart from "./AddToCart";

const ProductCard = ({ product }: { product: Product }) => {
  console.log(product);

  return (
    <div className=" group rounded-lg text-sm overflow-hidden">
      <div className="bg-gradient-to-r from-zinc-200 via-zinc-300 to-zinc-200 overflow-hidden relative">
        {product?.images && (
          <Link href={`/product/${product?.slug?.current}`}>
            <Image
              src={urlFor(product?.images[0]).url()}
              width={500}
              height={500}
              alt="ProductImage"
              priority
              className={`w-full h-72 object-cover overflow-hidden hoverEffect ${product?.stock !== 0 && "group-hover:scale-105"}`}
            />
          </Link>
        )}
        {product?.stock === 0 && (
          <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
            <p className="text-xl text-white font-semibold text-center">
              Out of stock :(
            </p>
          </div>
        )}
      </div>
      <div className="py-3 px-2 flex flex-col gap-1.5 bg-zinc-50 border border-t-0 rounded-lg rounded-tl-none rounded-tr-none">
        <h2 className="font-semibold line-clamp-1">{product?.name}</h2>
        <p>{product?.intro}</p>
        <PriceView
          className="text-lg"
          price={product?.price}
          discount={product?.discount}
        />
        <AddToCart product={product} />
      </div>
    </div>
  );
};

export default ProductCard;
