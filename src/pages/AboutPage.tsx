import Container from "@/components/layout/Container";

export default function AboutPage() {
  return (
    <Container className="max-w-6xl lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">About ClothWear</h1>
      <p className="mb-4">
        ClothWear is a modern clothing store dedicated to providing curated,
        comfortable pieces for everyday life. Founded in 2020, we focus on
        quality fabrics, thoughtful design, and a shopping experience that is
        simple from start to finish.
      </p>
      <p className="mb-4">
        Our team of buyers, designers, and support specialists work to bring you
        collections that balance style and value. Every product is selected with
        care, and every order is handled by real people.
      </p>
      <p>
        At ClothWear, we believe good clothing should feel as good as it looks.
        We are committed to improving our catalog, reducing waste, and delivering
        exceptional value to our customers.
      </p>
    </Container>
  );
}
