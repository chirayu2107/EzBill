"use client"

import React, { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import {
  Receipt,
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  BarChart3,
  Users,
  Moon,
  Sun,
  ChevronDown,
  Sparkles
} from "lucide-react"
import Button from "../components/UI/Button"

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isAnnual, setIsAnnual] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Scroll-driven 3D perspective animation
  const mockupRef = useRef<HTMLDivElement>(null)
  const [mockupStyle, setMockupStyle] = useState({
    rotateX: 18,
    scale: 0.88,
    translateY: 40,
    opacity: 0.7,
  })

  useEffect(() => {
    const handleScroll = () => {
      if (!mockupRef.current) return
      const rect = mockupRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      // How far the element has come into view (0 = just entered, 1 = center of screen)
      const progress = Math.min(Math.max((windowHeight - rect.top) / (windowHeight * 0.8), 0), 1)
      setMockupStyle({
        rotateX: 18 * (1 - progress),
        scale: 0.88 + 0.12 * progress,
        translateY: 40 * (1 - progress),
        opacity: 0.7 + 0.3 * progress,
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // run once on mount
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const faqs = [
    {
      q: "Is EzBill really free to start?",
      a: "Yes! Our Free plan allows you to create up to 5 invoices per month with standard templates, basic client management, and PDF exports. No credit card required."
    },
    {
      q: "Can I customize the invoices with my own branding?",
      a: "Absolutely! With the Pro plan, you can upload your business logo, custom signatures, choose custom brand colors, and remove the EzBill watermark."
    },
    {
      q: "How does the auto-GST calculation work?",
      a: "When creating an invoice, you can enable GST/IGST with a single click. EzBill will automatically calculate CGST, SGST, or IGST based on your item rates and tax percentages."
    },
    {
      q: "Can I download reports for accounting?",
      a: "Yes, you can generate comprehensive sales reports, purchase bill summaries, and detailed GST reports in CSV format, perfect for file tax returns or sending to your accountant."
    }
  ]

  const features = [
    {
      icon: Receipt,
      title: "Smart Invoicing",
      description: "Create professional invoices in seconds with automated tax, discounts, and grand total calculations."
    },
    {
      icon: BarChart3,
      title: "GST Reports & Analytics",
      description: "Keep track of tax filings with auto-generated GST tax reports and analyze your monthly sales growth."
    },
    {
      icon: Users,
      title: "Client Ledger Sheets",
      description: "Maintain clear debit/credit transaction histories for all your business clients in one centralized hub."
    },
    {
      icon: Shield,
      title: "Expense & Purchase Bills",
      description: "Track your outgoing expenditures and manage supplier bills efficiently alongside your incoming revenues."
    },
    {
      icon: Zap,
      title: "Instant PDF Downloads",
      description: "Generate print-ready PDFs of your invoices with modern layouts, customized styles, and digital signatures."
    },
    {
      icon: Sparkles,
      title: "Custom Brand Templates",
      description: "Infuse your company colors, custom logo, and signature to build high-end client trust."
    }
  ]

  const testimonials = [
    {
      name: "Rohan Sharma",
      role: "Freelance UI Designer",
      quote: "EzBill made billing my clients a breeze. The PDF layout looks incredibly premium, and it takes me less than 2 minutes to send an invoice.",
      rating: 5,
      avatar: "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032406/n4dpb2qiwgwxpfb2kurc.jpg"
    },
    {
      name: "Priya Patel",
      role: "Founder, Bloom Agency",
      quote: "The client ledger feature is a lifesaver! I can track exactly who owes what, and exporting GST reports saves hours of accounting work every month.",
      rating: 5,
      avatar: "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032557/xbkz2uegcbb1k4vw6fqw.jpg"
    },
    {
      name: "Anand Verma",
      role: "Retail Store Owner",
      quote: "Moving from paper books to EzBill has completely digitized our billing process. The interface is clean, dark mode is beautiful, and support is super fast.",
      rating: 5,
      avatar: "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032858/gteqwkdcagqbxjg6aght.avif"
    }
  ]

  return (
    <div className="min-h-screen bg-surface-light dark:bg-[#0C0C0E] text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-x-hidden w-full">
      {/* Decorative Orbs — dark mode only */}
      <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-transparent dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-transparent dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/60 dark:bg-[#0C0C0E]/80 border-b border-white/20 dark:border-white/[0.04] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Receipt className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              EzBill
            </span>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg text-gray-500 dark:text-[#8B8B96] hover:bg-gray-100 dark:hover:bg-[#212124] transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="accent" size="sm">
                  <span className="hidden sm:inline">Go to </span>Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/login" className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Sign In
                </Link>
                <Link to="/signup">
                  <Button variant="accent" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-36 md:pb-32 px-4 sm:px-6 max-w-7xl mx-auto z-10 text-center">

        <h1 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-3xl sm:text-5xl md:text-[4.5rem] font-black tracking-[-0.02em] sm:tracking-[-0.03em] mb-4 sm:mb-6 max-w-3xl mx-auto leading-[1.12] sm:leading-[1.08] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
          Professional Invoicing{" "}
          <br className="hidden sm:block" />
          &amp; GST{" "}
          <span className="bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent whitespace-nowrap">Billing Made Simple</span>
        </h1>

        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0">
          Create premium invoices, track purchase bills, manage client ledger sheets, and export automated GST reports in a unified SaaS interface.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16 px-2 sm:px-0">
          {isAuthenticated ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="accent" size="lg" className="w-full sm:w-auto">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="accent" size="lg" className="w-full sm:w-auto">
                  Start Billing Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-white/50 dark:bg-[#1A1A1D]/80 backdrop-blur-sm">
                  Schedule Demo
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Dashboard Mockup Preview — Scroll-driven 3D unfold */}
        <div
          ref={mockupRef}
          style={{ perspective: "1200px" }}
          className="relative mx-auto max-w-5xl px-2 sm:px-0"
        >
          {/* Glow base — dark mode only */}
          <div
            className="absolute -inset-6 rounded-3xl blur-3xl pointer-events-none hidden dark:block"
            style={{
              background: "radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0.08) 50%, transparent 75%)",
              transform: `translateY(${mockupStyle.translateY * 0.5}px)`,
              opacity: mockupStyle.opacity,
              transition: "transform 0.05s linear, opacity 0.05s linear",
            }}
          />

          <div
            style={{
              transform: `rotateX(${mockupStyle.rotateX}deg) scale(${mockupStyle.scale}) translateY(${mockupStyle.translateY}px)`,
              opacity: mockupStyle.opacity,
              transition: "transform 0.05s linear, opacity 0.05s linear",
              transformOrigin: "50% 0%",
              willChange: "transform, opacity",
            }}
            className="rounded-2xl border border-gray-200 dark:border-white/[0.04] bg-white dark:bg-[#141416] p-1.5 shadow-xl shadow-gray-300/30 dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)]"
          >
            <div className="rounded-xl overflow-hidden">
              <img
                src={
                  theme === "dark"
                    ? "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1781382931/b4sbmxypebypu6dgqbru.png"
                    : "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1781378408/hpzq3yvz0mxuegdv9phv.png"
                }
                alt="EzBill SaaS App Mockup"
                className="w-full h-auto object-cover block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04] bg-gray-50/50 dark:bg-[#141416]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
              Everything you need to power your business
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-sm md:text-base">
              A comprehensive billing app built specifically for modern merchants, service agencies, and freelancers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/[0.04] bg-white dark:bg-[#1A1A1D] hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:border-white/[0.06] dark:hover:bg-[#212124] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Interactive Pricing Toggle */}
      <section id="pricing" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
            Transparent Pricing Plans
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm mb-8">
            Pick the plan that suits your billing capacity. Upgrade or downgrade anytime.
          </p>

          {/* Toggle Switch */}
          <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-[#1A1A1D] p-1 rounded-full border border-gray-200/50 dark:border-white/[0.04]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !isAnnual
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Annually
              <span className="bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/[0.04] bg-white/80 dark:bg-[#1A1A1D] flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Free Tier</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$0</span>
                  <span className="text-gray-500 text-sm">/ month</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Perfect for freelancers and side-hustlers just getting started with client invoicing.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Create up to 5 invoices / month",
                  "Standard invoice templates",
                  "Auto GST calculation support",
                  "Client ledger sheets",
                  "Single business profile"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              <Button variant="secondary" className="w-full">
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Button>
            </Link>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-emerald-500 bg-white dark:bg-[#1A1A1D] shadow-xl shadow-emerald-500/5 flex flex-col justify-between relative">
            <span className="absolute top-0 right-8 transform -translate-y-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Pro Tier</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {isAnnual ? "$12" : "$15"}
                  </span>
                  <span className="text-gray-500 text-sm">/ month</span>
                </div>
                {isAnnual && (
                  <span className="text-emerald-500 text-[11px] font-medium block mt-1">
                    Billed annually ($144 / year)
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Designed for expanding companies, agencies, and retail shops looking for unlimited invoicing capacity.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited invoices & purchase bills",
                  "Premium brand-colored templates",
                  "Custom logo & signature uploads",
                  "GST tax spreadsheets & CSV report downloads",
                  "Advanced business analytics",
                  "Priority customer support"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              <Button variant="accent" className="w-full">
                {isAuthenticated ? "Go to Dashboard" : "Upgrade to Pro"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04] bg-gray-50/50 dark:bg-[#141416]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
              Trusted by 500+ businesses worldwide
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto text-sm">
              Read how billing is simplified for teams, agencies, and retail merchants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((test, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-gray-200 dark:border-white/[0.04] bg-white dark:bg-[#1A1A1D] shadow-sm hover:shadow-md dark:hover:border-white/[0.06] transition-all duration-300"
              >
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(test.rating)].map((_, index) => (
                    <Star key={index} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 italic">
                  "{test.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={test.avatar}
                    alt={test.name}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{test.name}</h4>
                    <span className="text-[11px] text-gray-500">{test.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion FAQs */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-6 sm:mb-8 text-center text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-white/[0.04] rounded-2xl bg-white dark:bg-[#1A1A1D] overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#212124] transition-all duration-200"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                    activeFaq === i ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              {activeFaq === i && (
                <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-white/[0.04] leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-6 sm:p-8 md:p-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 text-white text-center relative overflow-hidden shadow-xl shadow-emerald-500/10">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-1/3 -left-10 w-[300px] h-[300px] bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight text-white">
              Ready to automate your billing process?
            </h2>
            <p className="text-emerald-50/90 mb-8 sm:mb-10 max-w-lg mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
              Join hundreds of merchants who spend less time doing accounting and more time growing their sales numbers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto !bg-white hover:!bg-gray-50 !text-emerald-700 !border-white !shadow-lg">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto !bg-white hover:!bg-gray-50 !text-emerald-700 !border-white !shadow-lg">
                      Create Your Free Account
                    </Button>
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto !bg-transparent !border-2 !border-white !text-white hover:!bg-white/15 hover:!border-white">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 border-t border-gray-200/50 dark:border-white/[0.04] bg-gray-50/50 dark:bg-[#141416]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-green-600 rounded-md flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-700 dark:text-gray-300">EzBill</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <Link to="/privacy" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Terms of Service</Link>
            <a href="mailto:support@ezbill.app" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">Contact Support</a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} EzBill. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
