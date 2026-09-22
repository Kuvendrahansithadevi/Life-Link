import React, { useEffect, useRef, useState } from "react";

import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Droplet,
  Heart,
  Hospital,
  Languages,
  LocateFixed,
  Menu,
  MessageCircle,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const sections = [
  ["home", "Home"],
  ["features", "Features"],
  ["about", "About"],
  ["how-it-works", "How It Works"],
  ["team", "Team"],
  ["contact", "Contact"],
];

const featureItems = [
  [
    Activity,
    "AI Symptom Triage",
    "Describe symptoms by text, voice, or image and receive urgency-aware guidance.",
  ],
  [
    Hospital,
    "Find Nearby Hospitals",
    "Explore nearby hospitals, specialists, availability, distance, and appointment options.",
  ],
  [
    Siren,
    "Emergency Mode",
    "Move quickly from a serious triage result to ambulance access, location, and care pathways.",
  ],
  [
    Droplet,
    "Blood Network",
    "Register as a donor, find compatible support, and respond to community blood requests.",
  ],
  [
    Languages,
    "Multilingual Support",
    "Use the symptom experience in English, Telugu, Hindi, Tamil, or Kannada.",
  ],
  [
    UserRound,
    "Personal Care Profile",
    "Keep your profile, appointments, donor details, and emergency contacts together.",
  ],
  [
    MessageCircle,
    "Emergency Contacts",
    "Save trusted contacts and prepare SMS or WhatsApp updates with your location.",
  ],
  [
    CalendarDays,
    "Appointments",
    "Book care with hospitals and keep upcoming visits accessible in one place.",
  ],
];

const teamMembers = [
  {
    name: "Hansitha Devi Kuvendra",
    role: "AI & Backend Developer",
    image: "/team/Hansitha.jpeg",
  },
  {
    name: "Supriya Kayala",
    role: "Backend & API Developer",
    image: "/team/Supriya.jpeg",
  },
  {
    name: "Kavya Nulu",
    role: "Frontend & UI Developer",
    image: "/team/Kavya.jpeg",
  },
  {
    name: "Madhu Sree Nallamsetti",
    role: "Creative Director & UI Designer",
    image: "/team/Madhu.jpeg",
  },
];

function Logo({ light = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${
          light ? "bg-white text-emerald-700" : "bg-emerald-800 text-white"
        }`}
      >
        <Heart className="h-5 w-5" fill="currentColor" />

        <Activity
          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full p-0.5 text-white ring-2 ${
            light
              ? "bg-emerald-400 ring-emerald-950"
              : "bg-red-500 ring-white"
          }`}
        />
      </span>

      <span>
        <span
          className={`block text-sm font-black tracking-[0.16em] ${
            light ? "text-white" : "text-emerald-950"
          }`}
        >
          LIFE-LINK
        </span>

        <span
          className={`block text-[9px] font-semibold tracking-wide ${
            light ? "text-emerald-200" : "text-stone-500"
          }`}
        >
          Your health. Our priority.
        </span>
      </span>
    </span>
  );
}

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal ${
        visible ? "landing-reveal-visible" : ""
      } ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Heading({ eyebrow, title, text, light = false }) {
  return (
    <div className="max-w-2xl">
      <p
        className={`text-xs font-bold uppercase tracking-[0.22em] ${
          light ? "text-emerald-200" : "text-emerald-700"
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-3 text-3xl font-black tracking-tight sm:text-5xl ${
          light ? "text-white" : "text-emerald-950"
        }`}
      >
        {title}
      </h2>

      <p
        className={`mt-5 text-base leading-7 ${
          light ? "text-emerald-50/75" : "text-stone-600"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto min-h-[470px] w-full max-w-xl rounded-[2.5rem] border border-white/80 bg-white/45 p-6 shadow-2xl shadow-emerald-900/10 backdrop-blur-sm sm:p-10">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[22px] border-white/70" />

      <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-emerald-200/50 blur-2xl" />

      <div className="relative flex min-h-[410px] items-center justify-center">
        <div className="absolute left-0 top-8 rounded-2xl border border-white bg-white/90 p-3 shadow-xl sm:left-2">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <Activity className="h-5 w-5" />
            </span>

            <span>
              <span className="block text-[10px] font-bold text-stone-400">
                START HERE
              </span>

              <span className="block text-xs font-bold text-emerald-950">
                Symptom triage
              </span>
            </span>
          </div>
        </div>

        <div className="absolute bottom-5 right-0 rounded-2xl border border-white bg-white/90 p-3 shadow-xl sm:right-2">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-red-100 p-2 text-red-600">
              <Siren className="h-5 w-5" />
            </span>

            <span>
              <span className="block text-[10px] font-bold text-stone-400">
                WHEN IT MATTERS
              </span>

              <span className="block text-xs font-bold text-emerald-950">
                Emergency support
              </span>
            </span>
          </div>
        </div>

        <div className="relative flex h-[350px] w-[210px] rotate-[-6deg] flex-col rounded-[2rem] border-[8px] border-emerald-950 bg-emerald-950 p-2 shadow-2xl transition-transform duration-700 hover:rotate-0">
          <div className="flex h-full flex-col rounded-[1.4rem] bg-gradient-to-b from-emerald-50 to-white p-4">
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Heart className="h-4 w-4" fill="currentColor" />
              </span>

              <span className="h-1.5 w-12 rounded-full bg-emerald-200" />
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              LIFE-LINK
            </p>

            <p className="mt-1 text-lg font-black leading-none text-emerald-950">
              Care,
              <br />
              connected.
            </p>

            <div className="mt-7 space-y-2">
              <div className="rounded-xl bg-emerald-700 p-3 text-white">
                <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-100">
                  Quick start
                </p>

                <p className="mt-1 text-xs font-bold">Explain symptoms</p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-stone-100">
                <LocateFixed className="h-4 w-4 text-emerald-600" />

                <span className="text-[10px] font-bold text-stone-600">
                  Find nearby care
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-stone-100">
                <Droplet className="h-4 w-4 text-red-500" />

                <span className="text-[10px] font-bold text-stone-600">
                  Blood network
                </span>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-2 border-t border-stone-100 pt-3 text-[9px] font-semibold text-stone-400">
              <Activity className="h-3 w-3 text-emerald-500" />
              Here for every next step
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onLogin, onSignup }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      setProgress(
        scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0
      );
    };

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) =>
            entry.isIntersecting && setActiveSection(entry.target.id)
        ),
      { rootMargin: "-35% 0px -55%" }
    );

    sections.forEach(([id]) => {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    });

    window.addEventListener("scroll", updateProgress, {
      passive: true,
    });

    updateProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    setMenuOpen(false);
  };

  return (
    <div className="landing-page bg-[#f8fbfa] text-stone-900">
      {/* Scroll progress */}
      <div
        className="fixed left-0 top-0 z-[60] h-1 bg-emerald-500"
        style={{ width: `${progress}%` }}
      />

      {/* Header */}
      <header className="fixed inset-x-0 top-1 z-50 border-b border-emerald-950/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => scrollTo("home")}
            aria-label="Go to Life-Link home"
          >
            <Logo />
          </button>

          <nav className="hidden items-center gap-7 lg:flex">
            {sections.map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`text-xs font-semibold transition-colors ${
                  activeSection === id
                    ? "text-emerald-700"
                    : "text-stone-500 hover:text-emerald-700"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={onLogin}
              className="rounded-full border border-emerald-700 px-5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
            >
              Login
            </button>

            <button
              onClick={onSignup}
              className="rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-600"
            >
              Sign Up
            </button>
          </div>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-emerald-900 sm:hidden"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-stone-100 bg-white px-5 py-4 sm:hidden">
            <div className="grid gap-1">
              {sections.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-stone-600 hover:bg-emerald-50"
                >
                  {label}
                </button>
              ))}

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
                <button
                  onClick={onLogin}
                  className="rounded-full border border-emerald-700 py-2.5 text-xs font-bold text-emerald-800"
                >
                  Login
                </button>

                <button
                  onClick={onSignup}
                  className="rounded-full bg-emerald-700 py-2.5 text-xs font-bold text-white"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section
          id="home"
          className="relative isolate overflow-hidden scroll-mt-24 pt-28"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(189,242,222,0.55),transparent_32%),radial-gradient(circle_at_85%_30%,rgba(207,224,255,0.7),transparent_30%),linear-gradient(135deg,#f7fcfa_0%,#eefaf5_48%,#f7f3ff_100%)]" />

          <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:pb-28">
            <Reveal className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                AI-powered healthcare assistance
              </div>

              <h1 className="mt-6 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-emerald-950 sm:text-7xl">
                Your health.
                <br />
                <span className="text-emerald-600">Our priority.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-stone-600">
                Smart, simple support for the moments when healthcare feels
                complicated. LIFE-LINK brings guidance, nearby care, emergency
                help, and community support into one connected experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={onSignup}
                  className="group inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-700/20 hover:bg-emerald-600"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => scrollTo("features")}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-700/25 bg-white/70 px-6 py-3.5 text-sm font-bold text-emerald-800 hover:bg-white"
                >
                  Explore LIFE-LINK
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-12 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-stone-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Guidance when you need it
                </span>

                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Built around care
                </span>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <HeroVisual />
            </Reveal>
          </div>

          <div className="mx-auto grid max-w-7xl grid-cols-2 border-t border-emerald-900/10 bg-white/60 sm:grid-cols-5">
            {[
              [Activity, "AI triage"],
              [Hospital, "Find care"],
              [Siren, "Emergency"],
              [Droplet, "Blood network"],
              [Languages, "Your language"],
            ].map(([Icon, label]) => (
              <div
                key={label}
                className="flex items-center gap-2 border-r border-emerald-900/10 px-4 py-4 text-xs font-bold text-stone-600 sm:justify-center"
              >
                <Icon className="h-4 w-4 text-emerald-600" />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="scroll-mt-24 bg-white px-5 py-24 sm:px-8 lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <Reveal>
              <Heading
                eyebrow="Why LIFE-LINK?"
                title="A clearer next step for everyday care."
                text="Healthcare can become confusing and stressful, especially when time, language, or distance gets in the way. LIFE-LINK connects the first question to the next useful action."
              />
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  Activity,
                  "AI-powered intelligence",
                  "Structured triage helps you understand urgency and possible next steps.",
                ],
                [
                  Clock3,
                  "Available when you are",
                  "Start with text or voice support whenever a question comes up.",
                ],
                [
                  ShieldCheck,
                  "Trusted and careful",
                  "Clear guidance, privacy-minded flows, and no definitive diagnosis claims.",
                ],
                [
                  UsersRound,
                  "Community driven",
                  "Hospitals, donors, and families can stay connected around real needs.",
                ],
              ].map(([Icon, title, text], index) => (
                <Reveal key={title} delay={index * 80}>
                  <div className="rounded-2xl border border-stone-100 bg-[#f7fbfa] p-6 transition hover:-translate-y-1 hover:shadow-xl">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>

                    <h3 className="mt-5 font-bold text-emerald-950">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-stone-500">
                      {text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="scroll-mt-24 bg-[#f2f8f6] px-5 py-24 sm:px-8 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <Heading
                eyebrow="What LIFE-LINK brings together"
                title="Complete healthcare support, in one place."
                text="Explore the tools already built into the LIFE-LINK experience, designed to help you move from uncertainty to informed action."
              />
            </Reveal>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featureItems.map(([Icon, title, text], index) => (
                <Reveal key={title} delay={(index % 4) * 70}>
                  <article className="group flex min-h-[245px] flex-col rounded-2xl border border-white bg-white p-6 shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
                    <div className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="text-xs font-black text-emerald-200">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className="mt-8 font-bold text-emerald-950">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-stone-500">
                      {text}
                    </p>

                    <ArrowUpRight className="mt-auto h-4 w-4 text-emerald-500 opacity-0 transition group-hover:opacity-100" />
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="scroll-mt-24 bg-emerald-950 px-5 py-24 text-white sm:px-8 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <Heading
                light
                eyebrow="How LIFE-LINK works"
                title="From a concern to a clearer next step."
                text="A simple flow that helps you explain what is happening, understand the response, and connect with the right kind of support."
              />
            </Reveal>

            <div className="relative mt-16 grid gap-5 md:grid-cols-4">
              {[
                [
                  Activity,
                  "Describe your symptoms",
                  "Use text, voice, or an image to tell us how you feel.",
                ],
                [
                  Activity,
                  "Get AI analysis",
                  "Receive urgency, guidance, and a recommended specialist.",
                ],
                [
                  LocateFixed,
                  "Find the right care",
                  "Discover hospitals, availability, directions, and booking options.",
                ],
                [
                  UsersRound,
                  "Stay connected",
                  "Keep your profile, contacts, bookings, and donor support close.",
                ],
              ].map(([Icon, title, text], index) => (
                <Reveal key={title} delay={index * 100}>
                  <article className="relative h-full rounded-2xl border border-white/10 bg-white/[0.07] p-6 transition hover:bg-white/[0.12]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-300">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <Icon className="h-5 w-5 text-emerald-300" />
                    </div>

                    <h3 className="mt-10 font-bold">{title}</h3>

                    <p className="mt-2 text-sm leading-6 text-emerald-100/65">
                      {text}
                    </p>
                  </article>

                  {index < 3 && (
                    <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 text-emerald-300 md:block" />
                  )}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section className="bg-[#f7f3ff] px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <Reveal>
              <Heading
                eyebrow="Why choose LIFE-LINK"
                title="More than an app. A more connected way to begin."
                text="LIFE-LINK is designed for practical access: useful information, relevant choices, and human connection without overstating what technology can do."
              />

              <button
                onClick={onSignup}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600"
              >
                Start your journey
                <ArrowRight className="h-4 w-4" />
              </button>
            </Reveal>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [
                  LocateFixed,
                  "Better access",
                  "Bring care discovery closer to where you are.",
                ],
                [
                  Siren,
                  "Faster response",
                  "Keep emergency actions visible when every second matters.",
                ],
                [
                  Languages,
                  "Your language",
                  "Choose a language that feels natural to you.",
                ],
                [
                  ShieldCheck,
                  "Privacy-minded",
                  "Use clear, respectful flows for personal health information.",
                ],
                [
                  UsersRound,
                  "Community support",
                  "Connect donor and hospital support around real requests.",
                ],
                [
                  Stethoscope,
                  "Care navigation",
                  "Move from symptoms to specialists and appointments.",
                ],
              ].map(([Icon, title, text], index) => (
                <Reveal key={title} delay={index * 60}>
                  <div className="flex gap-4 rounded-xl border border-white bg-white/75 p-4 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Icon className="h-4 w-4" />
                    </span>

                    <div>
                      <h3 className="text-sm font-bold text-emerald-950">
                        {title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-stone-500">
                        {text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* TEAM */}
        <section
          id="team"
          className="scroll-mt-24 bg-white px-5 py-24 sm:px-8 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <Heading
                eyebrow="Meet the people behind it"
                title="The team behind LIFE-LINK."
                text="Meet the team behind LIFE-LINK, bringing together AI, backend development, frontend design, and creative direction."
              />
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member, index) => (
                <Reveal key={member.name} delay={index * 70}>
                  <article className="overflow-hidden rounded-2xl border border-stone-100 bg-[#f7fbfa] transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="h-56 overflow-hidden bg-gradient-to-br from-emerald-100 via-white to-[#f5eefe]">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-emerald-950">
                        {member.name}
                      </h3>

                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-emerald-600">
                        {member.role}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-stone-500">
                        B.Tech 3rd Year • Data Science • Aditya University
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section
          id="contact"
          className="scroll-mt-24 bg-emerald-950 px-5 py-20 text-white sm:px-8"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                LIFE-LINK
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Healthcare support, connected.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-100/70">
                Explore LIFE-LINK and discover a simpler way to connect
                symptoms, care, emergency support, and community resources.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <button
                onClick={onSignup}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-emerald-900/10 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <Logo />

          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} LIFE-LINK. AI-powered healthcare
            assistance.
          </p>

          <button
            onClick={() => scrollTo("home")}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-600"
          >
            Back to top ↑
          </button>
        </div>
      </footer>
    </div>
  );
}