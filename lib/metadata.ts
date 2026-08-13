import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: `/${string}` | "/";
  image?: string;
  absoluteTitle?: boolean;
}

const defaultImage = "/og.png";

export function createPageMetadata({ title, description, path, image = defaultImage, absoluteTitle = false }: PageMetadataOptions): Metadata {
  const canonicalUrl = new URL(path, siteConfig.url).toString();
  const imageUrl = new URL(image, siteConfig.url).toString();

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: siteConfig.name,
      title,
      description,
      url: canonicalUrl,
      images: [{ url: imageUrl, width: 1730, height: 909, alt: `${siteConfig.name} — ${siteConfig.tagline}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}
