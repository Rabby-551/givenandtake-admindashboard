import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const apiOrigin = (() => {
  if (!API_BASE_URL) return "";
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "";
  }
})();

const csp = [
  `default-src 'self' https: data: blob:`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `frame-src 'none'`,
  `img-src 'self' data: blob: https://res.cloudinary.com`,
  `font-src 'self' data: https:`,
  `style-src 'self' 'unsafe-inline' https:`,
  `script-src 'self' 'unsafe-inline' https:${
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
  }`,
  `connect-src 'self' https:${apiOrigin ? ` ${apiOrigin}` : ""}`,
  `media-src 'self' https: data: blob:`,
  `upgrade-insecure-requests`,
  `block-all-mixed-content`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
