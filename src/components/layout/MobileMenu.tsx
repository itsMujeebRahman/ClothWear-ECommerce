import { useState } from "react";
import { LuAlignLeft as AlignLeft } from "react-icons/lu";
import Sidebar from "./Sidebar";
import type { Category } from "@/types/sanity.types";

export default function MobileMenu({ categories }: { categories: Category[] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <AlignLeft size={24} className="hover:text-black hoverEffect md:hidden" />
      </button>
      <div className="md:hidden">
        <Sidebar
          categories={categories}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </>
  );
}
