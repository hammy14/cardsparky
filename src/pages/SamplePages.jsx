export function SampleHome() {
  const kpis = [
    { label: 'Total Users', value: '1,234', accent: 'var(--blue)' },
    { label: 'Active Today', value: '89', accent: 'var(--green)' },
    { label: 'Pending Tasks', value: '12', accent: 'var(--orange)' },
    { label: 'Completed', value: '456', accent: 'var(--purple)' },
  ];

  return (
    <>
      <div className="home-banner">
        <div>
          <h2 className="home-greeting">Welcome to CardSparky</h2>
          <p className="home-slogan">The Thrill of the Pull Starts Here. Your Collection. Your Legacy. Let's Build It.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-accent" style={{ background: k.accent }} />
            <div className="kpi-content">
              <span className="kpi-value">{k.value}</span>
              <span className="kpi-label">{k.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="home-grid">
        <div className="home-card">
          <div className="home-card-header">
            <h3>📋 Recent Items</h3>
          </div>
          <div className="home-card-list">
            {['Item One', 'Item Two', 'Item Three'].map(item => (
              <div key={item} className="home-list-item">
                <div className="home-list-main">
                  <span className="home-list-title">{item}</span>
                  <span className="home-list-sub">Description goes here</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="home-card">
          <div className="home-card-header">
            <h3>📊 Stats</h3>
          </div>
          <div className="home-card-empty">Add your content here</div>
        </div>

        <div className="home-card">
          <div className="home-card-header">
            <h3>🔔 Notifications</h3>
          </div>
          <div className="home-card-empty">Add your content here</div>
        </div>
      </div>
    </>
  );
}

export function SampleTable() {
  const data = [
    { id: 1, name: 'Alice Johnson', role: 'Admin', status: 'Active', date: 'Jan 15, 2025' },
    { id: 2, name: 'Bob Smith', role: 'Editor', status: 'Active', date: 'Feb 3, 2025' },
    { id: 3, name: 'Carol White', role: 'Viewer', status: 'Inactive', date: 'Mar 22, 2025' },
    { id: 4, name: 'Dave Brown', role: 'Admin', status: 'Active', date: 'Apr 10, 2025' },
    { id: 5, name: 'Eve Davis', role: 'Editor', status: 'Pending', date: 'May 1, 2025' },
  ];

  const statusStyle = (s) => {
    if (s === 'Active') return { background: 'rgba(3, 194, 82, 0.15)', color: 'var(--green)' };
    if (s === 'Inactive') return { background: 'rgba(255, 131, 49, 0.15)', color: 'var(--orange)' };
    return { background: 'rgba(136, 125, 255, 0.15)', color: 'var(--purple)' };
  };

  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>📋 Sample Table</h3>
        <span className="record-count">{data.length} records</span>
      </div>
      <div className="opp-toolbar">
        <input type="text" placeholder="Search…" className="opp-search" />
        <select className="opp-filter">
          <option value="">All Roles</option>
          <option>Admin</option>
          <option>Editor</option>
          <option>Viewer</option>
        </select>
      </div>
      <div className="opp-table-wrap">
        <table className="opp-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map(r => (
              <tr key={r.id} className="opp-row-clickable">
                <td className="opp-name">{r.name}</td>
                <td>{r.role}</td>
                <td><span className="badge" style={statusStyle(r.status)}>{r.status}</span></td>
                <td>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SampleSettings() {
  return (
    <div className="opp-section">
      <div className="opp-header">
        <h3>⚙ Settings</h3>
      </div>
      <div className="opp-empty">Add your settings content here</div>
    </div>
  );
}
