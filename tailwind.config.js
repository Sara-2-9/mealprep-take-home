/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Design tokens extracted from Figma file 6b7jS9TUz5qO7YAXvl98Pg (Phase 1)
      fontFamily: {
        promo: ["Promo-Regular"],
        "promo-thin": ["Promo-Thin"],
        "promo-extralight": ["Promo-ExtraLight"],
        "promo-light": ["Promo-Light"],
        "promo-medium": ["Promo-Medium"],
        "promo-semibold": ["Promo-SemiBold"],
        "promo-bold": ["Promo-Bold"],
      },
      colors: {
        // Screen background (screens 01–04)
        cream: "#FDFFFB",
        // Primary brand green — buttons, progress, screen 05 background
        primary: "#34C759",
        // Neutral surface — cards, chips, disabled buttons, slider track
        surface: "#F2F2F7",
        // Text
        ink: "#1A1A1A", // big budget value
        label: "rgba(60,60,67,0.6)", // secondary labels
        "label-disabled": "rgba(60,60,67,0.18)", // disabled button text
        "label-strong": "#3C3C43", // icon strokes (opacity applied per-use)
      },
      borderRadius: {
        pill: "99px", // buttons, progress bar, slider track
        card: "20px", // option grid cards
        sheet: "16px", // cost card, day cells
        cell: "12px", // day selector cells
      },
    },
  },
  plugins: [],
};
