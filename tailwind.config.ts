import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(222 47% 4%)",
        foreground: "hsl(210 40% 98%)",
        card: {
          DEFAULT: "hsl(222 47% 6%)",
          foreground: "hsl(210 40% 98%)",
        },
        popover: {
          DEFAULT: "hsl(222 47% 5%)",
          foreground: "hsl(210 40% 98%)",
        },
        primary: {
          DEFAULT: "hsl(239 84% 67%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(217 33% 17%)",
          foreground: "hsl(210 40% 98%)",
        },
        muted: {
          DEFAULT: "hsl(217 33% 17%)",
          foreground: "hsl(215 20% 65%)",
        },
        accent: {
          DEFAULT: "hsl(188 94% 43%)",
          foreground: "hsl(222 47% 4%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(210 40% 98%)",
        },
        success: {
          DEFAULT: "hsl(142 76% 36%)",
          foreground: "hsl(210 40% 98%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(222 47% 4%)",
        },
        border: "hsl(217 33% 17%)",
        input: "hsl(217 33% 17%)",
        ring: "hsl(239 84% 67%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
