import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {},
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      container: {
        padding: "16px",
        center: true,
      },
      fontFamily: {
        industrial: ["Industrial", "sans-serif"],
        spaceGrotesk: ["var(--font-space)", "sans-serif"],
        sora: ["var(--font-sora)", "sans-serif"],
      },

      backgroundImage: {
        TokenomicsBg: "url('/assets/tokenomicbg.png')",
        FaqsBg: "url('/assets/faqbg.png')",
        StartedBg: "url('/assets/startedbg.png')",
        HeroBg: "url('/assets/videomask.png')",
        ChatBg: "url('/assets/videomask.png')",
        DoubleBg: "url('/assets/doublebg.png')",
        ChatBg1: "url('/assets/chatbg.png')",
        LoginBg: "url('/assets/login-bg.png')",
        InboxBg: "url('/assets/Inboxbg.png')",
        Tokenomicsmall: "url('/assets/bgsmall.png')",


      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
