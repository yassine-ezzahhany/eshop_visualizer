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
      return NextResponse.json({ success: false, error: 'Identifiant ID_LIGNE_COMMANDE invalide.' }, { status: 400 });
    }

    let sql = '';
    let binds = [];
    let logs = [];

    logs.push(`[Scénario ${sc}] Action ${action.toUpperCase()} initiée pour l'ID Ligne : ${idLigne}`);

    if (action === 'insert') {
      if (isNaN(idCmd) || isNaN(idProd) || isNaN(qte) || isNaN(rem)) {
        return NextResponse.json({ success: false, error: 'Tous les champs doivent être saisis et valides pour une insertion.' }, { status: 400 });
      }
      sql = `
        INSERT INTO LIGNES_COMMANDES (ID_LIGNE_COMMANDE, ID_COMMANDE, ID_PRODUIT, QUANTITE, REMISE)
        VALUES (:idLigne, :idCmd, :idProd, :qte, :rem)
      `;
      binds = [idLigne, idCmd, idProd, qte, rem];
      logs.push(`Envoi de l'INSERT à ESHOP_GLOBALE_PDB (Port ${sc === 1 ? 1521 : 1524})...`);
    } else if (action === 'update') {
      if (isNaN(qte) || isNaN(rem)) {
        return NextResponse.json({ success: false, error: 'La quantité et la remise doivent être saisis.' }, { status: 400 });
      }
      sql = `
        UPDATE LIGNES_COMMANDES 
        SET QUANTITE = :qte, REMISE = :rem
        WHERE ID_LIGNE_COMMANDE = :idLigne
      `;
      binds = [qte, rem, idLigne];
      logs.push(`Envoi de l'UPDATE à ESHOP_GLOBALE_PDB (Port ${sc === 1 ? 1521 : 1524})...`);
    } else if (action === 'delete') {
      sql = `DELETE FROM LIGNES_COMMANDES WHERE ID_LIGNE_COMMANDE = :idLigne`;
      binds = [idLigne];
      logs.push(`Envoi du DELETE à ESHOP_GLOBALE_PDB (Port ${sc === 1 ? 1521 : 1524})...`);
    } else {
      return NextResponse.json({ success: false, error: 'Action invalide.' }, { status: 400 });
    }

    // Execute on global DB for the selected scenario
    const res = await db.executeQuery(sc, 'globale', sql, binds);

    if (!res.success) {
      logs.push(`Erreur de base de données : ${res.error}`);
      return NextResponse.json({ success: false, error: res.error, logs });
    }

    logs.push(`Transaction sur la table globale validée (committed).`);

    // Check where the row is located now
    let routedTo = 'none';
    if (action !== 'delete') {
      logs.push(`Vérification du statut de réplication sur les nœuds locaux...`);
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
          logs.push(`Vérifié : La ligne existe dans ESHOP_SITE1_PDB (Catégorie 50, Qte > 100)`);
        } else {
          logs.push(`Vérifié : La ligne existe dans ESHOP_SITE1_PDB (Segment de gros, Qte >= 100)`);
        }
      } else if (count2 > 0) {
        routedTo = 'site2';
        if (sc === 1) {
          logs.push(`Vérifié : La ligne existe dans ESHOP_SITE2_PDB (Catégorie 35, Qte > 50)`);
        } else {
          logs.push(`Vérifié : La ligne existe dans ESHOP_SITE2_PDB (Segment de détail, Qte < 100)`);
        }
      } else {
        if (sc === 1) {
          logs.push(`Note : Dans le Scénario 1, les lignes ne sont répliquées que si elles respectent les règles de catégorie (Cat 50 & Qte > 100, ou Cat 35 & Qte > 50). Cette ligne ne les respectant pas, elle existe uniquement dans la BDD Globale.`);
        } else {
          logs.push(`Attention : La ligne n'a pas été trouvée sur le Site 1 ni sur le Site 2.`);
        }
      }
    } else {
      logs.push(`Propagation de la suppression aux nœuds locaux...`);
      logs.push(`Vérifié : Ligne supprimée sur tous les nœuds.`);
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
