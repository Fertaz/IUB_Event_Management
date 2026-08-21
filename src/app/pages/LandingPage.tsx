import React from "react";
import { Link } from "react-router";
import { ArrowRight, Calendar, Users, Target } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 overflow-x-hidden font-sans">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Campus<span className="text-blue-500">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-white text-neutral-300 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-blue-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <img src="/landing_hero.jpg" alt="Campus Hub" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/50 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Your Campus Life, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Elevated.
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-neutral-400 mb-8 max-w-xl leading-relaxed">
              Discover events, join clubs, and connect with your university community in one unified, seamlessly designed platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-neutral-950 px-8 py-4 rounded-full font-bold text-lg hover:bg-neutral-200 transition-colors">
                Join Campus Hub
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/events" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-white/20 transition-colors">
                Explore Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-neutral-950 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Everything you need</h2>
            <p className="text-neutral-400 text-lg">Designed exclusively for students, by students.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors group">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Event Discovery</h3>
              <p className="text-neutral-400 leading-relaxed">Never miss out. Browse, RSVP, and manage your tickets for all upcoming campus events.</p>
            </div>
            
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors group">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Club Management</h3>
              <p className="text-neutral-400 leading-relaxed">Join societies, track memberships, and engage with communities that share your passion.</p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-colors group">
              <div className="w-14 h-14 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Dashboard</h3>
              <p className="text-neutral-400 leading-relaxed">Stay organized with a personalized dashboard highlighting your next activities and notifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to dive in?</h2>
          <p className="text-xl text-neutral-400 mb-10">
            Sign up today and start experiencing campus life like never before.
          </p>
          <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-all">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold text-white">Campus<span className="text-blue-500">Hub</span></div>
          <p className="text-neutral-500 text-sm">© {new Date().getFullYear()} IUB Campus Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
