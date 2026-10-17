import { useState } from 'react';
import { Api, Auth } from '../api/client';
import { navigate } from '../router';

export default function AuthPage({ initialTab }) {
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState('');
  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ name: '', email: '', password: '' });

  const switchTab = (t) => { setTab(t); setError(''); };

  async function submit(e, fn) {
    e.preventDefault();
    setError('');
    try {
      const res = await fn();
      Auth.save(res);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <p className="auth-brand">CollabNotes</p>
        <p className="auth-tagline">Real-time collaborative notes, built on Spring Boot &amp; STOMP.</p>

        <div className="tabs">
          <button className={'tab' + (tab === 'login' ? ' active' : '')} onClick={() => switchTab('login')}>Log in</button>
          <button className={'tab' + (tab === 'register' ? ' active' : '')} onClick={() => switchTab('register')}>Sign up</button>
        </div>

        <div className="form-error" style={{ display: error ? 'block' : 'none' }}>{error}</div>

        <form className={'form-pane' + (tab === 'login' ? ' active' : '')}
              onSubmit={(e) => submit(e, () => Api.login(login.email, login.password))}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Log in</button>
        </form>

        <form className={'form-pane' + (tab === 'register' ? ' active' : '')}
              onSubmit={(e) => submit(e, () => Api.register(reg.name, reg.email, reg.password))}>
          <div className="field">
            <label>Name</label>
            <input type="text" required value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" minLength={6} required value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Create account</button>
        </form>
      </div>
    </div>
  );
}
