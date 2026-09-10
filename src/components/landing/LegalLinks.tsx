import { Link } from "@tanstack/react-router";

export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav className={className}>
      <Link
        to="/mentions-legales"
        className="transition-colors hover:text-foreground"
      >
        Mentions légales
      </Link>
      <Link to="/cgu" className="transition-colors hover:text-foreground">
        CGU
      </Link>
      <Link to="/cgv" className="transition-colors hover:text-foreground">
        CGV
      </Link>
      <Link
        to="/confidentialite"
        className="transition-colors hover:text-foreground"
      >
        Confidentialité
      </Link>
    </nav>
  );
}
