import React from "react";
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

// Reusable info card w/ semantic tokens
const InfoCard = ({ icon, title, children }) => (
  <div className="p-6 rounded-xl shadow-card hover:shadow-lg transition-shadow bg-surface border border-border">
    <div className="flex items-center gap-4 mb-3">
      {icon}
      <h3 className="text-xl font-bold text-primary-text">{title}</h3>
    </div>
    <p className="text-secondary-text">{children}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans bg-background text-primary-text transition-colors">
      {/* Global Top Bar with shared theme toggle */}
      <GlobalTopBar
        brand="PPL"
        navLinks={[
          { href: "#about", label: "About", type: "scroll" },
          { href: "#how-it-works", label: "How It Works", type: "scroll" },
          { href: "#course", label: "Course", type: "scroll" },
          { href: "#why-ppl", label: "Why PPL", type: "scroll" },
          { href: "/competitions", label: "Competitions", type: "route" },
        ]}
        showRegister
      />

      {/* Hero */}
      <section className="relative text-center py-24 sm:py-32 px-4 overflow-hidden bg-surface/60">
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-40 -translate-x-16 -translate-y-16 blur-2xl bg-primary/20" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-40 translate-x-16 translate-y-16 blur-2xl bg-primary-hover/20" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tighter text-primary-text">
            Where Student Projects Meet Real Investors
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-secondary-text">
            Transform your college projects into successful startups. Compete, learn, and pitch to real investors through PPL – the ultimate startup league for students.
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <RouterLink
              to="/competitions"
              className="px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-2 bg-primary text-white hover:bg-primary-hover"
            >
              <Compass className="h-5 w-5" />
              Explore Competitions
            </RouterLink>
            <RouterLink
              to="/roles"
              className="px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-2 border border-border bg-surface text-primary-text hover:bg-border"
            >
              <Rocket className="h-5 w-5" />
              Get Started
            </RouterLink>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 sm:py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary-text">About PPL</h2>
          <p className="text-lg mb-12 max-w-3xl mx-auto text-secondary-text">
            The <span className="font-bold text-primary">Premier Project League (PPL)</span> is India's first platform connecting students, colleges, and investors to turn academic projects into startup opportunities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <InfoCard
              icon={<GraduationCap className="h-12 w-12 mx-auto mb-4 text-primary" />}
              title="Entrepreneurial Knowledge"
            >
              Learn through our comprehensive Startup Course.
            </InfoCard>
            <InfoCard
              icon={<Target className="h-12 w-12 mx-auto mb-4 text-primary" />}
              title="Compete & Excel"
            >
              Challenge top projects from other colleges.
            </InfoCard>
            <InfoCard
              icon={<TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />}
              title="Pitch to Investors"
            >
              Present to industry experts and investors.
            </InfoCard>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-primary-text">How PPL Works</h2>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      <section id="course" className="py-20 sm:py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary-text">PPL Startup Course</h2>
          <p className="text-lg mb-12 text-secondary-text">
            An 8-week program to build a validated business model and a pitch deck.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <section id="why-ppl" className="py-20 sm:py-24 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-primary-text">Why PPL?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <InfoCard icon={<GraduationCap className="h-8 w-8 text-primary" />} title="For Students">
              Opportunity to convert projects into real startups with investor backing.
            </InfoCard>
            <InfoCard icon={<School className="h-8 w-8 text-primary" />} title="For Colleges">
              Showcase innovation and attract industry partnerships to your campus.
            </InfoCard>
            <InfoCard icon={<Briefcase className="h-8 w-8 text-primary" />} title="For Investors">
              Early access to high-potential student startups with fresh ideas.
            </InfoCard>
          </div>
        </div>
      </section>

      {/* Evaluation */}
      <section className="py-20 sm:py-24 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-primary-text">Evaluation Criteria</h2>
          <div className="p-8 rounded-xl shadow-card bg-surface border border-border">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                "Innovation & Creativity",
                "Market Relevance",
                "Feasibility & Execution Potential",
                "Scalability",
                "Impact (Social/Economic/Environmental)",
              ].map((criteria) => (
                <li key={criteria} className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-primary-text">{criteria}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Investor Day */}
      <section className="py-20 sm:py-24 px-4 text-white bg-primary">
        <div className="max-w-6xl mx-auto text-center">
          <Award className="h-16 w-16 mx-auto mb-6 text-white" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Investor Day: The Grand Finale</h2>
          <p className="text-lg mb-12 max-w-3xl mx-auto text-white/90">
            Top student teams pitch to a panel of investors, mentors, and incubators.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "💰", title: "Potential Investments", desc: "Secure funding for your startup journey." },
              { icon: "🤝", title: "Industry Mentorship", desc: "Get guidance from experienced professionals." },
              { icon: "🎓", title: "Incubation Opportunities", desc: "Access top incubators and accelerators." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg p-6 bg-white/10 border border-white/20 backdrop-blur-sm">
                <h3 className="text-4xl mb-3">{item.icon}</h3>
                <h4 className="font-semibold text-lg mb-2 text-white">{item.title}</h4>
                <p className="text-white/90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary-text">Join the Movement</h2>
              <p className="text-lg mb-8 text-secondary-text">
                Whether you're a student with a big idea, a college fostering innovation, or an investor looking for the next big thing—PPL is for you.
              </p>
            </div>
            <div className="space-y-6">
              {[
                { title: "Students", color: "primary", to: "/roles", desc: "Take your project beyond the classroom." },
                { title: "Colleges", color: "primary", to: "/roles", desc: "Empower your students to become founders." },
                { title: "Investors", color: "primary", to: "/roles", desc: "Discover tomorrow's startups, today." },
              ].map((card) => (
                <div key={card.title} className="p-6 rounded-lg shadow-card border border-border bg-surface flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{card.title}</h3>
                    <p className="text-secondary-text">{card.desc}</p>
                  </div>
                  <RouterLink
                    to={card.to}
                    className="px-6 py-2 rounded-full font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
                  >
                    {card.title === "Students" ? "Register Now" : card.title === "Colleges" ? "Partner With Us" : "Get Started"}
                  </RouterLink>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="contact" className="py-16 px-4 bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-primary" />
            <span className="ml-3 text-2xl font-bold tracking-tight text-primary-text">
              Premier Project League
            </span>
          </div>
          <div className="flex items-center justify-center gap-4 my-8">
            <Mail className="h-5 w-5 text-secondary-text" />
            <a href="mailto:contact@ppl.com" className="text-lg text-secondary-text hover:text-primary-text transition-colors">
              contact@ppl.com
            </a>
          </div>
          <div className="flex justify-center gap-6 mb-8 text-secondary-text">
            <a href="#" className="hover:text-primary-text transition-colors"><Linkedin className="h-7 w-7" /></a>
            <a href="#" className="hover:text-primary-text transition-colors"><Instagram className="h-7 w-7" /></a>
            <a href="#" className="hover:text-primary-text transition-colors"><Twitter className="h-7 w-7" /></a>
            <a href="#" className="hover:text-primary-text transition-colors"><Youtube className="h-7 w-7" /></a>
          </div>
          <p className="text-secondary-text">
            © {new Date().getFullYear()} Premier Project League. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
