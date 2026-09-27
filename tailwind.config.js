/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Satoshi", "sans-serif"],
        serif: ["Satoshi", "sans-serif"],
        mono: ["Satoshi", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#F5F8FF",
          100: "#EEF4FE",
          200: "#D9E6FC",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E1B4B",
          800: "#0F172A",
          purple: "#7C3AED",
          cyan: "#06B6D4",
          emerald: "#059669",
        },
      },
      boxShadow: {
        "2xs": "0 1px rgb(0 0 0 / 0.05)",
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        glow: "0 10px 40px -10px rgba(79, 70, 229, 0.40)",
        "glow-cyan": "0 10px 40px -10px rgba(6, 182, 212, 0.40)",
        card: "0 10px 30px -5px rgba(37, 99, 235, 0.08)",
        hover: "0 25px 45px -10px rgba(79, 70, 229, 0.22)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
        neon: "0 0 25px rgba(99, 102, 241, 0.5)",
      },
      scale: {
        102: "1.02",
      },
      dropShadow: {
        xs: "0 1px 1px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};
