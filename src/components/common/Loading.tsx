import { motion } from "motion/react";
import { LuLoaderCircle as Loader2 } from "react-icons/lu";
import Logo from "@/components/layout/Logo";

export default function Loading() {
  return (
    <div className="fixed min-h-screen w-full bg-white left-0 top-0 flex items-center justify-center">
      <div className="flex flex-col justify-center items-center gap-1">
        <Logo className="italic">ClothsWear</Logo>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex items-center space-x-2 text-green-800"
        >
          <Loader2 size={24} className="w-4 h-5 animate-spin" />
          <span>ClothWear is Loading</span>
        </motion.div>
      </div>
    </div>
  );
}
