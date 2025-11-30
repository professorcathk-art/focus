"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Expert {
  id: string;
  name: string;
  title: string;
  category: string;
  bio: string;
  location: string;
  verified: boolean;
}

// Mock data - will be replaced with Supabase queries
const mockExperts: Expert[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Senior Full-Stack Developer",
    category: "Website Development",
    bio: "10+ years of experience building scalable web applications",
    location: "San Francisco, CA",
    verified: true,
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    title: "Mobile App Architect",
    category: "Software Development",
    bio: "Expert in React Native and iOS development",
    location: "New York, NY",
    verified: true,
  },
  {
    id: "3",
    name: "David Kim",
    title: "Trading Strategist",
    category: "Trading",
    bio: "Professional trader with 15+ years in forex and crypto",
    location: "London, UK",
    verified: true,
  },
  {
    id: "4",
    name: "Emma Wilson",
    title: "UX Design Lead",
    category: "Design",
    bio: "Award-winning designer with expertise in user-centered design",
    location: "San Francisco, CA",
    verified: true,
  },
  {
    id: "5",
    name: "James Park",
    title: "Startup Advisor",
    category: "Entrepreneur",
    bio: "Helped launch 50+ successful startups",
    location: "Singapore",
    verified: true,
  },
  {
    id: "6",
    name: "Lisa Zhang",
    title: "Digital Marketing Director",
    category: "Marketing",
    bio: "Expert in growth marketing and brand strategy",
    location: "Hong Kong",
    verified: true,
  },
];

const categories = [
  "Website Development",
  "Software Development",
  "Trading",
  "Entrepreneur",
  "Design",
  "Marketing",
];

export function FeaturedExperts() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get featured experts (3 per category, or all if category selected)
  const getFeaturedExperts = () => {
    if (selectedCategory) {
      return mockExperts.filter((expert) => expert.category === selectedCategory).slice(0, 3);
    }
    // Show 2 experts per category
    const expertsByCategory: { [key: string]: Expert[] } = {};
    categories.forEach((cat) => {
      expertsByCategory[cat] = mockExperts.filter((expert) => expert.category === cat).slice(0, 2);
    });
    return Object.values(expertsByCategory).flat();
  };

  const featuredExperts = getFeaturedExperts();

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-custom-text mb-1 sm:mb-2 text-glow animate-pulse-glow tracking-tight">Featured Experts</h2>
            <p className="text-sm sm:text-base text-custom-text/80">Discover top industry professionals</p>
          </div>
          <Link
            href="/directory"
            className="text-custom-text hover:text-cyber-green font-semibold transition-colors text-sm sm:text-base self-start sm:self-auto"
          >
            View All →
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              selectedCategory === null
                ? "bg-cyber-green text-custom-text shadow-[0_0_15px_rgba(0,255,136,0.5)]"
                : "bg-dark-green-800/50 text-custom-text hover:bg-dark-green-800 hover:border-cyber-green/50 border border-cyber-green/20"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                selectedCategory === category
                  ? "bg-cyber-green text-custom-text shadow-[0_0_15px_rgba(0,255,136,0.5)]"
                  : "bg-dark-green-800/50 text-custom-text hover:bg-dark-green-800 hover:border-cyber-green/50 border border-cyber-green/20"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {featuredExperts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-custom-text/80">No experts found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredExperts.map((expert, index) => (
              <Link
                key={expert.id}
                href={`/expert/${expert.id}`}
                className="group bg-dark-green-800/30 backdrop-blur-sm border border-cyber-green/30 p-4 sm:p-5 rounded-xl hover:bg-dark-green-800/50 hover:border-cyber-green hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] sm:hover:scale-[1.02] animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-cyber-green group-hover:text-glow transition-all truncate">{expert.name}</h3>
                      {expert.verified && (
                        <span className="text-cyber-green animate-pulse-glow flex-shrink-0" title="Verified Expert">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-custom-text/80 font-medium text-xs sm:text-sm">{expert.title}</p>
                  </div>
                </div>
                <p className="text-custom-text/70 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{expert.bio}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-cyber-green bg-dark-green-900/50 px-2 py-1 rounded-full border border-cyber-green/30 truncate">
                    {expert.category}
                  </span>
                  <span className="text-xs text-custom-text/70 truncate">{expert.location}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!selectedCategory && (
          <div className="text-center mt-6 sm:mt-8">
            <Link
              href="/directory"
              className="inline-block bg-cyber-green text-custom-text px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold hover:bg-cyber-green-light transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(0,255,136,0.5)] animate-pulse-glow"
            >
              View All Experts
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

