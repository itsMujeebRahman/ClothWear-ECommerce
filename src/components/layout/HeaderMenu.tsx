import { Link, useLocation } from "react-router-dom";
import type { Category } from "@/types/sanity.types";

export default function HeaderMenu({ categories }: { categories: Category[] }) {
  const { pathname } = useLocation();

  return (
    <div className="hidden md:inline-flex w-1/3 items-center gap-5 text-sm capitalize font-semibold text-gray-500">
      <Link
        to="/"
        className={`hover:text-black hoverEffect relative group ${
          pathname === "/" ? "" : ""
        }`}
      >
        Home
        <span
          className={`absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-black hoverEffect group-hover:w-1/2 group-hover:left-0
                ${pathname === "/" ? "w-1/2" : ""}`}
        />
        <span
          className={`absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-black hoverEffect group-hover:w-1/2 group-hover:right-0
                ${pathname === "/" ? "w-1/2" : ""}`}
        />
      </Link>

      {categories.map((category) => {
        const href = `/category/${category.slug?.current ?? ""}`;
        const active = pathname === href;

        return (
          <Link
            key={category._id}
            to={href}
            className={`hover:text-black hoverEffect relative group ${
              active ? "" : ""
            }`}
          >
            {category.title}
            <span
              className={`absolute -bottom-0.5 left-1/2 w-0 h-0.5 bg-black hoverEffect group-hover:w-1/2 group-hover:left-0
                ${active ? "w-1/2" : ""}`}
            />
            <span
              className={`absolute -bottom-0.5 right-1/2 w-0 h-0.5 bg-black hoverEffect group-hover:w-1/2 group-hover:right-0
                ${active ? "w-1/2" : ""}`}
            />
          </Link>
        );
      })}
    </div>
  );
}
