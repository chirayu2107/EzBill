"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Sparkles,
  ShoppingBag,
  Package,
  Briefcase,
  UtensilsCrossed,
  Pencil,
  Globe,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Button from "../components/UI/Button"

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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 120 : -120,
    opacity: 0,
  }),
}

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { theme, resetToSystem } = useTheme()
  const [isAnnual, setIsAnnual] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [direction, setDirection] = useState(1)

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setActiveTestimonial((prev) => (prev + newDirection + testimonials.length) % testimonials.length)
  }

  // Landing page always follows the OS — clear any manual override when visiting
  useEffect(() => {
    resetToSystem()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Auto-swipe testimonials every 5 seconds (resets timer on manual click)
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeTestimonial])



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

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="accent" size="sm">
                  <span>
                    <span className="hidden sm:inline">Go to </span>
                    Dashboard
                  </span>
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
      <section id="features" className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Centered header */}
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white sm:whitespace-nowrap">
              Everything you need to power your business
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed">
              A comprehensive billing app built specifically for modern merchants, service agencies, and freelancers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="group">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">{feature.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-2 transition-all cursor-default">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </span>
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
      <section className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">

            <div className="w-full md:w-[40%] flex-shrink-0">
              <div className="relative overflow-hidden min-h-[300px] sm:min-h-[235px]">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.25 }
                    }}
                    className="absolute inset-0 flex flex-col justify-between pb-2"
                  >
                    <div>
                      <div className="flex gap-1 mb-5">
                        {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      <blockquote className="text-xl sm:text-2xl leading-snug text-gray-900 dark:text-white mb-7">
                        "{testimonials[activeTestimonial].quote}"
                      </blockquote>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={testimonials[activeTestimonial].avatar}
                        alt={testimonials[activeTestimonial].name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{testimonials[activeTestimonial].name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{testimonials[activeTestimonial].role}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Prev / Next controls at the bottom (Static) */}
              <div className="flex items-center justify-end gap-2 mt-6 border-t border-gray-150/40 dark:border-white/[0.04] pt-4">
                <button
                  onClick={() => paginate(-1)}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-white/[0.15] flex items-center justify-center hover:border-gray-400 dark:hover:border-white/[0.3] transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => paginate(1)}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-white/[0.15] flex items-center justify-center hover:border-gray-400 dark:hover:border-white/[0.3] transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Right: Photo collage — takes remaining space */}
            <div className="hidden md:grid grid-cols-6 gap-3 items-start flex-1 min-w-0 pointer-events-none">
              {/* Row 1: Top images */}
              <img
                src="https://www.untitledui.com/react/marketing/testimonial-abstract-image-01.webp"
                alt=""
                className="col-start-2 col-span-2 row-start-1 w-full h-[180px] object-cover object-center self-end"
              />
              <img
                src="https://www.untitledui.com/react/marketing/smiling-girl-3.webp"
                alt=""
                className="col-start-4 col-span-2 row-start-1 w-full h-[220px] object-cover object-center self-end"
              />

              {/* Row 2: Bottom images */}
              <img
                src="https://www.untitledui.com/react/marketing/ai-woman-03.webp"
                alt=""
                className="col-start-1 col-span-2 row-start-2 w-full h-[130px] object-cover object-center self-start"
              />
              <img
                src="https://www.untitledui.com/react/marketing/two-standing-women.webp"
                alt=""
                className="col-start-3 col-span-2 row-start-2 w-full h-[280px] object-cover object-top self-start"
              />
              <img
                src="https://www.untitledui.com/react/marketing/smiling-girl-8.webp"
                alt=""
                className="col-start-5 col-span-2 row-start-2 w-full h-[130px] object-cover object-center self-start"
              />
            </div>

          </div>
        </div>
      </section>


      {/* Accordion FAQs */}
      <section id="faq" className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
              Frequently asked questions
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
              Everything you need to know about the product and billing.
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-white/[0.06]">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left text-sm sm:text-base font-semibold text-gray-900 dark:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="ml-4 flex-shrink-0 w-6 h-6 rounded-full border border-gray-300 dark:border-white/[0.2] flex items-center justify-center">
                    <span className={`text-sm font-light leading-none text-gray-400 dark:text-gray-500 transition-transform duration-300 inline-block ${
                      activeFaq === i ? "rotate-45" : ""
                    }`}>
                      +
                    </span>
                  </span>
                </button>
                {activeFaq === i && (
                  <div className="pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 border-t border-gray-200/50 dark:border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">

            {/* Left: Text + Buttons */}
            <div className="flex-1 max-w-lg">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3 leading-tight text-gray-900 dark:text-white">
                Join over <span className="text-emerald-600 dark:text-emerald-400">500+</span> businesses<br />
                growing with EzBill
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-7 leading-relaxed">
                Start invoicing professionally today. No credit card required.
              </p>
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button variant="accent" size="md" className="shadow-md shadow-emerald-500/20 font-semibold">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="secondary" size="md" className="font-semibold">
                        Sign in
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button variant="accent" size="md" className="shadow-md shadow-emerald-500/20 font-semibold">
                        Get started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right: Trusted-by brand grid */}
            <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-4 max-w-md w-full">
              {[
                { icon: ShoppingBag,     name: "Retail Shops" },
                { icon: Package,         name: "Logistics" },
                { icon: Briefcase,       name: "Agencies" },
                { icon: UtensilsCrossed, name: "Restaurants" },
                { icon: Pencil,          name: "Freelancers" },
                { icon: Globe,           name: "E-commerce" },
              ].map(({ icon: Icon, name }) => (
                <div
                  key={name}
                  className="flex items-center gap-2 group"
                >
                  <Icon className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors whitespace-nowrap">
                    {name}
                  </span>
                </div>
              ))}
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
