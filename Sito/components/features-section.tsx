"use client";

const features = [
  {
    title: "Expert Profiles",
    description: "Comprehensive profiles showcasing expertise, experience, and achievements",
    icon: "👤",
    delay: "0ms",
  },
  {
    title: "Direct Messaging",
    description: "Connect and communicate directly with experts in your field",
    icon: "💬",
    delay: "100ms",
  },
  {
    title: "Verified Experts",
    description: "All experts are verified to ensure quality and authenticity",
    icon: "✅",
    delay: "200ms",
  },
  {
    title: "Global Network",
    description: "Access industry leaders from around the world",
    icon: "🌍",
    delay: "300ms",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyber-green mb-2 sm:mb-3 text-glow animate-pulse-glow tracking-tight">
            Why Choose Sito?
          </h2>
          <p className="text-base sm:text-lg text-custom-text/80 max-w-2xl mx-auto px-4">
            Everything you need to find and connect with industry experts
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-dark-green-800/30 backdrop-blur-sm border border-cyber-green/30 p-5 sm:p-6 rounded-xl hover:bg-dark-green-800/50 hover:border-cyber-green hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-2 hover:scale-[1.02] sm:hover:scale-105 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 transform group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                {feature.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-cyber-green mb-1 sm:mb-2 transition-colors group-hover:text-glow">
                {feature.title}
              </h3>
              <p className="text-custom-text/70 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

