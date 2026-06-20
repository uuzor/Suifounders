'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const navLinks = [
  { label: 'Products', href: '/discover' },
  { label: 'Resources', href: '/resources' },
  { label: 'Ecosystem', href: '/ecosystem' },
  { label: 'About', href: '/about' },
];

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-300
        ${scrolled ? 'glass border-b border-white/10' : 'bg-transparent'}
      `}
      data-testid="marketing-navbar"
    >
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group"
            data-testid="marketing-nav-logo"
          >
            <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center">
              <svg 
                className="w-6 h-6 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-outfit text-xl font-semibold text-white group-hover:text-gray-200 transition-colors">
              StartupFund
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                data-testid={`marketing-nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href="/discover"
            className="bg-accent-primary text-white px-6 py-2 rounded-none hover:bg-accent-hover font-medium text-sm transition-colors"
            data-testid="marketing-nav-launch-app"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
