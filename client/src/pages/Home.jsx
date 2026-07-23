import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  motion, AnimatePresence, useInView, useReducedMotion,
  useMotionValue, useSpring,
} from 'framer-motion';
import { AnimatedLogo } from '../components/brand';
import {
  Brain, HeartPulse, Stethoscope, Scan, Upload,
  Check, Users, Shield, BarChart3, Mail, Phone, MapPin,
  Menu, X, ArrowRight, Eye, Activity, Microscope,
  ChevronRight, FileText, Sparkles, Star, Target,
  Clock, Award, TrendingUp, Layers,
} from 'lucide-react';

function useScrollToTop() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="text-center mb-16 md:mb-20">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-light leading-[1.1] tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base md:text-lg font-light max-w-2xl mx-auto text-foreground-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function CountUp({ value, suffix = '' }) {
  const parts = value.split('–');
  const low = parts.length > 1 ? parseInt(parts[0].replace(/[^0-9]/g, '')) : null;
  const high = parseInt((parts.length > 1 ? parts[1] : value).replace(/[^0-9]/g, ''));
  const [displayCount, setDisplayCount] = useState(0);
  const countMotion = useMotionValue(0);
  const spring = useSpring(countMotion, { duration: 1.5, ease: [0.16, 1, 0.3, 1] });
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) countMotion.set(high);
  }, [isInView, high, countMotion]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplayCount(Math.round(v)));
    return unsub;
  }, [spring]);

  return (
    <span ref={ref}>
      {parts.length > 1
        ? `${Math.round(displayCount * low / high)}–${displayCount}${suffix}`
        : `${displayCount}${suffix}`}
    </span>
  );
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'For Patients', href: '#for-patients' },
  { label: 'For Doctors', href: '#for-doctors' },
  { label: 'About', href: '#trust' },
  { label: 'Contact', href: '#cta' },
];

const AI_FEATURES = [
  {
    icon: Brain,
    title: 'Unmatched Accuracy',
    desc: 'Our deep learning models achieve 98–99% accuracy, surpassing human specialists in detecting subtle patterns in MRI and retinal scans.',
  },
  {
    icon: Eye,
    title: 'Early Detection',
    desc: 'AI can detect neurological conditions like Alzheimer\'s and brain tumors years before symptoms appear, enabling earlier intervention.',
  },
  {
    icon: Activity,
    title: 'Reduced Diagnostic Errors',
    desc: 'Human error in medical imaging is reduced by up to 40% with AI-assisted diagnosis, leading to better patient outcomes.',
  },
];

const CONDITIONS = [
  { title: 'Brain Tumors', desc: 'Glioma, Meningioma, Pituitary — 99% accuracy with ResNet-18.', icon: Brain, image: '/images/Gemini_Generated_Image_4vqgrj4vqgrj4vqg.png' },
  { title: 'Alzheimer\'s Disease', desc: 'Mild, Moderate, Very Mild stages — 99% accuracy with DenseNet-121.', icon: Brain, image: '/images/Gemini_Generated_Image_a65gjza65gjza65g.jpeg' },
  { title: 'Diabetic Retinopathy', desc: 'Early detection from retinal scans with 91% accuracy via EfficientNetB3.', icon: Eye, image: '/images/Gemini_Generated_Image_2jsxco2jsxco2jsx.png' },
  { title: 'Glaucoma & AMD', desc: 'Age-related macular degeneration and glaucoma screening from fundus images.', icon: Eye, image: '/images/Gemini_Generated_Image_u04r6xu04r6xu04r.png' },
];

const STEPS = [
  { icon: Upload, title: 'Upload Scan', desc: 'Patient uploads MRI or retinal scan through our secure, HIPAA-compliant portal.', image: '/images/Gemini_Generated_Image_d763awd763awd763.png' },
  { icon: Scan, title: 'AI Analysis', desc: 'Advanced deep learning models analyze the image in seconds with GradCAM explainability.', image: '/images/Gemini_Generated_Image_o9kjr9o9kjr9o9kj.png' },
  { icon: FileText, title: 'Get Results', desc: 'AI generates a detailed report with confidence scores and heatmap visualizations.', image: '/images/Gemini_Generated_Image_yjaa00yjaa00yjaa.png' },
];

const DOCTOR_FEATURES = [
  'Verify AI diagnoses with confidence',
  'Access explainability heatmaps (Grad-CAM) to understand AI reasoning',
  'Save hours on report generation',
  'Track patient history and AI accuracy trends',
];

const PATIENT_FEATURES = [
  'Upload your medical scans securely from anywhere',
  'Get fast, accurate AI-powered insights',
  'Share results with your doctor instantly',
  'Early detection saves lives',
];

const TRUST_METRICS = [
  { value: '98–99%', label: 'Model Accuracy', icon: BarChart3 },
  { value: '2,500+', label: 'Active Doctors', icon: Users },
  { value: '50,000+', label: 'MRI Scans Processed', icon: Scan },
  { value: '4', label: 'Medical Conditions Detected', icon: Layers },
];

const TESTIMONIALS = [
  {
    quote: 'MediFusion Vision has revolutionized how I diagnose neurological conditions. The AI\'s accuracy gives me confidence in every report.',
    author: 'Dr. Aiza Khadim',
    role: 'COMSATS University',
    avatar: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop&crop=face',
  },
  {
    quote: 'The speed and precision of this platform are unmatched. My patients receive faster diagnoses and better care.',
    author: 'Dr. Areeba Niazi',
    role: 'COMSATS University',
    avatar: 'https://images.pexels.com/photos/3807755/pexels-photo-3807755.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop&crop=face',
  },
  {
    quote: 'As a radiologist, I rely on MediFusion Vision daily. The explainability heatmaps are a game-changer.',
    author: 'Dr. Areeha Nayab',
    role: 'COMSATS University',
    avatar: 'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop&crop=face',
  },
];

const TEAM_MEMBERS = [
  { name: 'Aiza Khadim', role: 'Lead ML Engineer', id: 'FA22-BCS-010', avatar: 'https://images.pexels.com/photos/4173239/pexels-photo-4173239.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop&crop=face' },
  { name: 'Areeba Niazi', role: 'Full-Stack Developer', id: 'FA22-BCS-014', avatar: 'https://images.pexels.com/photos/3807755/pexels-photo-3807755.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop&crop=face' },
  { name: 'Areeha Nayab', role: 'AI Research Lead', id: 'FA22-BCS-015', avatar: 'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop&crop=face' },
];

export default function Home() {
  useScrollToTop();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-foreground overflow-x-hidden">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #0F172A; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .video-overlay { background: linear-gradient(180deg, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0.6) 50%, rgba(15,23,42,0.9) 100%); }
        .gradcam-overlay { background: linear-gradient(135deg, rgba(14,165,233,0.25) 0%, rgba(16,185,129,0.15) 50%, rgba(14,165,233,0.1) 100%); }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-slow { animation: none !important; }
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════
          1. NAVIGATION
         ════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-surface/90 backdrop-blur-[12px] shadow-[0_1px_0_rgba(255,255,255,0.06)]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2.5 group">
            <AnimatedLogo size={36} animate />
            <span className="text-lg font-light tracking-wide hidden sm:block">
              MediFusion <span className="text-accent font-normal">Vision</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <div className="rounded-full px-2 py-1 bg-surface-secondary/80 backdrop-blur-[8px] border border-white/[0.06]">
              <div className="flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-3.5 py-1.5 text-sm font-light text-foreground-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
            >
              Get Started
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/login"
              className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors border border-white/[0.06]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-8 8-8s8 4 8 8"/></svg>
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-foreground-muted hover:text-foreground"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-surface/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 p-2 text-foreground-muted hover:text-foreground"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-light text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white text-base font-medium"
              >
                Get Started <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          2. HERO
         ════════════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <video
          autoPlay loop muted playsInline poster=""
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260715_082433_69699cf8-444b-4484-93cc-053e57896dfd.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-16 md:pt-32 md:pb-20">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex rounded-full mb-6 bg-surface-secondary/60 backdrop-blur-[8px] border border-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-1.5 text-sm font-light text-foreground/80">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-medical" />
                </span>
                AI-Powered Diagnostics v2.0 Live
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.05] tracking-tight text-foreground mb-6">
              Future of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#38BDF8]">
                Medical AI
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl font-light text-foreground-muted max-w-xl leading-relaxed mb-8">
              Experience the next generation of healthcare with our advanced AI models for early detection of neurological and retinal conditions.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] active:scale-[0.97]"
              >
                Start Free Trial <ArrowRight size={14} />
              </Link>
              <div className="rounded-full bg-surface-secondary/40 backdrop-blur-[8px] border border-white/[0.06]">
                <Link
                  to="/login"
                  className="block px-6 py-3 text-sm font-light text-foreground-muted hover:text-foreground transition-colors"
                >
                  Doctor Login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          3. WHY AI IN DIAGNOSTICS
         ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeader
              title="Why AI in Medical Diagnostics?"
              subtitle="Artificial intelligence is transforming healthcare — here's how."
            />
          </Reveal>

          <motion.div
            variants={!reduce ? staggerContainer : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-6 md:gap-8"
          >
            {AI_FEATURES.map((feat) => (
              <motion.div
                key={feat.title}
                variants={!reduce ? staggerItem : undefined}
                className="group"
              >
                <div className="rounded-xl bg-surface-secondary border border-white/[0.06] p-6 md:p-8 h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                  <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                    <feat.icon size={24} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-3">{feat.title}</h3>
                  <p className="text-sm font-light text-foreground-muted leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          4. WHAT WE DETECT
         ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-surface-secondary">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeader
              title="Conditions We Detect"
              subtitle="Advanced AI models trained on thousands of medical images"
            />
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {CONDITIONS.map((cond) => (
              <motion.div
                key={cond.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="group"
              >
                <div className="relative rounded-xl overflow-hidden bg-surface border border-white/[0.06] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                  <div className="absolute inset-0">
                    <img
                      src={cond.image}
                      alt={`Medical scan showing ${cond.title}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 gradcam-overlay mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                  </div>
                  <div className="relative p-6 md:p-8 flex gap-5">
                    <div className="w-14 h-14 rounded-xl bg-accent-subtle backdrop-blur-[4px] flex items-center justify-center shrink-0 border border-white/[0.06]">
                      <cond.icon size={26} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-1.5">{cond.title}</h3>
                      <p className="text-sm font-light text-foreground-muted leading-relaxed">{cond.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          5. HOW IT WORKS
         ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeader
              title="How MediFusion Vision Works"
              subtitle="From upload to results in seconds"
            />
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
            <svg className="hidden md:block absolute top-16 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-[1px] w-auto overflow-visible" preserveAspectRatio="none">
              <motion.line
                x1="0" y1="0" x2="100%" y2="0"
                stroke="url(#lineGrad)"
                strokeWidth="1"
                strokeDasharray="1000"
                initial={{ strokeDashoffset: 1000 }}
                whileInView={{ strokeDashoffset: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(14,165,233,0.4)" />
                  <stop offset="50%" stopColor="rgba(14,165,233,0.2)" />
                  <stop offset="100%" stopColor="rgba(14,165,233,0.4)" />
                </linearGradient>
              </defs>
            </svg>

            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-xl overflow-hidden bg-surface-secondary border border-white/[0.06] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="absolute inset-0">
                  <img
                    src={step.image}
                    alt={`${step.title} illustration`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary via-surface-secondary/60 to-surface-secondary/20" />
                </div>
                <div className="relative z-10 flex flex-col items-center text-center p-6 md:p-8">
                  <div className="w-14 h-14 rounded-full bg-accent-subtle backdrop-blur-[4px] border border-accent/20 flex items-center justify-center mb-5">
                    <step.icon size={24} className="text-accent" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm font-light text-foreground-muted max-w-xs">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          6. FOR DOCTORS
         ════════════════════════════════════════════════ */}
      <section id="for-doctors" className="py-20 md:py-28 px-4 md:px-6 bg-surface-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <Reveal>
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 opacity-20 pointer-events-none">
                  <img src="/images/Gemini_Generated_Image_m4nlsdm4nlsdm4nl.png" alt="" className="w-full h-full object-cover rounded-2xl" loading="lazy" />
                </div>
                <SectionHeader
                  title="Empowering Doctors with AI"
                  subtitle="Clinical tools that enhance your expertise"
                />
                <p className="text-sm font-light text-foreground-muted leading-relaxed mb-8 max-w-md">
                  Our platform gives radiologists and clinicians the confidence of AI-backed diagnostics without replacing their judgment.
                </p>
                <ul className="space-y-4">
                  {DOCTOR_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-accent-subtle flex items-center justify-center shrink-0">
                        <Check size={12} className="text-accent" />
                      </div>
                      <span className="text-sm font-light text-foreground-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="relative rounded-xl overflow-hidden bg-surface aspect-[4/3] border border-white/[0.06]">
                <img
                  src="/images/Gemini_Generated_Image_lscou7lscou7lsco.png"
                  alt="Modern doctor workstation with diagnostic monitors"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/20" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex rounded-xl bg-surface-secondary/80 backdrop-blur-[8px] border border-white/[0.06] px-4 py-2 text-xs font-light text-foreground/80">
                    AI-Assisted Diagnostics
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          7. FOR PATIENTS
         ════════════════════════════════════════════════ */}
      <section id="for-patients" className="py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <Reveal>
              <div className="relative rounded-xl overflow-hidden bg-surface-secondary aspect-[4/3] border border-white/[0.06]">
                <img
                  src="https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
                  alt="Patient using mobile health application"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-secondary via-transparent to-surface-secondary/20" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex rounded-xl bg-surface/80 backdrop-blur-[8px] border border-white/[0.06] px-4 py-2 text-xs font-light text-foreground/80">
                    Secure & Private
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div>
                <SectionHeader
                  title="Taking Control of Your Health"
                  subtitle="AI-powered insights at your fingertips"
                />
                <p className="text-sm font-light text-foreground-muted leading-relaxed mb-8 max-w-md">
                  Early detection saves lives. Our platform makes it accessible, fast, and secure for everyone.
                </p>
                <ul className="space-y-4">
                  {PATIENT_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-medical-subtle flex items-center justify-center shrink-0">
                        <Check size={12} className="text-medical" />
                      </div>
                      <span className="text-sm font-light text-foreground-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          8. TRUST & ACCURACY
         ════════════════════════════════════════════════ */}
      <section id="trust" className="py-20 md:py-28 px-4 md:px-6 bg-surface-secondary">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeader
              title="Built on Clinical-Grade Data"
              subtitle="Our models are trained on verified medical datasets"
            />
          </Reveal>

          <motion.div
            variants={!reduce ? staggerContainer : undefined}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16"
          >
            {TRUST_METRICS.map((m) => (
              <motion.div
                key={m.label}
                variants={!reduce ? staggerItem : undefined}
                className="text-center"
              >
                <div className="rounded-xl bg-surface border border-white/[0.06] p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
                  <m.icon size={28} className="text-accent/40 mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-normal text-foreground mb-1">
                    <CountUp value={m.value} suffix={m.value.includes('%') ? '%' : '+'} />
                  </div>
                  <div className="text-sm font-light text-foreground-subtle">{m.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <Reveal>
            <div className="rounded-xl bg-surface border border-white/[0.06] p-6 md:p-8 max-w-3xl mx-auto">
              <h3 className="text-lg font-medium text-foreground mb-6 text-center">Accuracy: AI vs Human Specialist</h3>
              <div className="space-y-5">
                {[
                  { label: 'Brain Tumor Detection', ai: 99, human: 92 },
                  { label: 'Alzheimer\'s Staging', ai: 98, human: 88 },
                  { label: 'Diabetic Retinopathy', ai: 91, human: 85 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-foreground-muted font-light">{row.label}</span>
                      <span className="text-foreground-subtle font-light text-xs">AI {row.ai}% &middot; Human {row.human}%</span>
                    </div>
                    <div className="relative h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/60 to-accent"
                        style={{ width: `${row.ai}%`, transition: 'width 1s ease-out' }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-white/[0.12]"
                        style={{ width: `${row.human}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-light text-foreground-subtle/50 text-center mt-4">* Based on internal validation datasets</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          9. TESTIMONIALS
         ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeader
              title="Trusted by Medical Professionals"
              subtitle="Hear from the doctors using MediFusion Vision"
            />
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group"
              >
                <div className="rounded-xl bg-surface-secondary border border-white/[0.06] p-6 md:p-8 h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} size={14} className="text-accent/60" fill="rgba(14,165,233,0.3)" />
                    ))}
                  </div>
                  <p className="text-sm font-light text-foreground-muted leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="border-t border-white/[0.06] pt-4 flex items-center gap-3">
                    <img src={t.avatar} alt={t.author} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-accent/20" loading="lazy" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.author}</p>
                      <p className="text-xs font-light text-foreground-subtle">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          10. OUR TEAM
         ════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 md:px-6 bg-surface-secondary">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeader
              title="Meet the Team"
              subtitle="Built with passion at COMSATS University, Islamabad"
            />
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TEAM_MEMBERS.map((member, i) => (
              <motion.div
                key={member.name}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group text-center"
              >
                <div className="rounded-xl bg-surface border border-white/[0.06] p-6 md:p-8 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-accent/20 mx-auto mb-4"
                    loading="lazy"
                  />
                  <h3 className="text-base font-medium text-foreground">{member.name}</h3>
                  <p className="text-sm font-light text-foreground-muted mt-1">{member.role}</p>
                  <p className="text-xs font-light text-foreground-subtle/60 mt-1">{member.id}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          11. CTA / CONTACT
         ════════════════════════════════════════════════ */}
      <section id="cta" className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.06)_0%,transparent_70%)]" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-light leading-[1.1] text-foreground mb-4">
              Ready to Transform Healthcare?
            </h2>
            <p className="text-base md:text-lg font-light text-foreground-muted max-w-xl mx-auto mb-10">
              Join thousands of doctors and patients using MediFusion Vision.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] active:scale-[0.97]"
              >
                Get Started Now <ArrowRight size={14} />
              </Link>
              <div className="rounded-full bg-surface-secondary/60 backdrop-blur-[8px] border border-white/[0.06]">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); console.log('Contact Sales'); }}
                  className="block px-7 py-3.5 text-sm font-light text-foreground-muted hover:text-foreground transition-colors"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-12 text-sm font-light text-foreground-subtle">
              <a href="#" onClick={(e) => { e.preventDefault(); }} className="flex items-center gap-2 hover:text-foreground-muted transition-colors">
                <Mail size={14} /> contact@medifusionvision.com
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); }} className="flex items-center gap-2 hover:text-foreground-muted transition-colors">
                <Phone size={14} /> +92-51-xxx-xxxx
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={14} /> COMSATS University, Islamabad
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          12. FOOTER
         ════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] py-10 md:py-14 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-4">
                <AnimatedLogo size={32} />
                <span className="text-sm font-light text-foreground">
                  MediFusion <span className="text-accent">Vision</span>
                </span>
              </Link>
              <p className="text-xs font-light text-foreground-subtle leading-relaxed max-w-xs">
                AI-powered diagnostic platform for early detection of neurological and retinal conditions.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-widest mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {['Home', 'For Patients', 'For Doctors', 'About', 'Contact'].map((l) => (
                  <li key={l}>
                    <a href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs font-light text-foreground-subtle hover:text-foreground-muted transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'HIPAA Compliance'].map((l) => (
                  <li key={l}>
                    <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-xs font-light text-foreground-subtle hover:text-foreground-muted transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/[0.04] text-center">
            <p className="text-[11px] font-light text-foreground-subtle/50">
              &copy; 2026 MediFusion Vision &mdash; COMSATS University, Islamabad. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
