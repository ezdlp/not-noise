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
        background: "#FAFAFA", // Seasalt
        foreground: "#0F0F0F", // Night
        primary: {
          DEFAULT: "#6851FB", // Majorelle Blue
          light: "#ECE9FF", // 20% tint
          medium: "#A299FC", // 50% tint
          dark: "#4A47A5", // 10% darker
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FE28A2", // Persian Rose
          light: "#FFB8D7", // 20% tint
          medium: "#FF49B7", // 50% tint
          dark: "#D0178B", // 10% darker
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#37D299", // Emerald
          light: "#E6F4EF", // 20% tint
          medium: "#5DE0AE", // 50% tint
          dark: "#2A8F69", // 10% darker
          foreground: "#FFFFFF",
        },
        neutral: {
          DEFAULT: "#E6E6E6", // Light Neutral Tint
          light: "#F5F5F5", // 10% tint of Seasalt
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#666666",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F0F0F",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(15, 15, 15, 0.05)',
        'md': '0 2px 4px rgba(15, 15, 15, 0.05)',
        'lg': '0 4px 6px rgba(15, 15, 15, 0.05)',
      },
      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.5rem',
        'lg': '0.75rem',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-out',
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
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        "slide-in-bottom": "slide-in-bottom 0.3s ease-out"
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;