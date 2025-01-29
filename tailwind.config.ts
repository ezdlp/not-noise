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
          DEFAULT: "#6851FB",
          foreground: "hsl(var(--primary-foreground))",
          hover: "#0F0F0F",
          disabled: "#4A47A5",
          light: "#ECE9FF",
        },
        secondary: {
          DEFAULT: "#FE28A2",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "#D0178B",
          light: "#FFB8D7",
        },
        success: {
          DEFAULT: "#37D299",
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
        'sm': '0 2px 4px rgba(15, 15, 15, 0.05)',
        'md': '0 2px 4px rgba(15, 15, 15, 0.1)',
        'lg': '0 4px 6px rgba(15, 15, 15, 0.1)',
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
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        rotate: {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
        },
        'rotate-reverse': {
          '0%': { transform: 'translate(-30%, -50%) rotate(360deg)' },
          '100%': { transform: 'translate(-30%, -50%) rotate(0deg)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
        "rotate": "rotate 20s linear infinite",
        "rotate-reverse": "rotate-reverse 25s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;