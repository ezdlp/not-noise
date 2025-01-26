import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D946EF",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#F97316",
          foreground: "#FFFFFF",
        },
        onyx: "#0F0F0F",
        neonPurple: "#8B5CF6",
        electricPink: "#D946EF",
        vividOrange: "#F97316",
        oceanBlue: "#0EA5E9",
        softLavender: "#E5DEFF",
        neonGreen: "#4ADE80",
        vibrantYellow: "#FCD34D",
        cosmicPurple: "#7C3AED",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #8B5CF6, #D946EF)',
        'cta-gradient': 'linear-gradient(135deg, #F97316, #0EA5E9)',
        'feature-gradient': 'linear-gradient(135deg, #7C3AED, #4ADE80)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;