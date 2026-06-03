/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        slate: {
          50: "hsl(var(--slate-50) / <alpha-value>)",
          100: "hsl(var(--slate-100) / <alpha-value>)",
          200: "hsl(var(--slate-200) / <alpha-value>)",
          300: "hsl(var(--slate-300) / <alpha-value>)",
          400: "hsl(var(--slate-400) / <alpha-value>)",
          500: "hsl(var(--slate-500) / <alpha-value>)",
          600: "hsl(var(--slate-600) / <alpha-value>)",
          700: "hsl(var(--slate-700) / <alpha-value>)",
          800: "hsl(var(--slate-800) / <alpha-value>)",
          900: "hsl(var(--slate-900) / <alpha-value>)",
          950: "hsl(var(--slate-950) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};
