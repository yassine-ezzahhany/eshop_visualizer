"use client";

import { useState, useEffect } from 'react';
import { 
  Database, Network, Play, RefreshCw, TrendingUp, Zap, 
  Trash2, Edit, CheckCircle2, AlertCircle, Info, HelpCircle
} from 'lucide-react';

export default function Dashboard() {
  // Database status states
  const [statuses, setStatuses] = useState({ globale: 'offline', site1: 'offline', site2: 'offline' });
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Table data states
  const [tablesData, setTablesData] = useState({ global: [], site1: [], site2: [] });
  const [loadingData, setLoadingData] = useState(false);

  // DML Sandbox states
  const [activeTab, setActiveTab] = useState('insert');
  const [insertForm, setInsertForm] = useState({ id_ligne_commande: '999960', id_commande: '167', id_produit: '149', quantite: '150', remise: '0.1' });
  const [updateForm, setUpdateForm] = useState({ id_ligne_commande: '999960', id_produit: '149', quantite: '30', remise: '0.1' });
  const [deleteForm, setDeleteForm] = useState({ id_ligne_commande: '999960' });
  const [dmlLoading, setDmlLoading] = useState(false);
  const [dmlLogs, setDmlLogs] = useState([
    'System ready. Enter values above and execute to simulate transaction propagation.'
  ]);
  const [lastRoutedTo, setLastRoutedTo] = useState('none');

  // Distributed Query states
  const [queryData, setQueryData] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  // Load database statuses and tables on startup
  useEffect(() => {
    fetchStatus();
    fetchLatestData();
  }, []);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success) {
        setStatuses(data.statuses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchLatestData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      if (data.success) {
        setTablesData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDmlSubmit = async (e) => {
    e.preventDefault();
    setDmlLoading(true);
    setDmlLogs([`Initiating distributed transaction...`]);
    setLastRoutedTo('none');

    const formPayload = 
      activeTab === 'insert' ? { action: 'insert', ...insertForm } :
      activeTab === 'update' ? { action: 'update', ...updateForm } :
      { action: 'delete', ...deleteForm };

    try {
      const res = await fetch('/api/dml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPayload)
      });
      const result = await res.json();

      if (result.logs) {
        setDmlLogs(result.logs);
      }

      if (result.success) {
        setLastRoutedTo(result.routedTo || 'none');
        // Increment IDs automatically to facilitate repeated testing
        if (activeTab === 'insert') {
          const nextId = parseInt(insertForm.id_ligne_commande) + 1;
          setInsertForm(prev => ({ ...prev, id_ligne_commande: nextId.toString() }));
          setUpdateForm(prev => ({ ...prev, id_ligne_commande: (nextId - 1).toString() }));
          setDeleteForm({ id_ligne_commande: (nextId - 1).toString() });
        }
        fetchLatestData();
      } else {
        setDmlLogs(prev => [...prev, `❌ FAILED: ${result.error || 'Unknown database error'}`]);
      }
    } catch (err) {
      setDmlLogs(prev => [...prev, `❌ Network communication error: ${err.message}`]);
    } finally {
      setDmlLoading(false);
    }
  };

  const executeDistributedQuery = async () => {
    setQueryLoading(true);
    setQueryError(null);
    try {
      const res = await fetch('/api/query');
      const data = await res.json();
      if (data.success) {
        setQueryData(data.data);
      } else {
        setQueryError(data.error);
      }
    } catch (err) {
      setQueryError(err.message);
    } finally {
      setQueryLoading(false);
    }
  };

  // Calculate chart max value
  const maxRevenue = queryData.length > 0 ? Math.max(...queryData.map(d => d.CA_TOTAL_2026)) : 1;

  return (
    <main style={{ paddingBottom: '60px' }}>
      {/* HEADER SECTION */}
      <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(11,15,25,0.8)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Network size={22} color="#6366f1" /> E-Shop Distributed DB Control Center
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Horizontal Volume-Based Fragmentation (Scenario 2)
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Status indicators */}
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                <span className={`status-dot ${statuses.globale}`}></span>
                Global PDB (Port 1524)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                <span className={`status-dot ${statuses.site1}`}></span>
                Site 1 (Port 1525)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                <span className={`status-dot ${statuses.site2}`}></span>
                Site 2 (Port 1526)
              </div>
            </div>
            
            <button 
              id="btn-refresh-status"
              className="btn" 
              onClick={fetchStatus} 
              disabled={loadingStatus}
              style={{ padding: '8px 12px' }}
              title="Refresh DB Statuses"
            >
              <RefreshCw size={14} className={loadingStatus ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        
        {/* SECTION 1: ARCHITECTURE TOPOLOGY MAP */}
        <section className="glass-panel glow-card-global">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Network size={18} color="#818cf8" /> Interactive Network Topology
          </h2>
          
          <div style={{ position: 'relative', width: '100%', height: '240px', background: 'rgba(5,7,12,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden' }}>
            
            {/* SVG Connection Lines */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              {/* Global -> Site 1 DB Link */}
              <path 
                d="M 240,65 Q 150,110 120,165" 
                fill="none" 
                stroke={lastRoutedTo === 'site1' ? '#10b981' : '#4b5563'} 
                strokeWidth="1.5" 
                className={`svg-connection-line ${lastRoutedTo === 'site1' ? 'active' : ''}`}
              />
              {/* Global -> Site 2 DB Link */}
              <path 
                d="M 260,65 Q 350,110 380,165" 
                fill="none" 
                stroke={lastRoutedTo === 'site2' ? '#0ea5e9' : '#4b5563'} 
                strokeWidth="1.5" 
                className={`svg-connection-line ${lastRoutedTo === 'site2' ? 'active' : ''}`}
              />
            </svg>

            {/* Global DB Node */}
            <div style={{ position: 'absolute', top: '24px', left: 'calc(50% - 70px)', width: '140px', zIndex: 2, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)', marginBottom: '6px' }}>
                <Database size={24} color="#a78bfa" />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>globale-db-s2</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Port 1524 | ESHOP_GLOBALE</div>
            </div>

            {/* Site 1 Node */}
            <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '150px', zIndex: 2, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)', marginBottom: '6px' }}>
                <Database size={24} color="#34d399" />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>site1-db-s2 (Wholesale)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Port 1525 | Qty &ge; 100</div>
            </div>

            {/* Site 2 Node */}
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '150px', zIndex: 2, textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.3)', boxShadow: '0 0 15px rgba(14, 165, 233, 0.2)', marginBottom: '6px' }}>
                <Database size={24} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>site2-db-s2 (Retail)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Port 1526 | Qty &lt; 100</div>
            </div>

            {/* Overlay indicators */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '8px', fontSize: '0.65rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }}></span> trigger active
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }}></span> public dblinks
              </span>
            </div>

          </div>
          
          <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '16px', lineHeight: '1.4' }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
            <div>
              <strong>Replication Details</strong>: Row inserts into the global database trigger <strong>SYNC_INSERT_LIGNE</strong>, which decides to route rows to the corresponding database node based on <code>QUANTITE</code>. Deletions and updates also propagate dynamically.
            </div>
          </div>
        </section>

        {/* SECTION 2: DML SIMULATOR AND TRANSACTION LOGGER */}
        <section className="glass-panel">
          {/* Tab Selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
            <button 
              onClick={() => setActiveTab('insert')}
              style={{ background: 'none', border: 'none', borderBottom: activeTab === 'insert' ? '2px solid #6366f1' : 'none', color: activeTab === 'insert' ? '#fff' : 'var(--text-muted)', padding: '10px 16px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}
            >
              <Zap size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Insert
            </button>
            <button 
              onClick={() => setActiveTab('update')}
              style={{ background: 'none', border: 'none', borderBottom: activeTab === 'update' ? '2px solid #6366f1' : 'none', color: activeTab === 'update' ? '#fff' : 'var(--text-muted)', padding: '10px 16px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}
            >
              <Edit size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Update
            </button>
            <button 
              onClick={() => setActiveTab('delete')}
              style={{ background: 'none', border: 'none', borderBottom: activeTab === 'delete' ? '2px solid #6366f1' : 'none', color: activeTab === 'delete' ? '#fff' : 'var(--text-muted)', padding: '10px 16px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}
            >
              <Trash2 size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} /> Delete
            </button>
          </div>

          <form onSubmit={handleDmlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* INSERT FORM */}
            {activeTab === 'insert' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Line ID</label>
                  <input 
                    id="insert-id-ligne"
                    type="number" 
                    value={insertForm.id_ligne_commande} 
                    onChange={e => setInsertForm(p => ({ ...p, id_ligne_commande: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Order ID</label>
                  <input 
                    id="insert-id-commande"
                    type="number" 
                    value={insertForm.id_commande} 
                    onChange={e => setInsertForm(p => ({ ...p, id_commande: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Product ID</label>
                  <input 
                    id="insert-id-produit"
                    type="number" 
                    value={insertForm.id_produit} 
                    onChange={e => setInsertForm(p => ({ ...p, id_produit: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quantity</label>
                  <input 
                    id="insert-quantite"
                    type="number" 
                    value={insertForm.quantite} 
                    onChange={e => setInsertForm(p => ({ ...p, quantite: e.target.value }))}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Discount (Remise)</label>
                  <input 
                    id="insert-remise"
                    type="number" 
                    step="0.01" 
                    value={insertForm.remise} 
                    onChange={e => setInsertForm(p => ({ ...p, remise: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* UPDATE FORM */}
            {activeTab === 'update' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Target Line ID</label>
                  <input 
                    id="update-id-ligne"
                    type="number" 
                    value={updateForm.id_ligne_commande} 
                    onChange={e => setUpdateForm(p => ({ ...p, id_ligne_commande: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Product ID</label>
                  <input 
                    id="update-id-produit"
                    type="number" 
                    value={updateForm.id_produit} 
                    onChange={e => setUpdateForm(p => ({ ...p, id_produit: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>New Quantity</label>
                  <input 
                    id="update-quantite"
                    type="number" 
                    value={updateForm.quantite} 
                    onChange={e => setUpdateForm(p => ({ ...p, quantite: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>New Discount</label>
                  <input 
                    id="update-remise"
                    type="number" 
                    step="0.01" 
                    value={updateForm.remise} 
                    onChange={e => setUpdateForm(p => ({ ...p, remise: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* DELETE FORM */}
            {activeTab === 'delete' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Target Line ID</label>
                <input 
                  id="delete-id-ligne"
                  type="number" 
                  value={deleteForm.id_ligne_commande} 
                  onChange={e => setDeleteForm({ id_ligne_commande: e.target.value })}
                />
              </div>
            )}

            {/* Submit Button */}
            <button 
              id={`btn-simulate-${activeTab}`}
              type="submit" 
              className="btn btn-primary" 
              disabled={dmlLoading}
            >
              <Play size={16} /> Execute DML simulation
            </button>
          </form>

          {/* Logging console */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Execution Logs & Transactions Console
            </h3>
            <div className="logger-console">
              {dmlLogs.map((log, index) => {
                let statusClass = 'info';
                if (log.includes('Verified:') || log.includes('committed')) statusClass = 'success';
                if (log.includes('❌') || log.includes('error')) statusClass = 'error';
                return (
                  <div key={index} className={`log-item ${statusClass}`}>
                    <span style={{ opacity: 0.5 }}>&gt;</span> {log}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: LIVE TABLES DATA EXPLORER (FULL WIDTH) */}
        <section className="glass-panel full-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#34d399" /> Local Sites Data Explorer
            </h2>
            <button 
              id="btn-refresh-data"
              className="btn" 
              onClick={fetchLatestData} 
              disabled={loadingData}
            >
              <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} style={{ marginRight: 6 }} /> Refresh Data
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {/* Site 1 Panel */}
            <div style={{ border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px', padding: '16px', background: 'rgba(16, 185, 129, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: '#34d399' }}>
                  Site 1 (Wholesale DB) &mdash; LIGNES_COMMANDES_1
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Filters: Qty &ge; 100</span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Line ID</th>
                      <th>Order ID</th>
                      <th>Product ID</th>
                      <th>Quantity</th>
                      <th>Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablesData.site1.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No rows found in this partition.
                        </td>
                      </tr>
                    ) : (
                      tablesData.site1.map((row) => (
                        <tr key={row.ID_LIGNE_COMMANDE} style={{ color: row.ID_LIGNE_COMMANDE >= 999960 ? '#6ee7b7' : 'inherit' }}>
                          <td>{row.ID_LIGNE_COMMANDE}</td>
                          <td>{row.ID_COMMANDE}</td>
                          <td>{row.ID_PRODUIT}</td>
                          <td>{row.QUANTITE}</td>
                          <td>{(row.REMISE * 100).toFixed(0)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Site 2 Panel */}
            <div style={{ border: '1px solid rgba(14, 165, 233, 0.15)', borderRadius: '10px', padding: '16px', background: 'rgba(14, 165, 233, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 500, color: '#38bdf8' }}>
                  Site 2 (Retail DB) &mdash; LIGNES_COMMANDES_2
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Filters: Qty &lt; 100</span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Line ID</th>
                      <th>Order ID</th>
                      <th>Product ID</th>
                      <th>Quantity</th>
                      <th>Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablesData.site2.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                          No rows found in this partition.
                        </td>
                      </tr>
                    ) : (
                      tablesData.site2.map((row) => (
                        <tr key={row.ID_LIGNE_COMMANDE} style={{ color: row.ID_LIGNE_COMMANDE >= 999960 ? '#7dd3fc' : 'inherit' }}>
                          <td>{row.ID_LIGNE_COMMANDE}</td>
                          <td>{row.ID_COMMANDE}</td>
                          <td>{row.ID_PRODUIT}</td>
                          <td>{row.QUANTITE}</td>
                          <td>{(row.REMISE * 100).toFixed(0)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: DISTRIBUTED QUERY ENGINE */}
        <section className="glass-panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={18} color="#f59e0b" /> Distributed Analytics Query
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
            Executing a query to calculate the total revenue per product category in 2026. This queries both sites via DB Links and aggregates the results.
          </p>

          <button 
            id="btn-execute-query"
            className="btn btn-primary" 
            onClick={executeDistributedQuery} 
            disabled={queryLoading}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            <Play size={16} /> Execute 2026 Revenue Query
          </button>

          {queryError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem', marginBottom: '16px' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Error: {queryError}
            </div>
          )}

          {queryLoading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
              Retrieving distributed records...
            </div>
          ) : queryData.length > 0 ? (
            <div>
              {/* Custom charts */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>Visual Revenue (MAD)</h4>
                {queryData.map((row) => {
                  const widthPercent = (row.CA_TOTAL_2026 / maxRevenue) * 100;
                  return (
                    <div key={row.ID_CATEGORIE} className="chart-bar-container">
                      <div className="chart-bar-label" title={row.NOM_CATEGORIE}>
                        {row.NOM_CATEGORIE}
                      </div>
                      <div className="chart-bar-bg">
                        <div className="chart-bar-fill" style={{ width: `${widthPercent}%` }}></div>
                      </div>
                      <div className="chart-bar-value">
                        {row.CA_TOTAL_2026.toLocaleString()} MAD
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Table */}
              <div className="table-container" style={{ maxHeight: '200px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Cat ID</th>
                      <th>Category Name</th>
                      <th>Total CA 2026</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryData.map((row) => (
                      <tr key={row.ID_CATEGORIE}>
                        <td>{row.ID_CATEGORIE}</td>
                        <td>{row.NOM_CATEGORIE}</td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>
                          {row.CA_TOTAL_2026.toLocaleString()} MAD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Click the button above to test the distributed query.
            </div>
          )}
        </section>

        {/* SECTION 5: PERFORMANCE OPTIMIZATION VISUALIZER */}
        <section className="glass-panel">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={18} color="#22c55e" /> Performance Optimization Panel
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
            Understanding index optimization. Oracle parses plans to convert sequential full scans into high-performance index scans.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Before index */}
            <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f87171' }}>WITHOUT INDEXES</span>
                <span style={{ fontSize: '0.7rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>High Cost</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                &bull; Operation: <strong style={{ color: '#ef4444' }}>TABLE ACCESS FULL (FTS)</strong> on COMMANDES<br/>
                &bull; Block Reads: ~1,450 physical blocks<br/>
                &bull; Join Method: HASH JOIN (High RAM buffer usage)<br/>
                &bull; Slower query response due to sequential scan.
              </div>
            </div>

            {/* After index */}
            <div style={{ background: 'rgba(34, 197, 94, 0.03)', border: '1px solid rgba(34, 197, 94, 0.15)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4ade80' }}>WITH IDX_COMMANDES_DATE &amp; IDX_COMMANDES_CLIENT</span>
                <span style={{ fontSize: '0.7rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Optimal</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                &bull; Operation: <strong style={{ color: '#22c55e' }}>INDEX RANGE SCAN</strong> on IDX_COMMANDES_DATE<br/>
                &bull; Block Reads: &lt; 20 blocks<br/>
                &bull; Join Method: NESTED LOOPS using Client Index<br/>
                &bull; Immediate query response using index ranges.
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
              <strong>Optimization Hint:</strong> Indexing foreign keys (like <code>ID_CLIENT</code> in <code>COMMANDES</code>) prevents table-level lock escalation during concurrent operations in Oracle databases.
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
