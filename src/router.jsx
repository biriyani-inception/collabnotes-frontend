// Minimal History-API router (no extra dependency). Routes: / , /auth , /app
// (".html" aliases from the original multi-page site keep working).
import { useEffect, useState } from 'react';

export function normalize(pathname) {
  let p = pathname.replace(/\.html$/, '').replace(/\/+$/, '');
  if (p === '' || p === '/index') return '/';
  return p;
}

export function navigate(to, replace = false) {
  if (replace) history.replaceState(null, '', to);
  else history.pushState(null, '', to);
  window.dispatchEvent(new Event('cn:navigate'));
}

export function useRoute() {
  const [loc, setLoc] = useState(() => ({ path: normalize(location.pathname), search: location.search }));
  useEffect(() => {
    const on = () => setLoc({ path: normalize(location.pathname), search: location.search });
    window.addEventListener('popstate', on);
    window.addEventListener('cn:navigate', on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener('cn:navigate', on);
    };
  }, []);
  return loc;
}

export function Link({ to, className, children }) {
  return (
    <a
      className={className}
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
