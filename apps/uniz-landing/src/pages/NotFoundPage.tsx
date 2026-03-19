import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container py-20 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Link to="/" className="text-primary hover:underline font-medium">
        Go back home
      </Link>
    </div>
  );
}
