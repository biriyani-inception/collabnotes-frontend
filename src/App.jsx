import { useEffect } from 'react';
import { useRoute, navigate } from './router';
import { Auth } from './api/client';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Workspace from './pages/Workspace';

export default function App() {
  const { path, search } = useRoute();

  useEffect(() => {
    document.body.classList.toggle('landing', path === '/');
  }, [path]);

  // Same guards as the original pages.
  useEffect(() => {
    if (path === '/app' && !Auth.isLoggedIn()) navigate('/', true);
    if (path === '/auth' && Auth.isLoggedIn()) navigate('/app', true);
  }, [path]);

  if (path === '/app') return Auth.isLoggedIn() ? <Workspace /> : null;
  if (path === '/auth') {
    if (Auth.isLoggedIn()) return null;
    const tab = new URLSearchParams(search).get('tab') === 'register' ? 'register' : 'login';
    return <AuthPage key={tab} initialTab={tab} />;
  }
  return <Landing />;
}
