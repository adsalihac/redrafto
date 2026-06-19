import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Redrafto - From AI Draft to Authentic Writing",
  description:
    "Transform AI-generated Medium articles, LinkedIn posts, blogs, and newsletters into authentic content readers trust.",
  applicationName: "Redrafto"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
