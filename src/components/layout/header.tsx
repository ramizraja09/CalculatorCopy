import { Calculator } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Calculator className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-bold text-foreground">top100calculators</span>
        </Link>
      </div>
    </header>
  );
}
