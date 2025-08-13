
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  return (
    <footer className="bg-muted/50 border-t mt-auto">
      <div className="container max-w-screen-2xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground" suppressHydrationWarning={true}>
            &copy; {currentYear || new Date().getFullYear()} My Genius Calculator. All rights reserved.
          </p>
          <nav className="flex gap-4 md:gap-6 flex-wrap justify-center">
            <Link href="/list" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Full List
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/accessibility" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Accessibility
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
