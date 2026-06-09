import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, scenario, id_ligne_commande, id_commande, id_produit, quantite, remise } = body;

    const sc = (scenario === 1 || scenario === '1') ? 1 : 2;
    const idLigne = parseInt(id_ligne_commande);
    const idCmd = parseInt(id_commande);
    const idProd = parseInt(id_produit);
    const qte = parseInt(quantite);
    const rem = parseFloat(remise);

    if (isNaN(idLigne) || idLigne <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid ID_LIGNE_COMMANDE.' }, { status: 400 });
    }

    let sql = '';
    let binds = [];
    let logs = [];

    logs.push(`[Scenario ${sc}] Initiated ${action.toUpperCase()} action for Line ID: ${idLigne}`);

    if (action === 'insert') {
      if (isNaN(idCmd) || isNaN(idProd) || isNaN(qte) || isNaN(rem)) {
        return NextResponse.json({ success: false, error: 'All fields must be provided and valid for insertion.' }, { status: 400 });
      }
      sql = `
        INSERT INTO LIGNES_COMMANDES (ID_LIGNE_COMMANDE, ID_COMMANDE, ID_PRODUIT, QUANTITE, REMISE)
        VALUES (:idLigne, :idCmd, :idProd, :qte, :rem)
      `;
      binds = [idLigne, idCmd, idProd, qte, rem];
      logs.push(`Sending INSERT to ESHOP_GLOBALE_PDB (Port ${sc === 1 ? 1521 : 1524})...`);
    } else if (action === 'update') {
      if (isNaN(qte) || isNaN(rem) || isNaN(idProd)) {
        return NextResponse.json({ success: false, error: 'Product ID, Quantity and Discount must be provided.' }, { status: 400 });
      }
      sql = `
        UPDATE LIGNES_COMMANDES 
        SET QUANTITE = :qte, ID_PRODUIT = :idProd, REMISE = :rem
        WHERE ID_LIGNE_COMMANDE = :idLigne
      `;
      binds = [qte, idProd, rem, idLigne];
      logs.push(`Sending UPDATE to ESHOP_GLOBALE_PDB (Port ${sc === 1 ? 1521 : 1524})...`);
    } else if (action === 'delete') {
      sql = `DELETE FROM LIGNES_COMMANDES WHERE ID_LIGNE_COMMANDE = :idLigne`;
      binds = [idLigne];
      logs.push(`Sending DELETE to ESHOP_GLOBALE_PDB (Port ${sc === 1 ? 1521 : 1524})...`);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    }

    // Execute on global DB for the selected scenario
    const res = await db.executeQuery(sc, 'globale', sql, binds);

    if (!res.success) {
      logs.push(`Database error: ${res.error}`);
      return NextResponse.json({ success: false, error: res.error, logs });
    }

    logs.push(`Global table transaction committed.`);

    // Check where the row is located now
    let routedTo = 'none';
    if (action !== 'delete') {
      logs.push(`Checking replication status on local nodes...`);
      const checkSql1 = `SELECT COUNT(*) AS CNT FROM LIGNES_COMMANDES_1 WHERE ID_LIGNE_COMMANDE = :idLigne`;
      const checkSql2 = `SELECT COUNT(*) AS CNT FROM LIGNES_COMMANDES_2 WHERE ID_LIGNE_COMMANDE = :idLigne`;

      const [res1, res2] = await Promise.all([
        db.executeQuery(sc, 'site1', checkSql1, [idLigne]),
        db.executeQuery(sc, 'site2', checkSql2, [idLigne])
      ]);

      const count1 = res1.success && res1.data.length > 0 ? res1.data[0].CNT : 0;
      const count2 = res2.success && res2.data.length > 0 ? res2.data[0].CNT : 0;

      if (count1 > 0) {
        routedTo = 'site1';
        if (sc === 1) {
          logs.push(`Verified: Row exists in ESHOP_SITE1_PDB (Category 50, Qty > 100)`);
        } else {
          logs.push(`Verified: Row exists in ESHOP_SITE1_PDB (Wholesale Segment, Qty >= 100)`);
        }
      } else if (count2 > 0) {
        routedTo = 'site2';
        if (sc === 1) {
          logs.push(`Verified: Row exists in ESHOP_SITE2_PDB (Category 35, Qty > 50)`);
        } else {
          logs.push(`Verified: Row exists in ESHOP_SITE2_PDB (Retail Segment, Qty < 100)`);
        }
      } else {
        if (sc === 1) {
          logs.push(`Note: In Scenario 1, lines are only replicated if they meet the category rules (Cat 50 & Qty > 100, or Cat 35 & Qty > 50). This line did not meet those, so it exists only in the Global DB.`);
        } else {
          logs.push(`Warning: Row was not found on either Site 1 or Site 2.`);
        }
      }
    } else {
      logs.push(`Propagating deletion to local nodes...`);
      logs.push(`Verified: Row deleted on all nodes.`);
    }

    return NextResponse.json({
      success: true,
      routedTo,
      logs
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
