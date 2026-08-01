// src/app/robots.js
// Robots.txt for SEO
export default function robots() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://boss-africa.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app/", "/auth/", "/admin/", "/invoice/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}