/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Design tokens will be filled from Figma extraction (Phase 1)
      fontFamily: {
        promo: ["Promo-Regular"],
        "promo-thin": ["Promo-Thin"],
        "promo-extralight": ["Promo-ExtraLight"],
        "promo-light": ["Promo-Light"],
        "promo-medium": ["Promo-Medium"],
        "promo-semibold": ["Promo-SemiBold"],
        "promo-bold": ["Promo-Bold"],
      },
      colors: {},
      spacing: {},
      borderRadius: {},
    },
  },
  plugins: [],
};
