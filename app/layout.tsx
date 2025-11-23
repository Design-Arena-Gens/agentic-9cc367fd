import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartWelcome ? Video Generator",
  description: "Erstelle ein Pr?sentationsvideo f?r SmartWelcome.de mit virtueller Moderatorin.",
  metadataBase: new URL("https://agentic-9cc367fd.vercel.app")
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
