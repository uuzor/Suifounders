'use client';

import { MarketingNavbar } from '@/components/MarketingNavbar';
import { 
  Shield, 
  Globe, 
  Lock, 
  TrendingUp, 
  Users, 
  Building2,
  ChevronRight,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const heroImage = "https://images.unsplash.com/photo-1644088379091-d574269d422f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGZpbmFuY2UlMjBkYXRhJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODEzNTM5MzV8MA&ixlib=rb-4.1.0&q=85";

const trustLogos = [
  { name: 'Chainlink', icon: '🔗' },
  { name: 'OpenZeppelin', icon: '🛡️' },
  { name: 'Certik', icon: '✓' },
  { name: 'Sui Network', icon: '◎' },
  { name: 'PwC', icon: 'P' },
];

const productCards = [
  {
    title: 'Startup Registry',
    description: 'On-chain registration for MVPs with Walrus storage integration. Transparent and verifiable startup credentials.',
    icon: Building2,
    href: '/discover',
  },
  {
    title: 'Revenue Tokens',
    description: 'Equity-share tokens that represent ownership in startups. Tradeable with full governance rights.',
    icon: TrendingUp,
    href: '/discover',
  },
  {
    title: 'Funding Pools',
    description: 'Decentralized funding with milestone-based releases. Investors retain control through governance.',
    icon: Lock,
    href: '/discover',
  },
  {
    title: 'Token Marketplace',
    description: 'OpenSea-style trading for startup tokens. Fixed prices, auctions, and direct offers.',
    icon: Globe,
    href: '/marketplace',
  },
];

const metrics = [
  { value: '$1B+', label: 'Total Value Locked' },
  { value: '250+', label: 'Startups Registered' },
  { value: '50K+', label: 'Active Investors' },
];

const features = [
  'Institutional-grade security with multi-sig controls',
  'Regulatory compliant smart contracts audited by top firms',
  'Real-time on-chain settlement and verification',
  'Cross-chain liquidity through Sui ecosystem',
  'Automated compliance and KYC integration',
  'Enterprise API for seamless integration',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/80" />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-borders opacity-30" />

        {/* Content */}
        <div className="relative z-10 max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 py-32 lg:py-40 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Overline */}
            <p 
              className="text-overline text-accent-primary mb-6 animate-fade-in"
              data-testid="hero-overline"
            >
              Built on Sui Blockchain
            </p>

            {/* Headline */}
            <h1 
              className="text-4xl sm:text-5xl lg:text-7xl tracking-tighter font-medium font-outfit mb-8 animate-slide-up"
              style={{ animationDelay: '0.1s' }}
              data-testid="hero-headline"
            >
              <span className="text-white">Institutional-Grade Finance,</span>
              <br />
              <span className="text-gradient-accent">Onchain.</span>
            </h1>

            {/* Subheadline */}
            <p 
              className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-up leading-relaxed"
              style={{ animationDelay: '0.2s' }}
              data-testid="hero-subheadline"
            >
              Explore tokenized real-world assets and yield products built for the enterprise. 
              Secure, transparent, and regulatory compliant.
            </p>

            {/* CTAs */}
            <div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              <a
                href="/discover"
                className="group flex items-center gap-2 bg-accent-primary text-white px-8 py-4 hover:bg-accent-hover transition-all duration-300"
                data-testid="hero-cta-primary"
              >
                <span className="font-medium">Launch App</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/docs"
                className="flex items-center gap-2 border border-white/20 text-white px-8 py-4 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
                data-testid="hero-cta-secondary"
              >
                <span>Read Documentation</span>
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-white/10 py-12 bg-surface">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <p className="text-center text-xs tracking-[0.2em] uppercase font-semibold text-gray-500 mb-8">
            Trusted by leading institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
            {trustLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                data-testid={`trust-logo-${logo.name.toLowerCase()}`}
              >
                <span className="text-3xl">{logo.icon}</span>
                <span className="text-lg font-medium text-white">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Suite */}
      <section className="py-20 lg:py-32">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-overline text-accent-primary mb-4">Product Suite</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium font-outfit text-white mb-6">
              Enterprise Financial Infrastructure
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A complete ecosystem for startup tokenization, from registration to secondary trading.
            </p>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {productCards.map((card, index) => (
              <a
                key={card.title}
                href={card.href}
                className="group bg-surface border border-white/10 p-8 flex flex-col gap-4 hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`product-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="w-12 h-12 bg-accent-primary/10 rounded-lg flex items-center justify-center group-hover:bg-accent-primary/20 transition-colors">
                  <card.icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="text-lg font-medium text-white font-outfit">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-grow">
                  {card.description}
                </p>
                <div className="flex items-center gap-2 text-accent-primary text-sm font-medium group-hover:gap-3 transition-all">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 lg:py-32 bg-surface border-y border-white/10">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className="text-center"
                data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <p 
                  className="text-5xl md:text-6xl lg:text-7xl font-mono font-semibold text-white mb-4"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {metric.value}
                </p>
                <p className="text-sm tracking-[0.2em] uppercase font-semibold text-gray-500">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text */}
            <div>
              <p className="text-overline text-accent-primary mb-4">Why Choose Us</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium font-outfit text-white mb-8">
                Built for Institutional Adoption
              </h2>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3"
                    data-testid={`feature-${index + 1}`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-accent-primary mt-0.5 flex-shrink-0" />
                    <p className="text-gray-400">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="aspect-square bg-surface border border-white/10 p-8 relative overflow-hidden">
                {/* Grid overlay */}
                <div className="absolute inset-0 grid-borders opacity-20" />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-center">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-surface-elevated border border-white/10">
                      <span className="text-gray-400">Security Rating</span>
                      <span className="text-2xl font-mono font-semibold text-accent-primary">AAA</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface-elevated border border-white/10">
                      <span className="text-gray-400">Audited By</span>
                      <span className="text-lg font-medium text-white">OpenZeppelin</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface-elevated border border-white/10">
                      <span className="text-gray-400">Chain</span>
                      <span className="text-lg font-medium text-white">Sui Network</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface-elevated border border-white/10">
                      <span className="text-gray-400">Compliance</span>
                      <span className="text-lg font-medium text-white">SOC 2 Certified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border border-accent-primary/30" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-accent-primary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-surface border-t border-white/10">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium font-outfit text-white mb-6">
            Ready to Transform Your Startup?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            Join the next generation of on-chain finance. Register your startup, 
            raise capital, and unlock new possibilities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/discover"
              className="flex items-center gap-2 bg-accent-primary text-white px-8 py-4 hover:bg-accent-hover transition-all duration-300"
              data-testid="cta-launch"
            >
              <span className="font-medium">Launch App</span>
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/contact"
              className="flex items-center gap-2 border border-white/20 text-white px-8 py-4 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
            >
              <Users className="w-5 h-5" />
              <span>Contact Sales</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-16">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {/* Logo & Description */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
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
                <span className="font-outfit text-xl font-semibold text-white">
                  StartupFund
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Institutional-grade finance, onchain.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/discover" className="hover:text-white transition-colors">Discover</a></li>
                <li><a href="/marketplace" className="hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="/governance" className="hover:text-white transition-colors">Governance</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/api" className="hover:text-white transition-colors">API</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-xs text-gray-600 leading-relaxed pt-8 border-t border-white/10">
            <p className="mb-4">
              <strong className="text-gray-500">Disclaimer:</strong> StartupFund is a decentralized 
              finance platform built on the Sui blockchain. All investments in tokenized startups carry 
              inherent risks including but not limited to: smart contract vulnerability, market volatility, 
              regulatory uncertainty, and total loss of invested capital.
            </p>
            <p className="mb-4">
              The platform does not provide financial advice. Users should conduct their own due 
              diligence and consult with qualified financial advisors before making any investment decisions.
            </p>
            <p>
              © 2024 StartupFund. All rights reserved. Built on Sui Network.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
