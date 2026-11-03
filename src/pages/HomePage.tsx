import Container from "@/components/layout/Container";
import HomeBanner from "@/components/home/HomeBanner";
import ProductGrid from "@/components/product/ProductsGrid";

export default function HomePage() {
  return (
    <div>
      <Container className="py-6">
        <HomeBanner />
        <ProductGrid />
      </Container>
    </div>
  );
}
