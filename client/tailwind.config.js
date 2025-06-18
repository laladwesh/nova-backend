/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        // 'playfair' becomes the class `font-playfair`
        playfair: ['"Playfair Display"', 'serif'],

        // if you self-hosted:
        sexy: ['"MySexyFont"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
