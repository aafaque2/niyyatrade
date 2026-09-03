import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/markets", "/frameworks", "/assets/"],
      disallow: [
        "/api/",
        "/portfolio",
        "/watchlist",
        "/history",
        "/settings",
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://niyyatrade.com"}/sitemap.xml`,
  };
}
