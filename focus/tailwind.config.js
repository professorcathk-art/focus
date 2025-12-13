/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#34C759", // Apple green
          dark: "#30D158",
          light: "#5FE27A",
        },
        accent: {
          DEFAULT: "#007AFF", // Apple blue
          light: "#5AC8FA",
        },
        background: {
          DEFAULT: "#F5F5F7", // Apple light gray
          dark: "#000000",
        },
        card: {
          DEFAULT: "#FFFFFF",
          dark: "#1C1C1E",
        },
        gradient: {
          start: "#34C759", // Light green
          end: "#30D158", // Slightly darker green
          soft: "#E8F5E9", // Very light green tint
        },
      },
    },
  },
  plugins: [],
};

