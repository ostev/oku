/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        fontFamily: {
            mono: ["Theme Monospace", "monospace"],
            sans: ["Theme Sans", "sans-serif"],
            serif: ["Theme Serif", "serif"],
        },
    },
    plugins: [],
}
