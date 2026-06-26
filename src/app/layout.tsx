import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/toaster";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StreamFlix | Watch Movies & TV Shows Online",
    template: "%s | StreamFlix",
  },
  description: "Stream the latest blockbusters, exclusive originals, and your favorite TV shows on StreamFlix. Start watching today.",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  openGraph: {
    title: "StreamFlix | Watch Movies & TV Shows Online",
    description: "Stream the latest blockbusters, exclusive originals, and your favorite TV shows on StreamFlix.",
    siteName: "StreamFlix",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamFlix",
    description: "Stream the latest blockbusters, exclusive originals, and your favorite TV shows on StreamFlix.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://media-cache.cinematerial.com" />
        <link rel="preconnect" href="https://cdn.cinematerial.com" />
        <link rel="preconnect" href="https://image.tmdb.org" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
        <SpeedInsights />
        <Script id="chatbase" strategy="lazyOnload">{`(function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.setAttribute("chatbotId","${process.env.NEXT_PUBLIC_CHATBOT_ID}");script.setAttribute("domain","www.chatbase.co");script.src="https://www.chatbase.co/embed.min.js";script.id="${process.env.NEXT_PUBLIC_CHATBOT_ID}";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();`}</Script>
      </body>
    </html>
  );
}
