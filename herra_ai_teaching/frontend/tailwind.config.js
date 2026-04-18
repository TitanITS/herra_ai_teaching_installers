/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                titan: {
                    bg: "#060b14",
                    bg2: "#0a1220",
                    panel: "#0d1624",
                    panel2: "#101c2d",
                    border: "#24415f",
                    text: "#f4f7fb",
                    muted: "#aab7cc",
                    accent: "#1f6feb",
                    accent2: "#67b7ff",
                    glow: "#7ec4ff",
                    deep: "#123a63",
                },
            },
            boxShadow: {
                soft: "0 16px 42px rgba(0,0,0,0.38)",
                glow: "0 0 0 1px rgba(126,196,255,0.16), 0 24px 60px rgba(0,0,0,0.44)",
                button: "0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(126,196,255,0.18)",
            },
            borderRadius: {
                xl: "14px",
                "2xl": "18px",
                "3xl": "24px",
            },
            letterSpacing: {
                wide2: "0.18em",
                titan: "0.08em",
            },
            backgroundImage: {
                "titan-panel":
                    "linear-gradient(180deg, rgba(17,26,41,0.92) 0%, rgba(11,19,31,0.86) 100%)",
                "titan-button":
                    "linear-gradient(180deg, rgba(40,91,171,0.95) 0%, rgba(20,54,107,0.96) 100%)",
                "titan-button-secondary":
                    "linear-gradient(180deg, rgba(17,30,48,0.80) 0%, rgba(11,19,31,0.82) 100%)",
            },
        },
    },
    plugins: [],
};