import type { Config } from "tailwindcss";

/** Tailwind v4: основная конфигурация в src/app/globals.css (@theme, @source). */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
};

export default config;
