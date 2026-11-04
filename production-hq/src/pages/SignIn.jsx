import { useState } from 'react';
import { signIn } from '../data/api.js';
import Logo from '../components/layout/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import { Field, TextInput } from '../components/ui/Field.jsx';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form onSubmit={submit} noValidate className="rounded-xl border border-line bg-surface p-6">
          <h1 className="text-base font-semibold text-zinc-100">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">Your private production workspace.</p>
          <div className="mt-5 flex flex-col gap-4">
            <Field id="signin-email" label="Email">
              <TextInput
                id="signin-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field id="signin-password" label="Password">
              <TextInput
                id="signin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" disabled={busy} className="mt-1 w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
