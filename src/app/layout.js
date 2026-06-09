import "./globals.css";

export const metadata = {
  title: "Centre de Contrôle de la Base de Données Distribuée E-Shop",
  description: "Tableau de bord interactif pour simuler, visualiser et requêter un système de base de données Oracle distribuée avec fragmentation horizontale par volume.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
