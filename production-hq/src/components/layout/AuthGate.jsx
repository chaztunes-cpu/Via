import { useEffect, useState } from 'react';
import { DEMO_MODE } from '../../data/config.js';
import { getSession, onAuthChange } from '../../data/api.js';
import { DataProvider } from '../../data/DataProvider.jsx';
import SignIn from '../../pages/SignIn.jsx';
import Logo from './Logo.jsx';

/** Demo mode opens straight away; the live app asks you to sign in first. */
export default function AuthGate({ children }) {
  if (DEMO_MODE) return <DataProvider>{children}</DataProvider>;
  return <LiveGate>{children}</LiveGate>;
}

function LiveGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    getSession().then(setSession).catch(() => setSession(null));
    return onAuthChange(setSession);
  }, []);

  if (session === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="opacity-60">
          <Logo />
        </div>
      </div>
    );
  }
  if (!session) return <SignIn />;
  return (
    <DataProvider key={session.user.id} userId={session.user.id} userEmail={session.user.email}>
      {children}
    </DataProvider>
  );
}
