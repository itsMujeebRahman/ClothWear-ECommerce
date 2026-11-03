import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Title from "@/components/common/Title";

gsap.registerPlugin(ScrollTrigger);

export default function HomeBanner() {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner) {
      return;
    }

    const [title, paragraph] = Array.from(banner.children);

    gsap.from(title, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out",
    });

    gsap.from(paragraph, {
      opacity: 0,
      y: 30,
      delay: 0.3,
      duration: 1,
      ease: "power3.out",
    });

    const scrollAnimation = gsap.from(banner, {
      scrollTrigger: {
        trigger: banner,
        start: "top 80%",
        toggleActions: "play none none none",
      },
      opacity: 0,
      y: 40,
      duration: 1.2,
      ease: "power2.out",
    });

    return () => {
      scrollAnimation.scrollTrigger?.kill();
      scrollAnimation.kill();
    };
  }, []);

  return (
    <div
      ref={bannerRef}
      className="flex flex-col items-center justify-center gap-2"
    >
      <Title className="text-3xl md:text-4xl uppercase font-bold text-center flex flex-row">
        Best Clothing collections
      </Title>
      <p className="text-sm text-center text-gray-500/80 font-medium max-w-[480px] hover:text-gray-600">
        Find everything you need to look and feel your best, and shop the latest
        men&apos;s fashion and lifestyle products.
      </p>
    </div>
  );
}
