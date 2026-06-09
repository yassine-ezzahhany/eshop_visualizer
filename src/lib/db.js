const oracledb = require('oracledb');

// Enable Thin Mode
try {
  oracledb.initOracleClient({ thin: true });
} catch (err) {
  // Swallowed: thin by default in newer node-oracledb
}

const configs = {
  1: {
    globale: {
      user: 'globale_user',
      password: 'globale_password',
      connectString: 'localhost:1521/ESHOP_GLOBALE_PDB'
    },
    site1: {
      user: 'globale_user',
      password: 'globale_password',
      connectString: 'localhost:1522/ESHOP_SITE1_PDB'
    },
    site2: {
      user: 'globale_user',
      password: 'globale_password',
      connectString: 'localhost:1523/ESHOP_SITE2_PDB'
    }
  },
  2: {
    globale: {
      user: 'globale_user',
      password: 'globale_password',
      connectString: 'localhost:1524/ESHOP_GLOBALE_PDB'
    },
    site1: {
      user: 'globale_user',
      password: 'globale_password',
      connectString: 'localhost:1525/ESHOP_SITE1_PDB'
    },
    site2: {
      user: 'globale_user',
      password: 'globale_password',
      connectString: 'localhost:1526/ESHOP_SITE2_PDB'
    }
  }
};

/**
 * Execute SQL query on a specific database target and scenario
 * @param {1 | 2} scenario
 * @param {'globale' | 'site1' | 'site2'} target 
 * @param {string} sql 
 * @param {any[]} binds 
 * @param {oracledb.ExecuteOptions} options 
 */
async function executeQuery(scenario, target, sql, binds = [], options = { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT }) {
  let connection;
  try {
    const sc = (scenario === 1 || scenario === '1') ? 1 : 2;
    const dbConfig = configs[sc][target];
    if (!dbConfig) {
      throw new Error(`Invalid target: ${target} for scenario ${sc}`);
    }
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(sql, binds, options);
    return { success: true, data: result.rows || [], affectedRows: result.rowsAffected };
  } catch (error) {
    console.error(`Database error on target [${target}] for scenario [${scenario}]:`, error);
    return { success: false, error: error.message };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

/**
 * Tests connection to all databases in a scenario and returns status
 * @param {1 | 2} scenario
 */
async function getStatus(scenario) {
  const sc = (scenario === 1 || scenario === '1') ? 1 : 2;
  const statuses = {};
  for (const target of ['globale', 'site1', 'site2']) {
    let connection;
    try {
      const dbConfig = configs[sc][target];
      connection = await oracledb.getConnection(dbConfig);
      await connection.execute('SELECT 1 FROM DUAL');
      statuses[target] = 'online';
    } catch (e) {
      statuses[target] = 'offline';
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {}
      }
    }
  }
  return statuses;
}

module.exports = {
  executeQuery,
  getStatus
};
