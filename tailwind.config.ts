import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
          DEFAULT: "#6851FB", // Majorelle Blue
          foreground: "hsl(var(--primary-foreground))",
          hover: "#A299FC", // 50% Tint
          disabled: "#4A47A5", // Shade
          light: "#ECE9FF", // 20% Tint
        },
        secondary: {
          DEFAULT: "#FE28A2", // Persian Rose
          foreground: "hsl(var(--secondary-foreground))",
          hover: "#D0178B",
          light: "#FFB8D7",
        },
        success: {
          DEFAULT: "#37D299", // Emerald
          hover: "#2A8F69",
          light: "#5DE0AE",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neutral: {
          seasalt: "#FAFAFA",
          night: "#0F0F0F",
          border: "#E6E6E6",
        },
      },
      fontFamily: {
        sans: ["DM Sans", ...fontFamily.sans],
        heading: ["Poppins", ...fontFamily.sans],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(15, 15, 15, 0.05)',
        'md': '0 2px 4px rgba(15, 15, 15, 0.05)',
        'lg': '0 4px 6px rgba(15, 15, 15, 0.05)',
      },
      transitionDuration: {
        '200': '200ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.16, 1, 0.3, 1)',
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;