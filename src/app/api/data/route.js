import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const scenario = searchParams.get('scenario') || '2';

  const sqlGlobal = `
    SELECT ID_LIGNE_COMMANDE, ID_COMMANDE, ID_PRODUIT, QUANTITE, REMISE 
    FROM (
      SELECT * FROM LIGNES_COMMANDES ORDER BY ID_LIGNE_COMMANDE DESC
    ) WHERE ROWNUM <= 15
  `;
  const sqlSite1 = `
    SELECT ID_LIGNE_COMMANDE, ID_COMMANDE, ID_PRODUIT, QUANTITE, REMISE 
    FROM (
      SELECT * FROM LIGNES_COMMANDES_1 ORDER BY ID_LIGNE_COMMANDE DESC
    ) WHERE ROWNUM <= 15
  `;
  const sqlSite2 = `
    SELECT ID_LIGNE_COMMANDE, ID_COMMANDE, ID_PRODUIT, QUANTITE, REMISE 
    FROM (
      SELECT * FROM LIGNES_COMMANDES_2 ORDER BY ID_LIGNE_COMMANDE DESC
    ) WHERE ROWNUM <= 15
  `;

  // Fetch from all targets in parallel for the specified scenario
  const [resGlobal, resSite1, resSite2] = await Promise.all([
    db.executeQuery(scenario, 'globale', sqlGlobal),
    db.executeQuery(scenario, 'site1', sqlSite1),
    db.executeQuery(scenario, 'site2', sqlSite2)
  ]);

  return NextResponse.json({
    success: true,
    data: {
      global: resGlobal.success ? resGlobal.data : [],
      site1: resSite1.success ? resSite1.data : [],
      site2: resSite2.success ? resSite2.data : [],
      errors: {
        global: resGlobal.success ? null : resGlobal.error,
        site1: resSite1.success ? null : resSite1.error,
        site2: resSite2.success ? null : resSite2.error
      }
    }
  });
}
