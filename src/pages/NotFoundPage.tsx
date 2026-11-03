import { Link } from "react-router-dom";
import Container from "@/components/layout/Container";

export default function NotFoundPage() {
  return (
    <Container className="py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-gray-600">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full border border-black/30 px-6 py-2.5 text-sm font-semibold hover:bg-black hover:text-white hoverEffect"
      >
        Back to Home
      </Link>
    </Container>
  );
}
