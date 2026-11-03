import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ProductImage from "./ProductImage";
import type { StoreProduct } from "@/types/product";

type ProductImageSource = NonNullable<StoreProduct["images"]>[number];

interface Props {
  images?: ProductImageSource[];
}

export default function ImageView({ images = [] }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Derive a safe index instead of correcting state in an effect, so removing
  // images cannot briefly render an out-of-range selection.
  const safeIndex = activeIndex < images.length ? activeIndex : 0;

  const active = images[safeIndex] ?? images[0];
  if (!active) {
    return (
      <div className="w-full md:w-1/2">
        <div className="w-full max-h-[550px] min-h-[450px] border border-black/10 rounded-md overflow-hidden">
          <ProductImage
            alt="Product image"
            width={700}
            height={700}
            eager
            className="w-full h-96 max-h-[550px] min-h-[500px]"
            fallbackClassName="w-full h-96 min-h-[500px]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-1/2 space-y-2 md:space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${active._key}-${safeIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-h-[550px] min-h-[450px] border border-black/10 rounded-md group overflow-hidden"
        >
          <ProductImage
            source={active}
            alt="Product image"
            width={700}
            height={700}
            eager
            className="w-full h-96 max-h-[550px] min-h-[500px] object-contain group-hover:scale-110 hoverEffect rounded-md"
            fallbackClassName="w-full h-96 min-h-[500px]"
          />
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-6 gap-2 h-20 md:h-28">
        {images.map((image, index) => (
          <button
            type="button"
            aria-label={`View product image ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            key={image._key ?? index}
            className={`border rounded-md overflow-hidden ${
              safeIndex === index ? "ring-1 ring-gray-700" : ""
            }`}
          >
            <ProductImage
              source={image}
              alt={`Product thumbnail ${index + 1}`}
              width={100}
              height={100}
              className="w-full h-full object-contain"
              fallbackClassName="w-full h-full"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
