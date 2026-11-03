import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { LuX as X } from "react-icons/lu";
import Logo from "./Logo";
import SocialMedia from "./SocialMedia";
import { useSidebarOutClick } from "@/hooks/useSidebarOutClick";
import type { Category } from "@/types/sanity.types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export default function Sidebar({
  isOpen,
  onClose,
  categories,
}: SidebarProps) {
  const { pathname } = useLocation();
  const sidebarRef = useSidebarOutClick<HTMLDivElement>(onClose);

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-gray-950/50 shadow-xl hoverEffect cursor-auto w-full
    ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        ref={sidebarRef}
        className="min-w-72 max-w-96 bg-gray-950 text-white/70 h-full p-10 border-r
      border-r-white flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <button onClick={onClose}>
            <Logo className="text-white italic">ClothsWear</Logo>
          </button>
          <button className="hover:text-red-500 hoverEffect" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col gap-3.5 text-base font-semibold tracking-wide">
          <Link
            onClick={onClose}
            to="/"
            className={`hover:text-white hoverEffect w-18 relative group ${
              pathname === "/" ? "text-white" : ""
            }`}
          >
            Home
          </Link>
          {categories.map((category) => {
            const href = `/category/${category.slug?.current ?? ""}`;
            return (
              <Link
                onClick={onClose}
                key={category._id}
                to={href}
                className={`hover:text-white hoverEffect w-18 relative group ${
                  pathname === href ? "text-white" : ""
                }`}
              >
                {category.title}
              </Link>
            );
          })}
        </div>
        <SocialMedia />
      </motion.div>
    </div>
  );
}
