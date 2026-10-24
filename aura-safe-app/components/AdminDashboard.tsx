'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import {
  ShieldCheck,
  Siren,
  FileText,
  HeartHandshake,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type Props = {
  email: string;
  alerts: any[];
  reports: any[];
  services: any[];
};

export default function AdminDashboard({
  email,
  alerts,
  reports,
  services,
}: Props) {
  const [tab, setTab] = useState('SOS alerts');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Update a record in Supabase and verify that a row was updated.
  const update = async (
    table: string,
    id: string,
    patch: Record<string, any>
  ) => {
    setBusy(id);
    setMessage('');

    try {
      const sb = createClient();

      const { data, error } = await sb
        .from(table)
        .update(patch)
        .eq('id', id)
        .select('id');

      if (error) {
        console.error('Admin update failed:', error);
        setMessage(`Update failed: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setMessage(
          'No record was updated. Check the Supabase permissions for this admin account.'
        );
        return;
      }

      setMessage('Update saved successfully. Refreshing dashboard...');
      setRefreshing(true);

      // Reload server-provided data after a successful update.
      window.location.reload();
    } catch (error) {
      console.error('Unexpected admin update error:', error);
      setMessage(
        'An unexpected error occurred. Please check your connection and try again.'
      );
    } finally {
      setBusy('');
      setRefreshing(false);
    }
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    window.location.href = '/';
  };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a href="/" className="admin-brand">
          <ShieldCheck />
          <span>
            <b>AURA SAFE</b>
            <small>Operations console</small>
          </span>
        </a>

        <div>
          <span>{email}</span>
          <button onClick={signOut}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-welcome">
        <span className="section-kicker">
          RESTRICTED ACCESS · ADMIN
        </span>
        <h1>Operations dashboard</h1>
        <p>
          Review SOS alerts, manage incoming reports and keep the
          support directory current. Handle sensitive information on
          a need-to-know basis.
        </p>
      </section>

      <div className="admin-metrics">
        <div>
          <span className="metric-icon red">
            <Siren />
          </span>
          <small>New SOS alerts</small>
          <b>{alerts.filter((a) => a.status === 'new').length}</b>
        </div>

        <div>
          <span className="metric-icon purple">
            <FileText />
          </span>
          <small>Reports received</small>
          <b>{reports.length}</b>
        </div>

        <div>
          <span className="metric-icon green">
            <HeartHandshake />
          </span>
          <small>Active services</small>
          <b>{services.filter((s) => s.active).length}</b>
        </div>
      </div>

      <nav className="admin-tabs">
        {[
          ['SOS alerts', Siren],
          ['Incident reports', FileText],
          ['Services', HeartHandshake],
        ].map(([name, Icon]: any) => (
          <button
            key={name}
            className={tab === name ? 'selected' : ''}
            onClick={() => setTab(name)}
          >
            <Icon size={17} />
            {name}
          </button>
        ))}
      </nav>

      {message && (
        <div className="notice" role="status">
          <AlertTriangle size={17} />
          {message}
        </div>
      )}

      {tab === 'SOS alerts' && (
        <section className="admin-table-card">
          <h2>SOS alerts</h2>
          <p>
            Alerts are not automatically dispatched to emergency
            services. Follow an approved response protocol and protect
            sensitive coordinates.
          </p>

          {!alerts.length ? (
            <p className="empty-state">No SOS alerts recorded.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>User ID</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {new Date(a.created_at).toLocaleString('en-ZA')}
                      </td>

                      <td>
                        <span className={`status ${a.status}`}>
                          {a.status}
                        </span>
                      </td>

                      <td>
                        {a.latitude !== null &&
                        a.latitude !== undefined &&
                        a.longitude !== null &&
                        a.longitude !== undefined ? (
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`}
                          >
                            <MapPin size={14} />
                            Open map
                          </a>
                        ) : (
                          'Not shared'
                        )}
                      </td>

                      <td className="id-cell">{a.user_id}</td>

                      <td>
                        <select
                          disabled={busy === a.id || refreshing}
                          value={a.status}
                          onChange={(e) =>
                            update('sos_alerts', a.id, {
                              status: e.target.value,
                            })
                          }
                          aria-label="Update SOS alert status"
                        >
                          <option value="new">New</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="contacted">Contacted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'Incident reports' && (
        <section className="admin-table-card">
          <h2>Incident reports</h2>
          <p>
            Reports may contain sensitive details. Restrict access,
            avoid unnecessary exports, and follow the published
            retention and safeguarding policy.
          </p>

          {!reports.length ? (
            <p className="empty-state">No reports submitted.</p>
          ) : (
            <div className="report-admin-list">
              {reports.map((r) => (
                <article key={r.id}>
                  <div className="report-admin-head">
                    <div>
                      <span className="service-category">
                        {r.category || r.incident_type || 'Uncategorised'}
                      </span>

                      <h3>
                        {new Date(r.created_at).toLocaleString('en-ZA')}
                      </h3>
                    </div>

                    <select
                      disabled={busy === r.id || refreshing}
                      value={r.status}
                      onChange={(e) =>
                        update('incident_reports', r.id, {
                          status: e.target.value,
                        })
                      }
                      aria-label="Update incident report status"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="received">Received</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="referred">Referred</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <p>{r.description}</p>

                  <small className="id-cell">
                    User ID: {r.user_id} · Ref: {r.id}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'Services' && (
        <section className="admin-table-card">
          <h2>Support directory</h2>
          <p>
            Only mark a service as verified after completing a
            documented verification process.
          </p>

          {!services.length ? (
            <p className="empty-state">
              No services in the database.
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>Phone</th>
                    <th>Province</th>
                    <th>Verified</th>
                    <th>Active</th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.category}</td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.province || 'National'}</td>

                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(s.verified)}
                          disabled={busy === s.id || refreshing}
                          aria-label={`Verify ${s.name}`}
                          onChange={(e) =>
                            update('support_services', s.id, {
                              verified: e.target.checked,
                            })
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(s.active)}
                          disabled={busy === s.id || refreshing}
                          aria-label={`Activate ${s.name}`}
                          onChange={(e) =>
                            update('support_services', s.id, {
                              active: e.target.checked,
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <footer className="admin-footer">
        <CheckCircle2 size={16} />
        Access must be enforced by Supabase row-level security.
        Production operators should receive safeguarding and privacy
        training.
      </footer>
    </main>
  );
}