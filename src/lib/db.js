const oracledb = require('oracledb');
const dns = require('dns').promises;

// Enable Thin Mode
try {
  oracledb.initOracleClient({ thin: true });
} catch (err) {
  // Swallowed: thin by default in newer node-oracledb
}

/**
 * Resolves a hostname to its IPv4 address to avoid IPv6 connection issues (like EADDRNOTAVAIL on Vercel).
 * @param {string} connectString 
 */
async function resolveHostToIPv4(connectString) {
  let host = connectString;
  let remainder = '';
  
  const colonIndex = connectString.indexOf(':');
  const slashIndex = connectString.indexOf('/');
  
  if (colonIndex !== -1) {
    host = connectString.substring(0, colonIndex);
    remainder = connectString.substring(colonIndex);
  } else if (slashIndex !== -1) {
    host = connectString.substring(0, slashIndex);
    remainder = connectString.substring(slashIndex);
  }
  
  try {
    if (host === 'localhost' || host === '127.0.0.1') {
      return connectString;
    }
    
    // Force IPv4 address resolution
    const result = await dns.lookup(host, { family: 4 });
    console.log(`Resolved hostname "${host}" to IPv4: ${result.address}`);
    return result.address + remainder;
  } catch (err) {
    console.error(`Failed to resolve DNS for hostname "${host}" to IPv4:`, err.message);
    return connectString; // fallback to original
  }
}

/**
 * Retrieves database configuration from environment variables.
 * Throws an exception if any required variable is missing.
 * @param {1 | 2} scenario 
 * @param {'globale' | 'site1' | 'site2'} target 
 */
async function getDbConfig(scenario, target) {
  const sc = (scenario === 1 || scenario === '1') ? 1 : 2;
  const prefix = `DB_S${sc}_${target.toUpperCase()}`;
  
  const user = process.env[`${prefix}_USER`];
  const password = process.env[`${prefix}_PASSWORD`];
  let connectString = process.env[`${prefix}_HOST`];
  
  if (!user || !password || !connectString) {
    throw new Error(
      `Missing required environment variables for Scenario ${sc}, Target ${target}. ` +
      `Please define ${prefix}_USER, ${prefix}_PASSWORD, and ${prefix}_HOST in your environment.`
    );
  }
  
  // Resolve host to IPv4 to prevent IPv6 EADDRNOTAVAIL issues on Vercel
  connectString = await resolveHostToIPv4(connectString);
  
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
    const dbConfig = await getDbConfig(scenario, target);
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
      const dbConfig = await getDbConfig(scenario, target);
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
