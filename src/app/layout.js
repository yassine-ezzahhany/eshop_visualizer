import "./globals.css";

export const metadata = {
  title: "E-Shop Distributed Database Control Center",
  description: "Interactive dashboard for simulating, visualizing, and querying a distributed Oracle database system with volume-based horizontal fragmentation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
