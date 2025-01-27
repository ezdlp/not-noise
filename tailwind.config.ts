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
          DEFAULT: "#1C39BB", // Persian Blue
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#8F00FF", // Electric Violet
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FF007F", // Razzmatazz
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#A5D785", // Feijoa
          foreground: "#1A1A1A",
        },
        neutral: {
          DEFAULT: "#D6FFFA", // Snowy Mint
          foreground: "#1A1A1A",
        },
        onyx: "#1A1A1A", // Cod Gray
        amaranth: "#E52B50",
        toreaBay: "#0F2D8C",
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
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        marquee: "marquee 25s linear infinite",
        glitch: "glitch 0.3s ease-in-out infinite",
        bounce: "bounce 0.5s ease-in-out infinite",
        pulse: "pulse 2s ease-in-out infinite"
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(to right, #D6FFFA, rgba(28, 57, 187, 0.2))',
        'footer-gradient': 'linear-gradient(to right, #0F2D8C, #1C39BB)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;