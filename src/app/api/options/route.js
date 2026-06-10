import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const scenario = searchParams.get('scenario') || '1';

    // Fetch products
    const sqlProducts = `
      SELECT ID_PRODUIT, DESIGNATION, ID_CATEGORIE 
      FROM PRODUITS 
      ORDER BY DESIGNATION
    `;
    
    // Fetch orders (limited to top 150 for performance)
    const sqlOrders = `
      SELECT ID_COMMANDE 
      FROM (
        SELECT ID_COMMANDE FROM COMMANDES ORDER BY ID_COMMANDE DESC
      ) WHERE ROWNUM <= 150
    `;

    const [resProducts, resOrders] = await Promise.all([
      db.executeQuery(scenario, 'globale', sqlProducts),
      db.executeQuery(scenario, 'globale', sqlOrders)
    ]);

    return NextResponse.json({
      success: true,
      products: resProducts.success ? resProducts.data : [],
      orders: resOrders.success ? resOrders.data : [],
      errors: {
        products: resProducts.success ? null : resProducts.error,
        orders: resOrders.success ? null : resOrders.error
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
