import { useParams } from "react-router-dom";
import Container from "@/components/layout/Container";
import Title from "@/components/common/Title";
import CategoryProducts from "@/components/product/CategoryProducts";
import NoProductsAvailable from "@/components/product/NoProductsAvailable";
import { useCategories } from "@/hooks/useCategories";

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const { categories, loading, error } = useCategories();

  return (
    <Container className="py-10">
      <Title className="text-xl">
        Products by Category{" "}
        <span className="font-bold text-green-600 capitalize tracking-wide">
          {slug}
        </span>
      </Title>
      {loading ? (
        <div className="mt-10 flex min-h-80 items-center justify-center rounded-lg bg-gray-100">
          <p className="text-gray-600">Loading categories...</p>
        </div>
      ) : error ? (
        <div className="mt-10 flex min-h-80 items-center justify-center rounded-lg bg-gray-100 text-center">
          <p className="text-gray-700">{error}</p>
        </div>
      ) : categories.length ? (
        <CategoryProducts categories={categories} slug={slug} />
      ) : (
        <NoProductsAvailable selectedTab={slug} />
      )}
    </Container>
  );
}
