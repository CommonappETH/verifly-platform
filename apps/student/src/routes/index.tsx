import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  GraduationCap, Shield, Globe, Users, CheckCircle2, ArrowRight,
  UserPlus, Search, FileText, Building2, BarChart3, Star, ChevronRight,
} from "lucide-react";
import { universities } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verifly — Simplify University Applications & Financial Verification" },
      { name: "description", content: "Discover universities, apply, and get financially pre-verified — all in one platform built for international students." },
      { property: "og:title", content: "Verifly — Simplify University Applications" },
      { property: "og:description", content: "Discover universities, apply, and get financially pre-verified — all in one platform." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <HowItWorks />
      <Benefits />
      <PreVerification />
      <UniversityShowcase />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">V</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Verifly</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#universities" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Universities</a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/dashboard">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/40 via-background to-background" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Trusted by 2,000+ international students
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Simplify Your Path to{" "}
            <span className="text-primary">International Education</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Explore universities, apply to schools, and track your financial verification — all in one platform designed for students applying from anywhere in the world.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 text-base px-8">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard/explore">
              <Button variant="outline" size="lg" className="gap-2 text-base px-8">
                <Search className="h-4 w-4" /> Explore Universities
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 mx-auto max-w-5xl">
          <div className="rounded-2xl border bg-card p-2 shadow-2xl shadow-primary/5">
            <div className="rounded-xl bg-muted/50 p-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DashboardMockCard icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Applications" value="5 Active" />
                <DashboardMockCard icon={<Shield className="h-5 w-5 text-success" />} label="Verification Status" value="Pre-Verified" />
                <DashboardMockCard icon={<GraduationCap className="h-5 w-5 text-info" />} label="Scholarships" value="$23,000 Awarded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

const steps = [
  { icon: UserPlus, title: "Create Your Profile", desc: "Set up your student profile with academic background, preferences, and financial details." },
  { icon: Search, title: "Explore Universities", desc: "Browse universities, compare programs, and understand their financial verification requirements." },
  { icon: FileText, title: "Apply to Schools", desc: "Submit applications directly through the platform and track every step of the process." },
  { icon: Shield, title: "Get Financially Pre-Verified", desc: "Work with a partner bank to verify your financial readiness before or during your application." },
  { icon: BarChart3, title: "Track Your Status", desc: "Monitor your applications, verification progress, and next steps from a single dashboard." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">How Verifly Works</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Five simple steps from discovering your dream university to getting financially verified.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="mb-1 text-xs font-semibold text-primary">Step {i + 1}</div>
              <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const benefits = [
  { icon: Shield, title: "Simplifies Financial Verification", desc: "No more confusing paperwork. Our partner banks guide you through the process." },
  { icon: GraduationCap, title: "Understand Proof of Funds", desc: "Clear explanations of what each university requires for financial evidence." },
  { icon: Globe, title: "One Connected Ecosystem", desc: "Students, universities, and banks connected in a single trusted platform." },
  { icon: Users, title: "Stronger Application Readiness", desc: "Pre-verified students may stand out with a stronger application profile." },
];

function Benefits() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Why Students Choose Verifly</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">We make international university applications clearer, faster, and more trustworthy.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <Card key={b.title} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PreVerification() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Pre-Verification vs. Non-Verified Applications</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Financial pre-verification isn't always required — but it can make a real difference in your application journey.
            </p>
            <div className="space-y-4">
              <InfoItem
                title="Pre-Verified Students"
                desc="Your financial readiness is confirmed before submission. Some universities prioritize these applications."
                positive
              />
              <InfoItem
                title="Non-Verified Students"
                desc="You can still apply! Many universities review applications before verification is complete."
                positive={false}
              />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Conditional Acceptance</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Some universities issue conditional acceptance to students who haven't completed financial verification yet. This means:
            </p>
            <ul className="space-y-3">
              {[
                "Your academic qualifications meet the school's standards",
                "You'll receive a provisional offer pending financial verification",
                "You can complete verification after receiving your conditional offer",
                "Students waiting on scholarships may only need to verify the remaining tuition amount",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoItem({ title, desc, positive }: { title: string; desc: string; positive: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${positive ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function UniversityShowcase() {
  const showcase = universities.slice(0, 6);
  return (
    <section id="universities" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Explore Partner Universities</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Discover top-ranked universities ready to welcome international students.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.map((u) => (
            <Card key={u.id} className="hover:shadow-md transition-shadow border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{u.logo}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{u.name}</h3>
                    <p className="text-xs text-muted-foreground">{u.city}, {u.country}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{u.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">From ${u.tuitionMin.toLocaleString()}/yr</span>
                  <span className="text-primary font-medium">{u.ranking}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/dashboard/explore">
            <Button variant="outline" className="gap-2">
              View All Universities <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Hana M.", country: "Ethiopia", quote: "Verifly made the entire process clear. I understood exactly what documents I needed and my pre-verification helped me stand out.", rating: 5 },
  { name: "Samuel K.", country: "Kenya", quote: "I received a conditional acceptance from Melbourne while my verification was still processing. The platform kept me informed every step.", rating: 5 },
  { name: "Fatima A.", country: "Nigeria", quote: "The scholarship-adjusted funding breakdown showed I only needed to verify half the tuition. That was a game-changer for my family.", rating: 5 },
];

function Testimonials() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">What Students Say</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Real experiences from international students who used Verifly.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/60">
              <CardContent className="p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "Do I need to be financially verified to apply?", a: "No. You can apply to universities even without financial pre-verification. However, some universities prefer or require verification, and being pre-verified can strengthen your application." },
  { q: "What is conditional acceptance?", a: "Some universities issue a provisional acceptance before your financial verification is complete. You'll need to complete verification to finalize enrollment." },
  { q: "How long does financial verification take?", a: "Processing times vary by bank partner, typically 3-7 business days. You can track the status in real-time on your dashboard." },
  { q: "Can scholarships reduce the amount I need to verify?", a: "Yes! If you've been awarded scholarships, you may only need to verify the remaining tuition amount after estimated scholarship support." },
  { q: "Which banks does Verifly partner with?", a: "Verifly partners with leading banks in several countries, including Commercial Bank of Ethiopia, Dashen Bank, and Awash Bank, with more partners being added." },
  { q: "Is Verifly free for students?", a: "Creating a Verifly account and exploring universities is free. Some verification services may have processing fees set by partner banks." },
];

function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-20 bg-primary">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">Ready to Start Your Journey?</h2>
        <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
          Join thousands of international students who trust Verifly to simplify their university applications and financial verification.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link to="/dashboard">
            <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-12 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">V</span>
              </div>
              <span className="text-lg font-bold">Verifly</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Simplifying international university applications and financial verification.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><Link to="/dashboard/explore" className="hover:text-foreground transition-colors">Universities</Link></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><span className="cursor-default">About</span></li>
              <li><span className="cursor-default">Careers</span></li>
              <li><span className="cursor-default">Blog</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Terms of Service</span></li>
              <li><span className="cursor-default">Contact</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          © 2026 Verifly. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
