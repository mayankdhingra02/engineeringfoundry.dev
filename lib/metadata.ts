import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface PageMetadataOptions {
  title: string;
  description: string;
  path: `/${string}` | "/";
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  absoluteTitle?: boolean;
}

const defaultImage = "/og.png";

export function createPageMetadata({ title, description, path, image = defaultImage, imageAlt = `${siteConfig.name} — ${siteConfig.tagline}`, imageWidth = 1730, imageHeight = 909, absoluteTitle = false }: PageMetadataOptions): Metadata {
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
      images: [{ url: imageUrl, width: imageWidth, height: imageHeight, alt: imageAlt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
  };
}
