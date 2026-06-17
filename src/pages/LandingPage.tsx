"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import {
  ArrowRight,
  Check,
  Star,
  ShoppingBag,
  Package,
  Briefcase,
  UtensilsCrossed,
  Pencil,
  Globe,
  Download,
  Loader2,
  Mail,
  MessageSquare,
  Printer,
  TrendingUp,
  Cloud
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

// Scroll-triggered "come forward" animation
const fadeUp = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { theme, resetToSystem } = useTheme()
  const location = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sectionId = location.pathname.substring(1) // "features", "pricing", "faq"
    if (sectionId === "features" || sectionId === "pricing" || sectionId === "faq") {
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
      return () => clearTimeout(timer)
    } else if (location.pathname === "/") {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [location])
  const [isAnnual, setIsAnnual] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [direction, setDirection] = useState(1)

  // Interactive Bento states
  const [calcItems, setCalcItems] = useState([true, true, false])
  const [calcTax, setCalcTax] = useState(18) // GST percentage
  const [previewTheme, setPreviewTheme] = useState<'slate' | 'mint' | 'coral'>('slate')
  const [pdfState, setPdfState] = useState<'idle' | 'downloading' | 'completed'>('idle')
  const [isScrolled, setIsScrolled] = useState(false)

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
    const container = scrollContainerRef.current
    if (!container) return
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
      setIsScrolled(container.scrollTop > 20)
    }
    container.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // run once on mount
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  // Auto-swipe testimonials every 5 seconds (resets timer on manual click)
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeTestimonial])

  const handlePdfDownload = () => {
    if (pdfState !== 'idle') return
    setPdfState('downloading')
    setTimeout(() => {
      setPdfState('completed')
      setTimeout(() => {
        setPdfState('idle')
      }, 2000)
    }, 1200)
  }

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto overflow-x-hidden bg-surface-light dark:bg-[#000000] text-gray-900 dark:text-gray-100 transition-colors duration-300 w-full" style={{ overscrollBehaviorY: 'none' }}>
      {/* Decorative Orbs — dark mode only */}
      <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-transparent dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-transparent dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "backdrop-blur-xl bg-white/60 dark:bg-[#000000]/80 border-b border-white/20 dark:border-white/[0.04]" 
          : "bg-transparent border-b border-transparent backdrop-blur-none"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/EzBill.png?v=3" alt="EzBill" className="w-9 h-9 shadow-lg shadow-blue-600/25 shrink-0" />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              EzBill
            </span>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Link to="/features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link>
            <Link to="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</Link>
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
                <Link to="/login" className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Sign In
                </Link>
                <Link to="/login">
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
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 md:pt-48 md:pb-32 px-4 sm:px-6 z-10 text-center overflow-hidden">
        {/* Grid Background with fade-out mask starting around the mockup */}
        <div className="absolute inset-x-0 top-0 h-[650px] ez-grid-bg pointer-events-none z-0" style={{
          maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15)_0%,rgba(37,99,235,0.05)_40%,transparent_70%)] pointer-events-none z-0" />

        <div className="relative max-w-7xl mx-auto z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 variants={fadeUp} style={{ fontFamily: "'Inter', sans-serif" }} className="text-4xl sm:text-6xl md:text-[5.5rem] font-bold tracking-[-0.035em] leading-[1.1] pb-3 mb-3 max-w-4xl mx-auto text-gray-900 dark:text-white">
              Unleash the power of<br />
              <span className="inline-block pb-3 bg-gradient-to-b from-zinc-600 to-zinc-400 dark:from-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">intuitive invoicing</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base md:text-[1.125rem] max-w-3xl mx-auto mb-10 leading-relaxed px-2 sm:px-0">
              Say goodbye to outdated billing systems. Every small business owner, regardless of background, can now manage invoicing, credit ledgers, and tax compliance like a pro. Simple. Intuitive. Professional.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-24 px-2 sm:px-0">
            {isAuthenticated ? (
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-full shadow-lg shadow-blue-600/20 btn-shine hover:scale-[1.02] transition-transform duration-200">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto rounded-full shadow-lg shadow-blue-600/20 btn-shine hover:scale-[1.02] transition-transform duration-200">
                    Start Billing Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full bg-white/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.04] text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all backdrop-blur-sm hover:scale-[1.02]">
                    Schedule Demo
                  </Button>
                </Link>
              </>
            )}
            </motion.div>
          </motion.div>

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
                background: "radial-gradient(ellipse at 50% 80%, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.05) 50%, transparent 75%)",
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
              className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] bg-[#fafafa] dark:bg-[#070708] p-1 shadow-xl shadow-gray-200/20 dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.85)]"
            >
              {/* Dashboard Screenshot with Cobalt gloss edges */}
              <div className="relative rounded-xl overflow-hidden">
                {/* Screenshot */}
                <img
                  src={
                    theme === "dark"
                      ? "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1781382931/b4sbmxypebypu6dgqbru.png"
                      : "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1781378408/hpzq3yvz0mxuegdv9phv.png"
                  }
                  alt="EzBill Dashboard"
                  className="w-full h-auto object-cover block"
                />

                {/* ── Cobalt-style diagonal corner glows ── */}

                {/* Top-right corner glow */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 0,
                    right: 0,
                    width: "45%",
                    height: "45%",
                    background: theme === "dark"
                      ? "radial-gradient(ellipse at top right, rgba(180,200,255,0.13) 0%, rgba(120,160,255,0.06) 35%, transparent 70%)"
                      : "radial-gradient(ellipse at top right, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 35%, transparent 70%)",
                  }}
                />

                {/* Bottom-left corner glow */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: 0,
                    left: 0,
                    width: "45%",
                    height: "45%",
                    background: theme === "dark"
                      ? "radial-gradient(ellipse at bottom left, rgba(180,200,255,0.10) 0%, rgba(120,160,255,0.05) 35%, transparent 70%)"
                      : "radial-gradient(ellipse at bottom left, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.14) 35%, transparent 70%)",
                  }}
                />

                {/* Top-edge 1px shine line */}
                <div
                  className="absolute inset-x-0 top-0 h-px pointer-events-none"
                  style={{
                    background: theme === "dark"
                      ? "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.22) 65%, rgba(255,255,255,0.10) 85%, transparent 100%)"
                      : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.9) 65%, rgba(255,255,255,0.6) 85%, transparent 100%)",
                  }}
                />

                {/* Bottom fade — image fades into page bg */}
                <div
                  className="absolute inset-x-0 bottom-0 h-[22%] pointer-events-none"
                  style={{
                    background: theme === "dark"
                      ? "linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)"
                      : "linear-gradient(0deg, rgba(248,250,252,0.92) 0%, rgba(248,250,252,0.4) 55%, transparent 100%)",
                  }}
                />

                {/* Inner border gloss ring */}
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    boxShadow: theme === "dark"
                      ? "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), inset 1px 0 rgba(255,255,255,0.04), inset -1px 0 rgba(255,255,255,0.04)"
                      : "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.06), inset 1px 0 rgba(255,255,255,0.5), inset -1px 0 rgba(255,255,255,0.5)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Editorial Section */}
      <section className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04] bg-white dark:bg-[#000000] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
            >
              <motion.h2 variants={fadeUp} style={{ fontFamily: "'Inter', sans-serif" }} className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] pb-2 text-gray-900 dark:text-white">
                Who said billing has to<br />
                <span className="inline-block pb-2 bg-gradient-to-b from-zinc-600 to-zinc-400 dark:from-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">be boring?</span>
              </motion.h2>
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl"
            >
              <p>
                With EzBill, managing your business billing is effortless, empowering, and anything but boring. Our intuitive platform brings clarity to your cash flow, simplifies your financial decision-making, and puts the power of advanced financial management right at your fingertips. <span className="font-medium text-gray-900 dark:text-white">Say no to spreadsheets and tools designed in the 80s.</span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid - Redesigned as an interactive Bento Grid */}
      <section id="features" className="relative py-20 sm:py-28 border-t border-gray-200/50 dark:border-white/[0.04] bg-white dark:bg-[#000000]">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 z-10">
          {/* Left-aligned header to match Cobalt */}
          <motion.div
            className="mb-16 text-left max-w-4xl"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
          >
            <motion.h2 variants={fadeUp} style={{ fontFamily: "'Inter', sans-serif" }} className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] pb-2 mb-6 text-gray-900 dark:text-white">
              Everything you need.<br />
              <span className="inline-block pb-2 bg-gradient-to-b from-zinc-600 to-zinc-400 dark:from-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">Nothing you don't</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
              Professional invoicing and billing in one place. Experience a{" "}
              <span className="text-gray-900 dark:text-white font-medium">flexible billing engine</span> that makes
              client payments feel like a breeze.
            </motion.p>
          </motion.div>

          {/* Asymmetrical Bento Grid - Immersive Product Storytelling Scenes */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 items-stretch"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
          >
            {/* ROW 1: Card 1 - Smart Invoicing (Wide - 2 cols) */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-gradient-to-b from-[#ffffff] to-[#fcfcfd] dark:bg-gradient-to-b dark:from-[#09090b] dark:to-[#030304] border border-gray-200/50 dark:border-white/[0.06] rounded-3xl p-6 sm:p-8 relative min-h-[480px] flex items-center shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_45px_rgba(0,0,0,0.7)] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-500 group overflow-hidden">
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full relative z-10">
                <div className="text-left flex flex-col justify-between h-full py-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">Smart Invoicing</h3>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                      Create professional invoices in seconds with automated tax, custom itemized lists, and grand total calculations. Try it live.
                    </p>
                  </div>
                  <Link to={isAuthenticated ? "/dashboard" : "/login"} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors w-fit">
                    Create free invoice <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="relative w-full flex items-center justify-center py-6">
                  {/* Widget removed per request */}

                  <div className="w-full max-w-[280px] bg-white/60 dark:bg-[#121216]/80 border border-gray-200/80 dark:border-white/[0.06] rounded-xl p-4 flex flex-col justify-between shadow-2xl backdrop-blur-xl relative z-10 transition-all duration-500">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200/60 dark:border-white/[0.04] mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-800 dark:text-gray-300">Draft Invoice #082</span>
                        </div>
                        <span className="text-[8px] font-semibold bg-gray-500/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Loader2 className="w-2 h-2 animate-spin"/> Engine</span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {[
                          { id: 0, label: "Web UI Design", price: 1200 },
                          { id: 1, label: "Cloud Hosting Set", price: 300 },
                          { id: 2, label: "Consulting Services", price: 500 },
                        ].map((item) => (
                          <label key={item.id} className={`flex items-center justify-between p-2 rounded-lg border text-[10px] cursor-pointer select-none transition-all duration-200 ${
                            calcItems[item.id]
                              ? "bg-zinc-50/50 dark:bg-white/[0.03] border-zinc-400/50 dark:border-white/[0.15] text-gray-900 dark:text-white shadow-sm"
                              : "bg-transparent border-gray-200/40 dark:border-white/[0.02] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/[0.06] hover:bg-gray-50/40 dark:hover:bg-white/[0.01]"
                          }`}>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={calcItems[item.id]}
                                onChange={() => {
                                  const updated = [...calcItems];
                                  updated[item.id] = !updated[item.id];
                                  setCalcItems(updated);
                                }}
                                className="form-checkbox h-3.5 w-3.5 text-zinc-900 dark:text-white rounded-sm border-gray-300 dark:border-white/[0.2] bg-transparent focus:ring-zinc-500/30 transition-all cursor-pointer"
                              />
                              <span className="font-medium">{item.label}</span>
                            </div>
                            <span className="font-semibold font-mono">₹{item.price}</span>
                          </label>
                        ))}
                      </div>

                      <div className="flex gap-1.5 mb-3">
                        {[18, 5, 0].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setCalcTax(rate)}
                            className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all border ${
                              calcTax === rate
                                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.2)] dark:shadow-[0_2px_10px_rgba(255,255,255,0.2)]"
                                : "bg-white/50 dark:bg-[#151518]/50 border-gray-200/80 dark:border-white/[0.04] text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-[#1e1e24] hover:text-gray-700 dark:hover:text-zinc-300"
                            }`}
                          >
                            {rate === 0 ? "No Tax" : `GST ${rate}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200/60 dark:border-white/[0.06] space-y-1.5 text-[9px]">
                      {(() => {
                        const subtotal = (calcItems[0] ? 1200 : 0) + (calcItems[1] ? 300 : 0) + (calcItems[2] ? 500 : 0);
                        const gstVal = subtotal * (calcTax / 100);
                        const totalVal = subtotal + gstVal;
                        return (
                          <>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span>Subtotal:</span>
                              <span className="font-semibold text-gray-700 dark:text-zinc-300 font-mono">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span>GST ({calcTax}%):</span>
                              <span className="font-semibold text-gray-700 dark:text-zinc-300 font-mono">₹{gstVal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-1.5 border-t border-dashed border-gray-200 dark:border-white/[0.08] font-bold text-gray-900 dark:text-white mt-1">
                              <span>Total Due:</span>
                              <span className="text-zinc-900 dark:text-white font-mono text-[10px]">₹{totalVal.toLocaleString()}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ROW 1: Card 2 - GST Reports (Narrow - 1 col) */}
            <motion.div variants={fadeUp} className="bg-gradient-to-b from-[#ffffff] to-[#fcfcfd] dark:bg-gradient-to-b dark:from-[#09090b] dark:to-[#030304] border border-gray-200/50 dark:border-white/[0.06] rounded-3xl overflow-hidden min-h-[480px] relative flex flex-col justify-between shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_45px_rgba(0,0,0,0.7)] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-500 group">
              
              {/* Immersive visual area at the top */}
              <div className="relative w-full h-[250px] flex items-center justify-center pt-5 overflow-hidden">
                
                {/* Sales Analytics Chart Widget */}
                <div className="w-full max-w-[210px] bg-white/70 dark:bg-[#0f0f12]/90 border border-gray-200/80 dark:border-white/[0.06] rounded-2xl p-4 shadow-xl backdrop-blur-xl relative z-10 transition-all duration-500">
                  <div className="flex justify-between items-center text-[9px] mb-3">
                    <span className="font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Sales Analytics</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 bg-blue-500/10 px-1.5 py-0.5 rounded"><TrendingUp className="w-2.5 h-2.5"/> +24.8%</span>
                  </div>
                  
                  {/* Grid Lines Overlay */}
                  <div className="relative h-20 mt-4 flex flex-col justify-between pointer-events-none">
                    <div className="absolute inset-0 flex flex-col justify-between z-0">
                      <div className="border-t border-gray-200/50 dark:border-white/[0.03] w-full" />
                      <div className="border-t border-gray-200/50 dark:border-white/[0.03] w-full" />
                      <div className="border-t border-gray-200/50 dark:border-white/[0.03] w-full" />
                    </div>

                    {/* Horizontal simple chart layout */}
                    <div className="flex gap-2 items-end justify-between h-full px-1 relative z-10">
                      {[12, 16, 24, 20, 28, 38, 48].map((val, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${(val / 48) * 100}%` }}
                          className={`w-3.5 rounded-t-sm transition-all duration-500 relative group/bar ${
                            idx === 6
                              ? 'bg-gradient-to-t from-blue-600/40 to-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                              : 'bg-gradient-to-t from-zinc-500/10 to-zinc-400/50 dark:from-white/5 dark:to-white/20'
                          }`}
                        >
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GST Filing Status Widget Removed */}
              </div>

              {/* Bottom Fade Gradient Mask with Blur */}
              <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/95 to-transparent dark:from-[#040405] dark:via-[#040405]/95 dark:to-transparent z-20 pointer-events-none backdrop-blur-[0.5px]" />

              {/* Text Header (BOTTOM) */}
              <div className="text-left p-6 sm:p-8 pt-0 relative z-30">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">GST Reports</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">
                  Analyze your sales trend and export pre-calculated GST tax reports in a single click, perfect for accounting.
                </p>
              </div>
            </motion.div>

            {/* ROW 2: Card 3 - Client Ledgers (Narrow - 1 col) */}
            <motion.div variants={fadeUp} className="bg-gradient-to-b from-[#ffffff] to-[#fcfcfd] dark:bg-gradient-to-b dark:from-[#09090b] dark:to-[#030304] border border-gray-200/50 dark:border-white/[0.06] rounded-3xl min-h-[480px] relative flex flex-col justify-between shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_45px_rgba(0,0,0,0.7)] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-500 group overflow-hidden">
              {/* Background elements wrapped with overflow-hidden to prevent layout breaking */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-[240px]">
                </div>
              </div>
              
              {/* Visual scene area with connected transaction flows */}
              <div className="relative w-full h-[250px] flex items-center justify-center pt-5">
                {/* Connected flow path map */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80" viewBox="0 0 260 250">
                  <path d="M40,70 L130,130 M130,130 L220,80 M130,130 L130,220" stroke="url(#flow-grad)" strokeWidth="1.5" strokeDasharray="4,4" fill="none" className="animate-dash" />
                  <defs>
                    <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <circle cx="40" cy="70" r="4" className="fill-violet-500/20 stroke-violet-500/60 stroke-2" />
                  <circle cx="220" cy="80" r="4" className="fill-blue-500/20 stroke-blue-500/60 stroke-2" style={{ animationDelay: '1s' }} />
                  <circle cx="130" cy="220" r="4" className="fill-indigo-500/20 stroke-indigo-500/60 stroke-2" style={{ animationDelay: '0.5s' }} />
                </svg>

                {/* Client Ledger Widget */}
                <div className="w-full max-w-[220px] bg-white/70 dark:bg-[#0f0f12]/90 border border-gray-200/80 dark:border-white/[0.06] rounded-xl p-4 shadow-xl backdrop-blur-xl relative z-10 transition-all duration-500">
                  <div className="text-[9px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider pb-1.5 border-b border-gray-200/60 dark:border-white/[0.04] mb-3 text-left">
                    Client Balances
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Bloom Agency", initial: "B", bg: "bg-gradient-to-tr from-violet-500 to-indigo-500", amount: "+₹1,200.00", status: "positive", sparkline: "M0,10 Q5,8 10,12 T20,6 T30,8 T40,2" },
                      { name: "Acme Corporates", initial: "A", bg: "bg-gradient-to-tr from-rose-500 to-orange-500", amount: "-₹450.00", status: "negative", sparkline: "M0,2 Q5,6 10,4 T20,10 T30,8 T40,12" },
                      { name: "System Analytics", initial: "S", bg: "bg-gradient-to-tr from-blue-600 to-blue-400", amount: "+₹850.00", status: "positive", sparkline: "M0,12 Q5,8 10,10 T20,4 T30,6 T40,2" },
                    ].map((client, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/[0.04] p-2 rounded-lg transition-all hover:bg-white dark:hover:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.08] shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 ${client.bg} flex items-center justify-center text-[9px] font-bold text-white shadow-sm`}>
                            {client.initial}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-200">{client.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="w-10 h-3 hidden sm:block opacity-60" viewBox="0 0 40 14">
                            <path d={client.sparkline} fill="none" stroke={client.status === 'positive' ? '#2563eb' : '#f43f5e'} strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          <span className={`font-mono font-bold text-[9px] ${client.status === 'positive' ? 'text-blue-500 dark:text-blue-400' : 'text-rose-500 dark:text-rose-400'}`}>
                            {client.amount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Payment Status Indicator Removed */}
              </div>

              {/* Bottom Fade Gradient Mask with Blur */}
              <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/95 to-transparent dark:from-[#040405] dark:via-[#040405]/95 dark:to-transparent z-20 pointer-events-none backdrop-blur-[0.5px]" />

              {/* Text Header (BOTTOM) */}
              <div className="text-left p-6 sm:p-8 pt-0 relative z-30">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">Client Ledgers</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">
                  Maintain digital credit and debit accounts for all business clients to coordinate payment cycles.
                </p>
              </div>
            </motion.div>

            {/* ROW 2: Card 4 - Brand Customizer (Wide - 2 cols) */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-gradient-to-b from-[#ffffff] to-[#fcfcfd] dark:bg-gradient-to-b dark:from-[#09090b] dark:to-[#030304] border border-gray-200/50 dark:border-white/[0.06] rounded-3xl p-6 sm:p-8 relative min-h-[480px] flex items-center shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_45px_rgba(0,0,0,0.7)] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-500 group overflow-hidden">
              {/* Background elements wrapped with overflow-hidden to prevent layout breaking */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full relative z-10">
                {/* Text Content */}
                <div className="text-left flex flex-col justify-between h-full py-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">Brand Customizer</h3>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                      Infuse company colors, customized logos, and signatures directly into print-ready customer templates.
                    </p>
                  </div>
                  <Link to={isAuthenticated ? "/dashboard" : "/login"} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors w-fit">
                    Try brand templates <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Live Customizer Playground scene */}
                <div className="relative w-full flex items-center justify-center py-6">
                  
                  {/* Floating Brand Assets Verification Badge Removed */}

                  {/* Customizer and Mock Receipt Widget */}
                  <div className="w-full max-w-[280px] bg-white/60 dark:bg-[#121216]/80 border border-gray-200/80 dark:border-white/[0.06] rounded-xl p-5 flex flex-col gap-3.5 shadow-2xl backdrop-blur-xl relative z-10 transition-all duration-500">
                    {/* Theme Dots */}
                    <div className="flex items-center justify-between bg-white dark:bg-[#1a1a1f] p-2 rounded-lg border border-gray-200/50 dark:border-white/[0.04]">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 ml-1">Select Accent</span>
                      <div className="flex gap-2">
                        {[
                          { id: 'slate', color: 'bg-slate-500', ring: 'ring-slate-500' },
                          { id: 'mint', color: 'bg-blue-500', ring: 'ring-blue-500' },
                          { id: 'coral', color: 'bg-rose-300', ring: 'ring-rose-300' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setPreviewTheme(btn.id as any)}
                            className={`w-3.5 h-3.5 rounded-full ${btn.color} transition-all duration-200 ${
                              previewTheme === btn.id ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Custom Invoice Preview */}
                    <div className="border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#151518]/90 rounded-lg p-4 space-y-3 relative overflow-hidden text-left shadow-sm">


                      <div className="flex justify-between items-start pt-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors duration-500 ${
                              previewTheme === 'slate' ? 'bg-slate-500/10 text-slate-500' : previewTheme === 'mint' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-400/10 text-rose-400'
                            }`}><Cloud className="w-2.5 h-2.5"/></div>
                            <span className="font-bold text-[10px] text-gray-800 dark:text-white uppercase tracking-tight">Bloom Agency</span>
                          </div>
                          <span className="text-[7px] text-gray-400 w-24">123 Design Street, Creative District, NY 10001</span>
                        </div>
                        <span className={`font-bold font-mono text-[9px] px-1.5 py-0.5 rounded transition-all duration-300 ${
                          previewTheme === 'slate' ? 'bg-slate-500/10 text-slate-500' : previewTheme === 'mint' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-400/10 text-rose-400'
                        }`}>#082</span>
                      </div>
                      
                      <div className="border-t border-b border-gray-100 dark:border-white/[0.04] py-2 mt-2 space-y-1.5">
                        <div className="flex justify-between text-[7px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                          <span>Description</span>
                          <span>Amount</span>
                        </div>
                        <div className="flex justify-between text-[8px] text-gray-700 dark:text-gray-300 items-start">
                          <span className="w-32 leading-tight">Website UI design development & system setup</span>
                          <span className="font-semibold font-mono text-gray-900 dark:text-white">₹1,200.00</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-1">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[6px] text-gray-400 uppercase tracking-widest font-bold">Authorized Sign</span>
                          <svg className="w-16 h-6 opacity-60" viewBox="0 0 100 30">
                            <path d="M10,20 Q20,10 30,15 T50,10 T70,25 T90,5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-800 dark:text-white" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <span className="text-[7px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">Total Due</span>
                          <span className={`font-bold font-mono text-xs transition-colors duration-500 ${
                            previewTheme === 'slate' ? 'text-slate-500 dark:text-slate-400' : previewTheme === 'mint' ? 'text-blue-500 dark:text-blue-400' : 'text-rose-400 dark:text-rose-400'
                          }`}>₹1,200.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* ROW 3: Card 5 - Expense & Purchase Bills (Narrow - 1 col) */}
            <motion.div variants={fadeUp} className="lg:col-span-1 bg-gradient-to-b from-[#ffffff] to-[#fcfcfd] dark:bg-gradient-to-b dark:from-[#09090b] dark:to-[#030304] border border-gray-200/50 dark:border-white/[0.06] rounded-3xl min-h-[480px] relative flex flex-col justify-between shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_45px_rgba(0,0,0,0.7)] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-500 group overflow-hidden">
              {/* Background elements wrapped with overflow-hidden to prevent layout breaking */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute inset-y-0 left-1/4 w-[2px] border-l border-dashed border-gray-200 dark:border-white/[0.05] z-0" />
              </div>
              
              {/* Immersive Visual timeline scene */}
              <div className="relative w-full h-[250px] flex items-center justify-center pt-5">
                
                {/* Supplier Bills Widget */}
                <div className="w-full max-w-[220px] bg-white/70 dark:bg-[#0f0f12]/90 border border-gray-200/80 dark:border-white/[0.06] rounded-xl p-4 flex flex-col gap-3 shadow-xl backdrop-blur-xl relative z-10 text-left transition-all duration-500">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200/60 dark:border-white/[0.04] mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Supplier Bills</span>
                    <span className="text-[8px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    {[
                      { supplier: "AWS Cloud", amount: "₹800.00", status: "Paid", color: "bg-blue-500", icon: <Cloud className="w-2.5 h-2.5 text-gray-700 dark:text-white" /> },
                      { supplier: "Google Workspace", amount: "₹120.00", status: "Paid", color: "bg-blue-500", icon: <Globe className="w-2.5 h-2.5 text-gray-700 dark:text-white" /> },
                      { supplier: "GitHub Enterprise", amount: "₹280.00", status: "Pending", color: "bg-amber-500", icon: <Package className="w-2.5 h-2.5 text-gray-700 dark:text-white" /> },
                    ].map((bill, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-gray-50/50 dark:bg-[#151518]/50 border border-gray-200/50 dark:border-white/[0.03] p-2 rounded-lg hover:bg-white dark:hover:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.08] transition-all shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-white dark:bg-[#202025] border border-gray-200 dark:border-white/[0.05] flex items-center justify-center shadow-sm">
                            {bill.icon}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white block leading-tight">{bill.supplier}</span>
                            <span className="text-[7px] text-gray-400 dark:text-gray-400 block mt-0.5 font-medium uppercase tracking-wider">Due Jun 25</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-gray-950 dark:text-white block leading-tight">{bill.amount}</span>
                          <span className="text-[7px] font-bold flex items-center gap-1 mt-0.5 justify-end">
                            <span className={`w-1.5 h-1.5 rounded-full ${bill.color}`} />
                            <span className="text-gray-500 dark:text-gray-300">{bill.status}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Timeline Reminder Alert Removed */}
              </div>

              {/* Bottom Fade Gradient Mask with Blur */}
              <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/95 to-transparent dark:from-[#040405] dark:via-[#040405]/95 dark:to-transparent z-20 pointer-events-none backdrop-blur-[0.5px]" />

              {/* Text Header (BOTTOM) */}
              <div className="text-left p-6 sm:p-8 pt-0 relative z-30">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">Expense &amp; Purchase Bills</h3>
                <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">
                  Track outgoing expenditures and manage supplier bills efficiently alongside incoming revenues.
                </p>
              </div>
            </motion.div>

            {/* ROW 3: Card 6 - Instant PDF & Sharing (Wide - 2 cols) */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-gradient-to-b from-[#ffffff] to-[#fcfcfd] dark:bg-gradient-to-b dark:from-[#09090b] dark:to-[#030304] border border-gray-200/50 dark:border-white/[0.06] rounded-3xl p-6 sm:p-8 relative min-h-[480px] flex items-center shadow-lg dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_45px_rgba(0,0,0,0.7)] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-500 group overflow-hidden">
              {/* Background elements wrapped with overflow-hidden to prevent layout breaking */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full relative z-10">
                {/* Text Content */}
                <div className="text-left flex flex-col justify-between h-full py-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-2">Instant PDF &amp; Sharing</h3>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                      Export clean, formatted receipts in one click and share invoices instantly over professional channels.
                    </p>
                  </div>
                  <button onClick={handlePdfDownload} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors w-fit">
                    Download templates <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Immersive Document Generation and Sharing flow pipeline */}
                <div className="relative w-full max-w-[340px] mx-auto h-[260px] flex items-center justify-between gap-6">
                  
                  {/* PDF Preview Widget */}
                  <div className="w-full max-w-[160px] bg-white/60 dark:bg-[#121216]/80 border border-gray-200/80 dark:border-white/[0.06] rounded-xl p-4 shadow-2xl backdrop-blur-xl relative z-10 transition-all duration-500 text-left flex flex-col justify-between h-[210px]">
                    <div className="border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1a1a20]/90 rounded-lg p-3 space-y-2 mb-3 relative overflow-hidden select-none shadow-sm flex-1">

                      
                      <div className="flex justify-between items-start pt-1 border-b border-gray-100 dark:border-white/[0.04] pb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 bg-zinc-100 dark:bg-white/[0.05] rounded flex items-center justify-center">
                            <Cloud className="w-2 h-2 text-gray-500 dark:text-gray-400"/>
                          </div>
                          <span className="font-bold text-[8px] text-gray-800 dark:text-white uppercase tracking-tight">Bloom Agency</span>
                        </div>
                        <span className="font-mono text-[8px] font-bold bg-zinc-100 dark:bg-white/[0.05] px-1 rounded">#082</span>
                      </div>
                      
                      <div className="py-1 text-[7px] flex justify-between text-gray-500 dark:text-gray-400 font-medium font-mono">
                        <span className="w-16 leading-tight">Web UI Design</span>
                        <span className="text-gray-900 dark:text-white font-bold">₹1,200</span>
                      </div>
                      
                      {/* Placeholder barcode */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-4 opacity-30 flex items-center justify-between">
                         <div className="w-0.5 h-full bg-current text-gray-500 dark:text-gray-300"></div>
                         <div className="w-1 h-full bg-current text-gray-500 dark:text-gray-300"></div>
                         <div className="w-0.5 h-full bg-current text-gray-500 dark:text-gray-300"></div>
                         <div className="w-1.5 h-full bg-current text-gray-500 dark:text-gray-300"></div>
                         <div className="w-0.5 h-full bg-current text-gray-500 dark:text-gray-300"></div>
                         <div className="w-1 h-full bg-current text-gray-500 dark:text-gray-300"></div>
                         <div className="w-0.5 h-full bg-current text-gray-500 dark:text-gray-300"></div>
                      </div>
                    </div>

                    <button
                      onClick={handlePdfDownload}
                      className={`w-full py-2 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 border relative z-30 ${
                        pdfState === 'downloading'
                          ? 'bg-zinc-100 dark:bg-white/[0.02] border-gray-200/50 dark:border-white/[0.05] text-gray-400 dark:text-gray-500'
                          : pdfState === 'completed'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)]'
                          : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 hover:bg-zinc-800 dark:hover:bg-white/90 shadow-[0_4px_14px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_14px_rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {pdfState === 'downloading' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : pdfState === 'completed' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Save PDF</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Connected workflow flow paths */}
                  <svg className="absolute top-1/2 left-[140px] -translate-y-1/2 w-16 h-32 pointer-events-none z-0" viewBox="0 0 64 128">
                    <path d="M0,64 C20,64 30,24 64,24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" className="text-blue-500/40 dark:text-blue-400/40 animate-dash" />
                    <path d="M0,64 L64,64" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" className="text-blue-500/40 dark:text-blue-400/40 animate-dash" />
                    <path d="M0,64 C20,64 30,104 64,104" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" className="text-amber-500/40 dark:text-amber-400/40 animate-dash" />
                  </svg>

                  {/* Connected sharing options stack */}
                  <div className="flex flex-col gap-3 w-[130px] relative z-10 transition-all duration-500 delay-75">
                    {[
                      { channel: "Send Email", icon: <Mail className="w-3.5 h-3.5 text-blue-500" /> },
                      { channel: "WhatsApp", icon: <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> },
                      { channel: "Print Copy", icon: <Printer className="w-3.5 h-3.5 text-amber-500" /> },
                    ].map((ch, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 bg-white/90 dark:bg-[#1a1a20]/90 backdrop-blur-xl border border-gray-200/60 dark:border-white/[0.08] p-2.5 rounded-xl text-[9px] font-semibold shadow-lg shadow-black/5 dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] text-left select-none hover:bg-gray-50 dark:hover:bg-[#202025] hover:scale-105 transition-all cursor-pointer">
                        <div className="w-6 h-6 rounded-md bg-gray-50 dark:bg-white/[0.03] border border-gray-200/50 dark:border-white/[0.05] flex items-center justify-center flex-shrink-0">
                          {ch.icon}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 uppercase tracking-wider">{ch.channel}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Interactive Pricing Toggle */}
      <section id="pricing" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-left mb-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          <motion.h2 variants={fadeUp} style={{ fontFamily: "'Inter', sans-serif" }} className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] pb-2 mb-4 text-gray-900 dark:text-white">
            Transparent pricing,<br />
            <span className="inline-block pb-2 bg-gradient-to-b from-zinc-600 to-zinc-400 dark:from-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">no surprises</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-500 dark:text-zinc-400 max-w-md text-sm sm:text-base leading-relaxed">
            Pick the plan that suits your billing capacity. Upgrade or downgrade anytime.
          </motion.p>
        </motion.div>

        {/* Toggle Switch — centered above cards */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-[#121214] p-1 rounded-full border border-gray-200/50 dark:border-white/[0.04]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !isAnnual
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isAnnual
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Annually
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all ${
                isAnnual
                  ? "bg-white/20 text-white"
                  : "bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400"
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto items-stretch"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
        >
          {/* Free Tier */}
          <motion.div variants={fadeUp} className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/[0.04] bg-white/80 dark:bg-[#1A1A1D] flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Free Tier</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">₹0</span>
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
                    <Check className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
              <Button variant="secondary" className="w-full">
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Button>
            </Link>
          </motion.div>

          {/* Pro Tier (Popular) */}
          <motion.div variants={fadeUp} className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-blue-600 bg-white dark:bg-[#121214] shadow-xl shadow-blue-600/20 flex flex-col justify-between relative">
            <span className="absolute top-0 right-8 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Pro Tier</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {isAnnual ? "₹12" : "₹15"}
                  </span>
                  <span className="text-gray-500 text-sm">/ month</span>
                </div>
                {isAnnual && (
                  <span className="text-blue-500 text-[11px] font-medium block mt-1">
                    Billed annually (₹144 / year)
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
                    <Check className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
              <Button variant="accent" className="w-full">
                {isAuthenticated ? "Go to Dashboard" : "Upgrade to Pro"}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Section heading */}
          <motion.div
            className="mb-10 md:mb-14"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
          >
            <motion.h2
              variants={fadeUp}
              style={{ fontFamily: "'Inter', sans-serif" }}
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] text-gray-900 dark:text-white"
            >
              Don't just take
            </motion.h2>
            <motion.h2
              variants={fadeUp}
              style={{ fontFamily: "'Inter', sans-serif" }}
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] pb-2"
            >
              <span className="inline-block bg-gradient-to-b from-zinc-600 to-zinc-400 dark:from-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">
                our word for it
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mt-3">
              Hear from some of our amazing customers who are building faster.
            </motion.p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">

            <motion.div
              className="w-full md:w-[40%] flex-shrink-0"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
            >
              <div className="relative min-h-[260px]">
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
                    className="relative w-full flex flex-col justify-between pb-2"
                  >
                    <div>
                      <div className="flex gap-1 mb-5">
                        {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      <blockquote style={{ fontFamily: "'Inter', sans-serif" }} className="text-xl sm:text-2xl leading-snug font-normal not-italic text-gray-900 dark:text-white mb-7">
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


            </motion.div>

            {/* Right: Photo collage — takes remaining space */}
            <motion.div
              className="hidden md:grid grid-cols-6 gap-3 items-start flex-1 min-w-0 pointer-events-none"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.15 }}
            >
              {/* Row 1: Top images */}
              <motion.img
                variants={fadeUp}
                src="https://www.untitledui.com/react/marketing/testimonial-abstract-image-01.webp"
                alt=""
                className="col-start-2 col-span-2 row-start-1 w-full h-[180px] object-cover object-center self-end"
              />
              <motion.img
                variants={fadeUp}
                src="https://www.untitledui.com/react/marketing/smiling-girl-3.webp"
                alt=""
                className="col-start-4 col-span-2 row-start-1 w-full h-[220px] object-cover object-center self-end"
              />

              {/* Row 2: Bottom images */}
              <motion.img
                variants={fadeUp}
                src="https://www.untitledui.com/react/marketing/ai-woman-03.webp"
                alt=""
                className="col-start-1 col-span-2 row-start-2 w-full h-[130px] object-cover object-center self-start"
              />
              <motion.img
                variants={fadeUp}
                src="https://www.untitledui.com/react/marketing/two-standing-women.webp"
                alt=""
                className="col-start-3 col-span-2 row-start-2 w-full h-[280px] object-cover object-top self-start"
              />
              <motion.img
                variants={fadeUp}
                src="https://www.untitledui.com/react/marketing/smiling-girl-8.webp"
                alt=""
                className="col-start-5 col-span-2 row-start-2 w-full h-[130px] object-cover object-center self-start"
              />
            </motion.div>

          </div>
        </div>
      </section>


      {/* Accordion FAQs */}
      <section id="faq" className="py-16 sm:py-24 border-t border-gray-200/50 dark:border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-left mb-16"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
          >
            <motion.h2 variants={fadeUp} style={{ fontFamily: "'Inter', sans-serif" }} className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] pb-2 mb-5 text-gray-900 dark:text-white">
              Frequently asked<br />
              <span className="inline-block pb-2 bg-gradient-to-b from-zinc-600 to-zinc-400 dark:from-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">questions</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Everything you need to know about the product and billing.
            </motion.p>
          </motion.div>

          <motion.div
            className="divide-y divide-gray-200 dark:divide-white/[0.06]"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={fadeUp}>
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  className="w-full flex items-center justify-between py-5 text-left text-sm sm:text-base font-bold text-gray-900 dark:text-white transition-colors"
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
                  <div className="pb-6 text-sm sm:text-base text-gray-500 dark:text-zinc-400 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA & Footer Wrapper */}
      <div className="relative overflow-hidden border-t border-gray-200/50 dark:border-white/[0.04] bg-white dark:bg-[#000000]">
        
        {/* Subtle Glow & Grid Lines (Cobalt Style) */}
        <div className="absolute inset-0 pointer-events-none block">
           <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_100%] md:bg-[size:64px_100%]" />
           <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-[#000000] dark:via-transparent dark:to-[#000000]" />
           <div className="absolute bottom-[-150px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] dark:blur-[120px] rounded-full" />
           <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-sky-400/15 dark:bg-sky-400/10 blur-[60px] dark:blur-[80px] rounded-full" />
        </div>

      {/* CTA Section */}
      <section className="relative py-14 sm:py-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">

            {/* Left: Text + Buttons */}
            <motion.div
              className="flex-1 max-w-lg"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
            >
              <motion.h2 variants={fadeUp} style={{ fontFamily: "'Inter', sans-serif" }} className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-[-0.03em] leading-[1.1] mb-3 text-gray-900 dark:text-white">
                Join over <span className="text-blue-600 dark:text-blue-400">500+</span> businesses<br />
                <span className="inline-block pb-2 bg-gradient-to-b from-zinc-800 to-zinc-500 dark:from-zinc-300 dark:to-zinc-600 bg-clip-text text-transparent">growing with EzBill</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-7">
                Start invoicing professionally today. No credit card required.
              </motion.p>
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button variant="accent" size="md" className="shadow-md shadow-blue-600/20 font-semibold">
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
                    <Link to="/login">
                      <Button variant="accent" size="md" className="shadow-md shadow-blue-600/20 font-semibold">
                        Get started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

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
      <footer className="relative py-8 sm:py-12 border-t border-gray-200/50 dark:border-white/[0.04] bg-transparent z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <img src="/EzBill.png?v=3" alt="EzBill" className="w-8 h-8 shadow-md shadow-blue-600/25" />
            <span className="font-bold text-gray-700 dark:text-gray-300">EzBill</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
            <a href="mailto:support@ezbill.app" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Support</a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} EzBill. All rights reserved.
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}

export default LandingPage
