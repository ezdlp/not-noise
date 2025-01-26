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
          DEFAULT: "#6851FB",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D6BCFA",
          foreground: "#0F0F0F",
        },
        accent: {
          DEFAULT: "#F5F3FF",
          foreground: "#0F0F0F",
        },
        onyx: "#0F0F0F",
        // New color palette
        cornflower: "#6495ED",
        snowyMint: "#DFFFD4",
        violetViolet: "#8B00FF",
        luckyPoint: "#1A1E7D",
        mintGreen: "#98FB98",
        moonRaker: "#D6CADD",
        ziggurat: "#BFDBE2",
        codGray: "#1B1B1B",
        persianBlue: "#1C39BB",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(223, 255, 212, 0)" },
          "50%": { boxShadow: "0 0 20px rgba(223, 255, 212, 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #6495ED, #DFFFD4)',
        'cta-gradient': 'linear-gradient(135deg, #8B00FF, #1A1E7D)',
        'button-hover': 'linear-gradient(135deg, #6495ED, #8B00FF)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;