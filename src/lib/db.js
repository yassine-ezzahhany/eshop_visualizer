const oracledb = require('oracledb');

// Enable Thin Mode
try {
  oracledb.initOracleClient({ thin: true });
} catch (err) {
  // Swallowed: thin by default in newer node-oracledb
}

/**
 * Retrieves database configuration from environment variables.
 * Throws an exception if any required variable is missing.
 * @param {1 | 2} scenario 
 * @param {'globale' | 'site1' | 'site2'} target 
 */
function getDbConfig(scenario, target) {
  const sc = (scenario === 1 || scenario === '1') ? 1 : 2;
  const prefix = `DB_S${sc}_${target.toUpperCase()}`;
  
  const user = process.env[`${prefix}_USER`];
  const password = process.env[`${prefix}_PASSWORD`];
  const connectString = process.env[`${prefix}_HOST`];
  
  if (!user || !password || !connectString) {
    throw new Error(
      `Missing required environment variables for Scenario ${sc}, Target ${target}. ` +
      `Please define ${prefix}_USER, ${prefix}_PASSWORD, and ${prefix}_HOST in your environment.`
    );
  }
  
  return { user, password, connectString };
}

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
    const dbConfig = getDbConfig(scenario, target);
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
  const statuses = {};
  const errors = {};
  for (const target of ['globale', 'site1', 'site2']) {
    let connection;
    try {
      const dbConfig = getDbConfig(scenario, target);
      connection = await oracledb.getConnection(dbConfig);
      await connection.execute('SELECT 1 FROM DUAL');
      statuses[target] = 'online';
    } catch (e) {
      console.error(`Status check failed for [${target}] in scenario [${scenario}]:`, e.message);
      statuses[target] = 'offline';
      errors[target] = e.message;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {}
      }
    }
  }
  return { statuses, errors };
}

module.exports = {
  executeQuery,
  getStatus
};
