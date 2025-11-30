"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Expert {
  id: string;
  name: string;
  title: string;
  category: string;
  bio: string;
  location: string;
  verified: boolean;
  avatarUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

export function ExpertDirectory() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const supabase = createClient();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || "");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch categories and countries
  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesRes, countriesRes] = await Promise.all([
          supabase.from("categories").select("id, name").order("name"),
          supabase.from("countries").select("id, name, code").order("name"),
        ]);

        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (countriesRes.data) setCountries(countriesRes.data);
      } catch (error) {
        console.error("Error fetching categories/countries:", error);
      }
    }
    fetchData();
  }, [supabase]);

  // Fetch experts from Supabase
  useEffect(() => {
    async function fetchExperts() {
      setLoading(true);
      try {
        let query = supabase
          .from("profiles")
          .select(`
            id,
            name,
            title,
            bio,
            verified,
            listed_on_marketplace,
            category_id,
            country_id,
            avatar_url,
            categories(name),
            countries(name)
          `)
          .eq("listed_on_marketplace", true);

        // Filter by category if selected
        if (selectedCategory) {
          query = query.eq("category_id", selectedCategory);
        }

        // Filter by country if selected
        if (selectedLocation) {
          query = query.eq("country_id", selectedLocation);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching experts:", error);
          setExperts([]);
        } else if (data) {
          let filtered = data.map((profile: any) => ({
            id: profile.id,
            name: profile.name || "Anonymous",
            title: profile.title || "",
            category: (profile.categories as any)?.name || "",
            bio: profile.bio || "",
            location: (profile.countries as any)?.name || "",
            verified: profile.verified || false,
            avatarUrl: profile.avatar_url || null,
          }));

          // Apply search filter
          if (searchQuery) {
            filtered = filtered.filter(
              (expert: Expert) =>
                expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expert.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }

          setExperts(filtered);
        }
      } catch (error) {
        console.error("Error:", error);
        setExperts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchExperts();
  }, [selectedCategory, selectedLocation, searchQuery, supabase]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-custom-text mb-2 text-glow">Expert Directory</h1>
        <p className="text-xl text-custom-text/80 mb-6">
          Discover industry experts ready to guide your journey
        </p>
        
        {/* Filters */}
        <div className="bg-dark-green-800/30 backdrop-blur-sm border border-cyber-green/30 p-6 rounded-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-custom-text mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-dark-green-900/50 border border-cyber-green/30 rounded-lg focus:ring-2 focus:ring-cyber-green focus:border-cyber-green text-custom-text placeholder-custom-text/50"
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-custom-text mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-dark-green-900/50 border border-cyber-green/30 rounded-lg focus:ring-2 focus:ring-cyber-green focus:border-cyber-green text-custom-text"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-dark-green-900">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-custom-text mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 bg-dark-green-900/50 border border-cyber-green/30 rounded-lg focus:ring-2 focus:ring-cyber-green focus:border-cyber-green text-custom-text"
              >
                <option value="">All Locations</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id} className="bg-dark-green-900">
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(selectedCategory || selectedLocation || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedLocation("");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-dark-green-800/50 text-custom-text border border-cyber-green/30 rounded-lg hover:bg-dark-green-800 hover:border-cyber-green transition-colors text-sm"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-custom-text/80 animate-pulse">Loading experts...</p>
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-custom-text/80 text-lg">No experts found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((expert) => (
            <Link
              key={expert.id}
              href={`/expert/${expert.id}`}
              className="bg-dark-green-800/30 backdrop-blur-sm border border-cyber-green/30 p-6 rounded-xl hover:bg-dark-green-800/50 hover:border-cyber-green hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4 mb-4">
                {expert.avatarUrl ? (
                  <img
                    src={expert.avatarUrl}
                    alt={expert.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-cyber-green/30 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-dark-green-800/50 border-2 border-cyber-green/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl text-cyber-green">{expert.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-custom-text truncate">{expert.name}</h3>
                    {expert.verified && (
                      <span className="text-cyber-green animate-pulse-glow flex-shrink-0" title="Verified Expert">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-custom-text/80 font-medium text-sm">{expert.title}</p>
                </div>
              </div>
              <p className="text-custom-text/70 mb-4 line-clamp-2">{expert.bio}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyber-green bg-dark-green-900/50 px-2 py-1 rounded-full border border-cyber-green/30">
                  {expert.category}
                </span>
                <span className="text-xs text-custom-text/70">{expert.location}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

