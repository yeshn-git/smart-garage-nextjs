import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: {
    default: "SmartGarage AI | AI-Powered Smart Garage Management System",
    template: "%s | SmartGarage AI"
  },
  description:
    "AI-Powered Smart Garage Management System using Next.js on Vercel, Neon Postgres and Google Gemini. Submit vehicle problems, get instant AI troubleshooting and track service status.",
  icons: { icon: "/favicon.svg" }
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0a1428" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
