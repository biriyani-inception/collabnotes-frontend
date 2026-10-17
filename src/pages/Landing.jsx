import { Link } from '../router';

export default function Landing() {
  return (
    <div className="landing-wrap">
      <p className="landing-brand">CollabNotes</p>
      <p className="landing-tag">Real-time collaborative notes, built on Spring Boot &amp; STOMP.</p>

      <h1 className="landing-hero">Notes that move at the speed of your team.</h1>
      <p className="landing-sub">
        Open a page, share it, type. Each keystroke, each cursor, each person — synced live
        across every window, with no plugins and no setup.
      </p>

      <div className="landing-cta">
        <Link className="btn-primary" to="/auth?tab=register">Create an account</Link>
        <Link className="btn-secondary" to="/auth">Log in</Link>
      </div>

      <div className="landing-features">
        <div className="feat">
          <h3>Live editing</h3>
          <p>STOMP over WebSocket pushes every keystroke to everyone on the page — no manual refresh.</p>
        </div>
        <div className="feat">
          <h3>Workspaces &amp; pages</h3>
          <p>Group pages into workspaces. Invite teammates by email with EDITOR or VIEWER roles.</p>
        </div>
        <div className="feat">
          <h3>Persistent</h3>
          <p>Every save hits the database — close the tab and come back to the same content.</p>
        </div>
      </div>

      <p className="landing-foot">
        Tip: register two accounts in separate windows, invite one to the other's workspace,
        open the same page in both, and watch it sync. Backend hosted on Railway,
        frontend on Vercel.
      </p>
    </div>
  );
}
