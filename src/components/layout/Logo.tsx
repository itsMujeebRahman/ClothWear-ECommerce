import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Logo({ children, className }: Props) {
  return (
    <Link to="/">
      <h2
        className={cn(
          "text-2xl text-black font-black tracking-wider uppercase",
          className,
        )}
      >
        {children}
      </h2>
    </Link>
  );
}
