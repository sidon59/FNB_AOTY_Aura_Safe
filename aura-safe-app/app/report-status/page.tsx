'use client';

import { FormEvent, useState } from 'react';

type HistoryItem = {
  status: string;
  note: string | null;
  created_at: string;
};

type MessageItem = {
  sender_role: 'admin' | 'reporter';
  message: string;
  created_at: string;
};

type LookupResult = {
  report: {
    reference: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  history: HistoryItem[];
  messages: MessageItem[];
  notice: string;
};

const STATUS_LABELS: Record<string, string> = {
  received: 'Report received',
  reviewing: 'Under review',
  contacted: 'Reporter contacted',
  referred: 'Referred for follow-up',
  closed: 'Case closed',
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

function ShieldIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.8 20 6v5.4c0 5-3.4 8.3-8 10.1-4.6-1.8-8-5.1-8-10.1V6l8-3.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m8.4 12.1 2.2 2.2 5-5.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14.5 5-7 7 7 7M8 12h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LockIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4.5" y="10" width="15" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function ClockIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function ChatIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-2.5 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 11.5h8M8 8.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}

function AlertIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 9 16H3l9-16Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M12 9v4.2M12 16.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

export default function ReportStatusPage() {
  const [reference, setReference] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/report-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ reference: reference.trim(), accessCode: accessCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not find that report. Check your details and try again.');
      setResult(data as LookupResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not check your report right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="status-page">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="status-header">
        <a href="/" className="brand" aria-label="Aura Safe home">
          <span className="brand-mark"><ShieldIcon size={27} /></span>
          <span className="brand-copy"><strong>AURA <span>SAFE</span></strong><small>Safety. Support. Dignity.</small></span>
        </a>
        <a href="/" className="back-link"><ArrowLeftIcon /> <span>Back to Aura Safe</span></a>
      </header>

      <div className="page-layout">
        <section className="intro-panel">
          <div className="eyebrow"><span className="eyebrow-dot" /> PRIVATE REPORT FOLLOW-UP</div>
          <h1>Your report.<br /><em>Your next step.</em></h1>
          <p className="intro-copy">Check the latest status of a report submitted through Aura Safe. Your reference and access code help keep your information private.</p>

          <div className="trust-list">
            <div className="trust-item"><span className="trust-icon"><LockIcon /></span><span><strong>Private access</strong><small>Only someone with both details can look up the report.</small></span></div>
            <div className="trust-item"><span className="trust-icon"><ClockIcon /></span><span><strong>Clear status updates</strong><small>Review the latest recorded status and any available notes.</small></span></div>
          </div>

          <div className="quiet-note"><span className="quiet-line" /><p>Use a device you consider safe. If you think your activity is being monitored, consider using a trusted device instead.</p></div>
        </section>

        <section className="lookup-column" aria-label="Report status lookup">
          <div className="lookup-card">
            <div className="card-heading-row">
              <span className="card-icon"><SearchIcon /></span>
              <span className="secure-label"><LockIcon /> SECURE LOOKUP</span>
            </div>
            <h2>Check report status</h2>
            <p className="card-subtitle">Enter the details you received after submitting your report.</p>

            <form onSubmit={checkStatus} className="lookup-form">
              <div className="field-group">
                <label htmlFor="reference">Report reference</label>
                <input
                  id="reference"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="Paste your report reference"
                  aria-describedby="reference-help"
                />
                <small id="reference-help" className="field-hint">The long reference shown after submission.</small>
              </div>

              <div className="field-group">
                <label htmlFor="accessCode">Access code</label>
                <input
                  id="accessCode"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  autoCapitalize="characters"
                  required
                  minLength={12}
                  maxLength={12}
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="12-character access code"
                  aria-describedby="access-help"
                />
                <small id="access-help" className="field-hint">Keep this code private. It is not your report reference.</small>
              </div>

              {error && <div className="error-box" role="alert"><span className="error-symbol">!</span><p>{error}</p></div>}

              <button className="submit-button" type="submit" disabled={busy}>
                {busy ? <><span className="spinner" /> Checking securely…</> : <>Check my status <span className="button-arrow">→</span></>}
              </button>
            </form>
            <div className="privacy-foot"><LockIcon /><span>Your details are sent securely to check the report. Avoid using a shared device when possible.</span></div>
          </div>

          <div className="emergency-card">
            <span className="emergency-icon"><AlertIcon /></span>
            <div><strong>Need urgent help?</strong><p>Aura Safe is not an emergency dispatch service. If someone is in immediate danger in South Africa, call <b>112</b> from a mobile phone or <b>SAPS 10111</b> if safe to do so. Do not wait for a status update.</p></div>
          </div>
        </section>
      </div>

      {result && (
        <section className="result-section" aria-live="polite">
          <div className="result-topline"><span className="eyebrow"><span className="eyebrow-dot" /> REPORT DETAILS</span><span className="result-ref">REF · {result.report.reference}</span></div>
          <div className="result-overview">
            <div className="status-overview-main">
              <span className="status-mini-label">CURRENT STATUS</span>
              <h2>{STATUS_LABELS[result.report.status] ?? result.report.status}</h2>
              <p>Your report is recorded in Aura Safe. The information below reflects updates currently available in the system.</p>
            </div>
            <div className="date-metrics">
              <div><span>Submitted</span><strong>{formatDate(result.report.createdAt)}</strong></div>
              <div><span>Last updated</span><strong>{formatDate(result.report.updatedAt)}</strong></div>
            </div>
          </div>

          <div className="notice-card"><span className="notice-icon"><AlertIcon /></span><p>{result.notice}<br /><strong>For immediate danger, contact emergency services directly. This page does not contact them for you.</strong></p></div>

          <div className="result-grid">
            <section className="detail-card">
              <div className="detail-heading"><span className="detail-icon"><ClockIcon /></span><div><h3>Status history</h3><p>Updates recorded for this report</p></div></div>
              {result.history.length === 0 ? (
                <div className="empty-state"><span className="empty-mark"><ClockIcon /></span><p>No additional updates yet.</p><small>New status entries will appear here when they are recorded.</small></div>
              ) : (
                <ol className="timeline">
                  {result.history.map((item, index) => (
                    <li key={`${item.created_at}-${index}`} className="timeline-item">
                      <span className="timeline-node" />
                      <div className="timeline-content"><strong>{STATUS_LABELS[item.status] ?? item.status}</strong>{item.note && <p>{item.note}</p>}<small>{formatDate(item.created_at)}</small></div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="detail-card">
              <div className="detail-heading"><span className="detail-icon"><ChatIcon /></span><div><h3>Messages from Aura Safe</h3><p>Messages already recorded for this report</p></div></div>
              {result.messages.length === 0 ? (
                <div className="empty-state"><span className="empty-mark"><ChatIcon /></span><p>No messages yet.</p><small>There are no messages recorded for this report at the moment.</small></div>
              ) : (
                <div className="message-list">
                  {result.messages.map((item, index) => (
                    <article key={`${item.created_at}-${index}`} className="message-item">
                      <div className="message-meta"><strong>{item.sender_role === 'admin' ? 'Aura Safe team' : 'Your message'}</strong><small>{formatDate(item.created_at)}</small></div>
                      <p>{item.message}</p>
                    </article>
                  ))}
                </div>
              )}
              <p className="message-footnote">This page displays messages already recorded. It does not send a reply.</p>
            </section>
          </div>
        </section>
      )}

      <footer className="status-footer"><span>© Aura Safe</span><span>Built to support safer reporting in South Africa</span><a href="/">Return to home <span aria-hidden="true">↗</span></a></footer>

      <style jsx>{`
        :global(*) { box-sizing: border-box; }
        .status-page { position: relative; min-height: 100vh; overflow: hidden; padding: 0 6.2vw 28px; color: #192b38; background: #f5f8f8; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .ambient { position: absolute; z-index: 0; pointer-events: none; border-radius: 999px; filter: blur(1px); }
        .ambient-one { width: 450px; height: 450px; right: -150px; top: 70px; background: radial-gradient(circle, rgba(91, 190, 172, .16), rgba(91, 190, 172, 0) 70%); }
        .ambient-two { width: 420px; height: 420px; left: -240px; top: 450px; background: radial-gradient(circle, rgba(31, 94, 116, .08), rgba(31, 94, 116, 0) 70%); }
        .status-header, .page-layout, .result-section, .status-footer { position: relative; z-index: 1; max-width: 1240px; margin-left: auto; margin-right: auto; }
        .status-header { height: 92px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e0e9e8; }
        .brand { display: inline-flex; align-items: center; gap: 12px; color: inherit; text-decoration: none; }
        .brand-mark { display: grid; width: 46px; height: 46px; place-items: center; color: #f5fffc; border-radius: 15px; background: linear-gradient(145deg, #1e7a78, #205a70); box-shadow: 0 7px 18px rgba(30, 109, 113, .19); }
        .brand-copy { display: grid; gap: 3px; }
        .brand-copy strong { font-size: 15px; letter-spacing: .16em; font-weight: 850; }
        .brand-copy strong span { color: #22877d; }
        .brand-copy small { font-size: 11px; color: #70818a; letter-spacing: .025em; }
        .back-link { display: inline-flex; align-items: center; gap: 8px; color: #536975; text-decoration: none; font-size: 13px; font-weight: 650; padding: 10px 13px; border: 1px solid #dce7e6; background: rgba(255,255,255,.72); border-radius: 10px; transition: .18s ease; }
        .back-link:hover { color: #176e70; border-color: #9fc9c5; background: #fff; }
        .page-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 490px); align-items: center; gap: clamp(42px, 8vw, 118px); padding: 70px 0 62px; }
        .intro-panel { max-width: 535px; padding: 8px 0; }
        .eyebrow { display: inline-flex; align-items: center; gap: 9px; color: #287c76; font-size: 10px; letter-spacing: .18em; font-weight: 850; }
        .eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: #37a99a; box-shadow: 0 0 0 4px rgba(55,169,154,.12); }
        .intro-panel h1 { margin: 22px 0 18px; color: #173341; font-size: clamp(42px, 5.3vw, 68px); line-height: 1.04; letter-spacing: -.055em; font-weight: 790; }
        .intro-panel h1 em { font-style: normal; color: #2c8f84; }
        .intro-copy { max-width: 460px; font-size: 16px; line-height: 1.8; color: #627581; margin: 0; }
        .trust-list { display: grid; gap: 20px; margin-top: 39px; }
        .trust-item { display: flex; align-items: flex-start; gap: 14px; }
        .trust-icon { display: grid; place-items: center; flex: 0 0 auto; width: 41px; height: 41px; border-radius: 13px; color: #257d75; background: #e1f2ed; border: 1px solid #d2e9e2; }
        .trust-item strong { display: block; margin: 1px 0 4px; font-size: 13px; font-weight: 800; color: #25404d; }
        .trust-item small { display: block; max-width: 315px; color: #71828b; font-size: 12px; line-height: 1.65; }
        .quiet-note { display: flex; align-items: stretch; gap: 13px; margin-top: 35px; max-width: 410px; }
        .quiet-line { flex: 0 0 3px; border-radius: 4px; background: #86bdb3; }
        .quiet-note p { margin: 0; color: #77868d; font-size: 11px; line-height: 1.75; }
        .lookup-column { width: 100%; }
        .lookup-card { padding: clamp(25px, 3.4vw, 37px); border: 1px solid rgba(214, 229, 226, .95); border-radius: 25px; background: rgba(255,255,255,.92); box-shadow: 0 18px 60px rgba(26, 65, 73, .08), 0 2px 10px rgba(26, 65, 73, .03); backdrop-filter: blur(12px); }
        .card-heading-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 22px; }
        .card-icon { display: grid; place-items: center; width: 44px; height: 44px; color: #fff; border-radius: 14px; background: #216d73; box-shadow: 0 5px 12px rgba(33,109,115,.17); }
        .secure-label { display: inline-flex; align-items: center; gap: 6px; color: #43837a; font-size: 9px; letter-spacing: .12em; font-weight: 850; }
        .secure-label :global(svg) { width: 14px; height: 14px; }
        .lookup-card h2 { margin: 0; color: #183744; font-size: 27px; line-height: 1.2; letter-spacing: -.035em; font-weight: 800; }
        .card-subtitle { margin: 10px 0 26px; color: #75858e; font-size: 13px; line-height: 1.7; }
        .lookup-form { display: grid; gap: 21px; }
        .field-group { display: grid; gap: 8px; }
        .field-group label { color: #304b57; font-size: 12px; font-weight: 800; }
        .field-group input { display: block; width: 100%; height: 49px; border: 1px solid #d9e4e3; border-radius: 11px; background: #fbfdfd; color: #203943; padding: 0 14px; outline: none; font: inherit; font-size: 13px; transition: border .18s, box-shadow .18s, background .18s; }
        .field-group input::placeholder { color: #9aa9af; }
        .field-group input:focus { border-color: #4caaa0; background: #fff; box-shadow: 0 0 0 4px rgba(60, 157, 146, .12); }
        #accessCode { letter-spacing: .13em; font-weight: 750; }
        .field-hint { color: #8b9aa0; font-size: 10px; line-height: 1.55; }
        .submit-button { display: flex; justify-content: center; align-items: center; gap: 12px; width: 100%; min-height: 51px; margin-top: 2px; border: 0; border-radius: 11px; background: linear-gradient(110deg, #1f7776, #267f78); color: #fff; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 7px 16px rgba(34, 119, 115, .17); transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
        .submit-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(34, 119, 115, .23); background: linear-gradient(110deg, #196c6c, #227770); }
        .submit-button:focus-visible { outline: 3px solid #91d7ce; outline-offset: 3px; }
        .submit-button:disabled { opacity: .72; cursor: wait; }
        .button-arrow { font-size: 20px; line-height: 1; font-weight: 400; }
        .spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border: 1px solid #f2c9c5; border-radius: 10px; color: #8e3434; background: #fff5f4; }
        .error-symbol { display: grid; place-items: center; width: 18px; height: 18px; flex: 0 0 auto; border-radius: 50%; color: #fff; background: #b9504b; font-size: 12px; font-weight: 800; }
        .error-box p { margin: 0; font-size: 12px; line-height: 1.6; }
        .privacy-foot { display: flex; gap: 8px; align-items: flex-start; padding-top: 18px; margin-top: 20px; border-top: 1px solid #edf1f1; color: #89979d; font-size: 10px; line-height: 1.65; }
        .privacy-foot :global(svg) { flex: 0 0 auto; color: #6f9d95; width: 14px; height: 14px; }
        .emergency-card { display: flex; align-items: flex-start; gap: 13px; margin-top: 16px; padding: 17px 19px; border: 1px solid #f1dfbb; border-radius: 17px; background: rgba(255, 250, 239, .85); }
        .emergency-icon { display: grid; place-items: center; flex: 0 0 auto; width: 32px; height: 32px; border-radius: 10px; color: #a76d16; background: #f8ebce; }
        .emergency-card strong { display: block; margin: 1px 0 4px; color: #715323; font-size: 11px; font-weight: 850; }
        .emergency-card p { margin: 0; color: #8a754f; font-size: 10px; line-height: 1.7; }
        .emergency-card b { color: #76551b; }
        .result-section { margin-top: 0; margin-bottom: 44px; padding: 30px; border: 1px solid #dfe9e7; border-radius: 24px; background: rgba(255,255,255,.91); box-shadow: 0 15px 45px rgba(29, 65, 71, .06); }
        .result-topline { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 22px; border-bottom: 1px solid #edf2f1; }
        .result-ref { max-width: 62%; overflow-wrap: anywhere; color: #7c8e95; font-size: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .result-overview { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(260px, .9fr); gap: 30px; padding: 29px 0; }
        .status-mini-label { color: #7e9297; font-size: 9px; font-weight: 850; letter-spacing: .16em; }
        .status-overview-main h2 { margin: 8px 0 8px; color: #1c7771; font-size: clamp(25px, 3vw, 34px); letter-spacing: -.04em; font-weight: 830; }
        .status-overview-main p { max-width: 520px; margin: 0; color: #76868d; font-size: 12px; line-height: 1.8; }
        .date-metrics { display: grid; align-content: center; gap: 14px; padding-left: 25px; border-left: 1px solid #e5edeb; }
        .date-metrics div { display: grid; gap: 5px; }
        .date-metrics span { color: #8b999d; font-size: 10px; }
        .date-metrics strong { color: #3e5963; font-size: 11px; font-weight: 750; }
        .notice-card { display: flex; gap: 12px; padding: 16px 18px; border: 1px solid #f0dfb8; border-radius: 13px; color: #7a653c; background: #fffaf0; }
        .notice-icon { flex: 0 0 auto; color: #ae7a21; }
        .notice-card p { margin: 0; font-size: 11px; line-height: 1.8; }
        .notice-card strong { display: inline-block; margin-top: 4px; color: #6e562a; }
        .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 22px; }
        .detail-card { min-width: 0; padding: 23px; border: 1px solid #e2ebe9; border-radius: 17px; background: #fff; }
        .detail-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 21px; }
        .detail-icon { display: grid; flex: 0 0 auto; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: #2c8178; background: #e8f5f1; }
        .detail-heading h3 { margin: 0; color: #28434e; font-size: 14px; font-weight: 850; }
        .detail-heading p { margin: 4px 0 0; color: #91a0a5; font-size: 10px; }
        .empty-state { display: grid; place-items: center; text-align: center; padding: 25px 14px 30px; border: 1px dashed #dce8e5; border-radius: 13px; background: #fbfdfc; }
        .empty-mark { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 12px; border-radius: 50%; color: #77a69d; background: #eaf4f1; }
        .empty-state p { margin: 0; color: #61757d; font-size: 12px; font-weight: 750; }
        .empty-state small { max-width: 225px; margin-top: 5px; color: #96a4a8; font-size: 10px; line-height: 1.6; }
        .timeline { list-style: none; margin: 2px 0 0; padding: 0; }
        .timeline-item { position: relative; display: flex; gap: 13px; padding: 0 0 20px; }
        .timeline-item:not(:last-child)::before { content: ''; position: absolute; top: 14px; left: 5px; bottom: -1px; width: 1px; background: #d8e8e3; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-node { position: relative; z-index: 1; flex: 0 0 auto; width: 11px; height: 11px; margin-top: 3px; border: 3px solid #d5eee7; border-radius: 50%; background: #3d9d8d; }
        .timeline-content { min-width: 0; }
        .timeline-content strong { color: #3c5862; font-size: 11px; font-weight: 800; }
        .timeline-content p { margin: 5px 0 0; color: #70838a; font-size: 11px; line-height: 1.65; }
        .timeline-content small { display: block; margin-top: 5px; color: #9ba8ab; font-size: 9px; }
        .message-list { display: grid; gap: 10px; }
        .message-item { padding: 13px; border: 1px solid #e6eeec; border-radius: 12px; background: #fbfdfc; }
        .message-meta { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .message-meta strong { color: #307e75; font-size: 10px; font-weight: 850; }
        .message-meta small { color: #9aa7aa; font-size: 9px; text-align: right; }
        .message-item p { margin: 9px 0 0; color: #526a74; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 11px; line-height: 1.7; }
        .message-footnote { margin: 16px 0 0; color: #95a1a5; font-size: 10px; line-height: 1.65; }
        .status-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 19px 0 0; border-top: 1px solid #e2eae9; color: #8a9a9f; font-size: 10px; }
        .status-footer a { color: #467f78; text-decoration: none; font-weight: 750; }
        .status-footer a:hover { text-decoration: underline; }
        @media (max-width: 900px) { .status-page { padding-left: 5vw; padding-right: 5vw; } .page-layout { grid-template-columns: minmax(0, .95fr) minmax(340px, 1.05fr); gap: 35px; padding: 52px 0 46px; } .intro-panel h1 { font-size: clamp(40px, 5vw, 55px); } .result-section { padding: 23px; } .detail-card { padding: 18px; } }
        @media (max-width: 720px) { .status-page { padding-left: 18px; padding-right: 18px; } .status-header { height: 78px; } .brand-mark { width: 41px; height: 41px; } .brand-copy strong { font-size: 13px; } .brand-copy small { font-size: 10px; } .back-link { padding: 9px; font-size: 11px; } .back-link :global(svg) { width: 15px; height: 15px; } .page-layout { grid-template-columns: 1fr; gap: 32px; padding: 43px 0 42px; } .intro-panel { max-width: 600px; } .intro-panel h1 { margin-top: 17px; font-size: clamp(43px, 11vw, 60px); } .intro-copy { font-size: 14px; line-height: 1.75; } .trust-list { grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 27px; } .trust-item { gap: 10px; } .trust-icon { width: 36px; height: 36px; border-radius: 11px; } .trust-item strong { font-size: 11px; } .trust-item small { font-size: 10px; } .quiet-note { margin-top: 25px; } .lookup-card { padding: 24px; border-radius: 21px; } .result-section { padding: 18px; border-radius: 19px; } .result-topline { align-items: flex-start; flex-direction: column; gap: 11px; } .result-ref { max-width: 100%; } .result-overview { grid-template-columns: 1fr; gap: 20px; padding: 24px 0; } .date-metrics { grid-template-columns: 1fr 1fr; padding: 16px 0 0; border-left: 0; border-top: 1px solid #e5edeb; } .result-grid { grid-template-columns: 1fr; gap: 14px; } .status-footer { flex-wrap: wrap; align-items: flex-start; line-height: 1.5; } .status-footer span:nth-child(2) { order: 3; flex-basis: 100%; } }
        @media (max-width: 400px) { .status-page { padding-left: 13px; padding-right: 13px; } .back-link span { display: none; } .trust-list { grid-template-columns: 1fr; } .lookup-card { padding: 20px; } .date-metrics { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }
      `}</style>
    </main>
  );
}