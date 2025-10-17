import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Rocket,
  GraduationCap,
  Briefcase,
  Compass,
  School,
  TrendingUp,
  Target,
  Award,
  Mail,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  CheckCircle,
} from "lucide-react";

import GlobalTopBar from "../components/GlobalTopBar";
import { useAuth } from "../hooks/useAuth";
import ContactModal from "../components/ContactModal";
import TermsModal from "../components/TermsModal";
import PrivacyModal from "../components/PrivacyModal";
import RefundModal from "../components/refundmodal";
import Courses from "../pages/courses.jsx";

// InfoCard
const InfoCard = ({ Icon, title, children }) => (
  <div className="p-5 sm:p-6 rounded-xl shadow-card hover:shadow-lg transition-shadow bg-surface border border-border text-center sm:text-left">
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-3">
      {Icon ? (
        <Icon className="h-6 w-6 text-primary" />
      ) : (
        <span className="text-primary font-semibold text-lg">PPL</span>
      )}
      <h3 className="text-lg sm:text-xl font-bold text-primary-text">{title}</h3>
    </div>
    <p className="text-secondary-text text-sm sm:text-base">{children}</p>
  </div>
);

export default function LandingPage({ embedded = false }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [RefundOpen, setRefundOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth?.() || {};
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const exploreTo = isAuthenticated
    ? `${isAdmin ? "/admin" : "/main"}?tab=competitions`
    : "/competitions";

  // Calculate dynamic scroll offset based on mobile menu state
  const getScrollOffset = () => {
    if (mobileMenuOpen) {
      return -200; // Account for mobile menu height when open
    }
    return -80; // Normal offset when menu is closed
  };

  return (
    <div className="min-h-screen font-sans bg-background text-primary-text transition-colors">
      {!embedded && (
        <GlobalTopBar
          brand="PPL"
          navLinks={[
            { href: "#about", label: "About", type: "scroll" },
            { href: "#how-it-works", label: "How It Works", type: "scroll" },
            { href: "/courses", label: "Courses", type: "route" },
            { href: "#why-ppl", label: "Why PPL", type: "scroll" },
            { href: "/competitions", label: "Competitions", type: "route" },
          ]}
          showRegister
          onMobileMenuToggle={setMobileMenuOpen}
          scrollOffset={getScrollOffset()}
        />
      )}

      {/* Hero */}
      <section className="relative text-center pt-20 pb-16 sm:pt-24 sm:pb-24 md:pt-32 md:pb-32 px-4 overflow-hidden bg-surface/60 safe-top">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-primary-text">
            Where Student Projects Meet Real Investors
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto text-secondary-text">
            Transform college projects into successful startups. Compete, learn,
            and pitch to real investors through PPL – the ultimate startup
            league for students.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center w-full sm:w-auto">
            <RouterLink
              to={exploreTo}
              className="px-6 sm:px-8 py-3 rounded-full font-semibold bg-primary text-white hover:bg-primary-hover transition-all duration-300 transform hover:scale-[1.02] text-center touch-manipulation"
            >
              <div className="flex items-center justify-center gap-2">
              <Compass className="h-5 w-5" />
                <span>Explore Competitions</span>
              </div>
            </RouterLink>

            {!isAuthenticated && (
              <RouterLink
                to="/roles"
                className="px-6 sm:px-8 py-3 rounded-full font-semibold border border-border bg-surface text-primary-text hover:bg-border transition-all duration-300 transform hover:scale-[1.02] text-center touch-manipulation"
              >
                <div className="flex items-center justify-center gap-2">
                <Rocket className="h-5 w-5" />
                  <span>Get Started</span>
                </div>
              </RouterLink>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-primary-text">
            About PPL
          </h2>
          <p className="text-base sm:text-lg mb-10 sm:mb-12 text-secondary-text max-w-3xl mx-auto">
            The{" "}
            <span className="font-bold text-primary">
              Premier Project League (PPL)
            </span>{" "}
            is India's first platform connecting students, colleges, and
            investors to turn academic projects into startup opportunities.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
            <InfoCard Icon={GraduationCap} title="Entrepreneurial Skills">
              Learn through our comprehensive Startup Course.
            </InfoCard>
            <InfoCard Icon={Target} title="Compete & Excel">
              Challenge top projects from other colleges.
            </InfoCard>
            <InfoCard Icon={TrendingUp} title="Pitch to Investors">
              Present to industry experts and investors.
            </InfoCard>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 sm:mb-16 text-primary-text">
            How PPL Works
          </h2>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="absolute top-1/2 left-0 w-full h-px hidden lg:block bg-border" />
            {[
              { num: 1, title: "Register", desc: "Students or colleges register their projects on the PPL platform." },
              { num: 2, title: "Learn", desc: "Go through our 8-Week Startup Course to refine ideas." },
              { num: 3, title: "Compete", desc: "Projects are evaluated and top teams are shortlisted." },
              { num: 4, title: "Pitch Day", desc: "Top projects pitch directly to investors during PPL Investor Day." },
            ].map((step) => (
              <div
                key={step.num}
                className="relative rounded-xl p-6 shadow-card hover:shadow-lg transition-all transform hover:-translate-y-1 bg-surface border border-border"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 bg-primary border-background">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-3 mt-8 text-center text-primary-text">
                  {step.title}
                </h3>
                <p className="text-center text-secondary-text">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course */}
      <section id="course" className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary-text">
            PPL Startup Course
          </h2>
        <p className="text-base sm:text-lg mb-10 sm:mb-12 text-secondary-text">
            An 8-week program to build a validated business model and a pitch deck.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              "Ideation & Validation",
              "Business Model Basics",
              "MVP & Prototyping",
              "Market Research",
              "Financials & Funding 101",
              "Pitching & Storytelling",
              "Legal & Startup Essentials",
              "Demo & Investor Prep",
            ].map((topic) => (
              <div
                key={topic}
                className="rounded-lg p-4 text-center font-medium bg-surface text-primary-text border border-border hover:bg-border transition-colors"
              >
                {topic}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why PPL */}
      <section id="why-ppl" className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-12 text-primary-text">
            Why PPL?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <InfoCard
              Icon={GraduationCap}
              title="For Students"
            >
              Opportunity to convert projects into real startups with investor backing.
            </InfoCard>
            <InfoCard
              Icon={School}
              title="For Colleges"
            >
              Showcase innovation and attract industry partnerships to your campus.
            </InfoCard>
            <InfoCard
              Icon={Briefcase}
              title="For Investors"
            >
              Early access to high-potential student startups with fresh ideas.
            </InfoCard>
          </div>
        </div>
      </section>

      {/* Evaluation */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-12 text-primary-text">
            Evaluation Criteria
          </h2>
          <div className="p-6 sm:p-8 rounded-xl shadow-card bg-surface border border-border">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4">
              {[
                "Innovation & Creativity",
                "Market Relevance",
                "Feasibility & Execution Potential",
                "Scalability",
                "Impact (Social/Economic/Environmental)",
              ].map((criteria) => (
                <li key={criteria} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  <span className="text-primary-text">{criteria}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Investor Day */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 text-white bg-primary">
        <div className="max-w-6xl mx-auto text-center">
          <Award className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-5 sm:mb-6 text-white" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Investor Day: The Grand Finale
          </h2>
          <p className="text-base sm:text-lg mb-10 sm:mb-12 max-w-3xl mx-auto text-white/90">
            Top student teams pitch to a panel of investors, mentors, and incubators.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { icon: "💰", title: "Potential Investments", desc: "Secure funding for your startup journey." },
              { icon: "🤝", title: "Industry Mentorship", desc: "Get guidance from experienced professionals." },
              { icon: "🎓", title: "Incubation Opportunities", desc: "Access top incubators and accelerators." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg p-6 bg-white/10 border border-white/20 backdrop-blur-sm"
              >
                <h3 className="text-4xl mb-3">{item.icon}</h3>
                <h4 className="font-semibold text-lg mb-2 text-white">{item.title}</h4>
                <p className="text-white/90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Footer / Contact ===== */}
<footer
  id="contact"
  role="contentinfo"
  className="bg-surface border-t border-border"
>
  <div className="max-w-7xl mx-auto px-4 py-16">
    {/* Top grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
      {/* Brand + short blurb */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Rocket className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight text-primary-text">
            Premier Project League
          </span>
        </div>
        <p className="text-secondary-text">
          Turning student projects into real startups through competitions,
          mentorship, and investor connections.
        </p>

        {/* Socials */}
        <div className="flex items-center gap-5 mt-6">
          <a
            aria-label="LinkedIn"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-text hover:text-primary-text transition-colors"
          >
            <Linkedin className="h-6 w-6" />
          </a>
          <a
            aria-label="Instagram"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-text hover:text-primary-text transition-colors"
          >
            <Instagram className="h-6 w-6" />
          </a>
          <a
            aria-label="Twitter/X"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-text hover:text-primary-text transition-colors"
          >
            <Twitter className="h-6 w-6" />
          </a>
          <a
            aria-label="YouTube"
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-text hover:text-primary-text transition-colors"
          >
            <Youtube className="h-6 w-6" />
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h4 className="text-sm font-semibold tracking-wider text-secondary-text uppercase mb-4">
          Quick Links
        </h4>
        <ul className="space-y-3">
          <li>
            <RouterLink
              to="/competitions"
              className="text-primary-text/90 hover:text-primary transition-colors"
            >
              Competitions
            </RouterLink>
          </li>
          <li>
            <RouterLink
              to="/roles"
              className="text-primary-text/90 hover:text-primary transition-colors"
            >
              Get Started
            </RouterLink>
          </li>
          <li>
            <a
              href="#course"
              className="text-primary-text/90 hover:text-primary transition-colors"
            >
              Startup Course
            </a>
          </li>
          <li>
            <a
              href="#why-ppl"
              className="text-primary-text/90 hover:text-primary transition-colors"
            >
              Why PPL
            </a>
          </li>
        </ul>
      </div>

      {/* Legal (open modals like Contact) */}
      <div>
        <h4 className="text-sm font-semibold tracking-wider text-secondary-text uppercase mb-4">
          Legal
        </h4>
        <ul className="space-y-3">
          <li>
            <button
              type="button"
              onClick={() => setTermsOpen(true)}
              className="text-left text-primary-text/90 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
            >
              Terms &amp; Conditions
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="text-left text-primary-text/90 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
            >
              Privacy Policy
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setRefundOpen(true)}
              className="text-left text-primary-text/90 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
            >
              Refund &amp; Cancellation
            </button>
          </li>
        </ul>
      </div>

      {/* Newsletter / Contact */}
      <div>
        <h4 className="text-sm font-semibold tracking-wider text-secondary-text uppercase mb-4">
          Stay in the loop
        </h4>
        <p className="text-secondary-text mb-4">
          Get updates on new competitions and Investor Day announcements.
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-lg px-4 py-3 bg-background border border-border text-primary-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-surface touch-manipulation text-center md:text-center"
          >
            Join
          </button>
        </form>

        {/* Contact line */}
        <div className="flex items-start sm:items-center gap-3 mt-6">
          <Mail className="h-5 w-5 text-secondary-text mt-0.5 sm:mt-0" />
          <a
            href="mailto:contact@ppl.com"
            className="text-primary-text hover:text-primary transition-colors break-all"
          >
            support@theppl.com
          </a>
        </div>
      </div>
    </div>

    {/* Divider */}
    <div className="h-px bg-border my-10" />

    {/* Bottom bar */}
    <div className="flex flex-col gap-3 items-center justify-between text-sm text-secondary-text md:flex-row">
      <p className="text-center md:text-left">
        © {new Date().getFullYear()} Premier Project League. All rights reserved.
      </p>
      <p className="text-center md:text-left">
        Powered by <br/> YB Educators
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setTermsOpen(true)}
          className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1"
        >
          Terms
        </button>
        <span className="opacity-40">|</span>
        <button
          type="button"
          onClick={() => setPrivacyOpen(true)}
          className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1"
        >
          Privacy
        </button>
        <span className="opacity-40">|</span>
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="hover:text-primary transition-colors underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1"
        >
          Contact
        </button>
      </div>
    </div>
  </div>
</footer>

{/* Modals */}
<ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
<TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
<PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
<RefundModal open={RefundOpen} onClose={() => setRefundOpen(false)} />

    </div>
  );
}
