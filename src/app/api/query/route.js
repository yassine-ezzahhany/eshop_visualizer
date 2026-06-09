import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const scenario = searchParams.get('scenario') || '2';

  const sql = `
    WITH ALL_LIGNES AS (
        -- Contribution du Site 1 (Grossistes / Cat 50 : QUANTITE >= 100 / > 100)
        SELECT lc.ID_PRODUIT, lc.QUANTITE, lc.REMISE, cmd.DATE_COMMANDE
        FROM LIGNES_COMMANDES_1 lc
        JOIN COMMANDES_1 cmd ON lc.ID_COMMANDE = cmd.ID_COMMANDE
        UNION ALL
        -- Contribution du Site 2 (Magasins / Cat 35 : QUANTITE < 100 / > 50)
        SELECT lc.ID_PRODUIT, lc.QUANTITE, lc.REMISE, cmd.DATE_COMMANDE
        FROM LIGNES_COMMANDES_2 lc
        JOIN COMMANDES_2 cmd ON lc.ID_COMMANDE = cmd.ID_COMMANDE
    )
    SELECT 
        p.ID_CATEGORIE, 
        cat.NOM_CATEGORIE,
        ROUND(SUM(al.QUANTITE * p.PRIX_UNITAIRE * (1 - al.REMISE)), 2) AS CA_TOTAL_2026
    FROM ALL_LIGNES al
    JOIN PRODUITS p ON al.ID_PRODUIT = p.ID_PRODUIT
    JOIN CATEGORIES cat ON p.ID_CATEGORIE = cat.ID_CATEGORIE
    WHERE al.DATE_COMMANDE >= TO_DATE('2026-01-01', 'YYYY-MM-DD')
      AND al.DATE_COMMANDE < TO_DATE('2027-01-01', 'YYYY-MM-DD')
    GROUP BY p.ID_CATEGORIE, cat.NOM_CATEGORIE
    ORDER BY CA_TOTAL_2026 DESC
  `;

  const res = await db.executeQuery(scenario, 'globale', sql);

  if (res.success) {
    return NextResponse.json({ success: true, data: res.data });
  } else {
    return NextResponse.json({ success: false, error: res.error }, { status: 500 });
  }
}
