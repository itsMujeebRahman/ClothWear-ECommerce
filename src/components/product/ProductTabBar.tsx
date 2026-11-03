import { Button } from "@/components/ui/button";
import { productType } from "@/constants";
import { LuRepeat as Repeat } from "react-icons/lu";

interface Props {
  selectedTab: string;
  onTabSelect: (tab: string) => void;
}

export default function ProductTab({ selectedTab, onTabSelect }: Props) {
  return (
    <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
      <div className="flex items-center gap-1.5">
        {productType.map((item) => (
          <Button
            key={item.title}
            onClick={() => onTabSelect(item.title)}
            className={`relative overflow-hidden px-5 py-4.5 rounded-full bg-white text-black border-2 border-solid font-medium group
            ${selectedTab === item.title ? "bg-black text-white" : ""}`}
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
              {item.title}
            </span>
            <span
              className="absolute inset-0 bg-black text-white scale-0 group-hover:scale-100 transition-transform
            duration-300 ease-out origin-center rounded-lg"
            />
          </Button>
        ))}
      </div>
      <button
        aria-label="Refresh products"
        className="border-2 border-solid rounded-full hover:text-white hover:bg-black hoverEffect p-2"
      >
        <Repeat size={24} className="w-5 h-5" />
      </button>
    </div>
  );
}
