import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    const result =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName.trim() || null } },
          });

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Account created. Check your email to confirm your address, then sign in.');
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-5 py-10 flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.18em] uppercase text-[#c66b4b]">Your place for what matters</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#27231f]">
            Life<span className="text-[#4f46a5]">Thread</span>
          </h1>
          <p className="mt-3 text-[#766e64]">Keep your thoughts, plans, and progress connected to you.</p>
        </div>

        <div className="rounded-3xl border border-[#e6ded2] bg-[#fbf9f6] p-6 shadow-[0_20px_60px_rgba(63,48,32,0.08)]">
          <div className="flex gap-1 rounded-xl bg-[#eee7dc] p-1 mb-6">
            {(['sign-in', 'sign-up'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setError('');
                  setMessage('');
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === value ? 'bg-white text-[#4f46a5] shadow-sm' : 'text-[#766e64]'
                }`}
              >
                {value === 'sign-in' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'sign-up' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-[#27231f]">Your name <span className="font-normal text-[#9a9186]">(optional)</span></span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-xl border border-[#e6ded2] bg-white px-3.5 py-3 outline-none focus:border-[#4f46a5]"
                  autoComplete="name"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#27231f]">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#e6ded2] bg-white px-3.5 py-3 outline-none focus:border-[#4f46a5]"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-[#27231f]">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#e6ded2] bg-white px-3.5 py-3 outline-none focus:border-[#4f46a5]"
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              />
            </label>

            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
            {message && <p className="rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-700">{message}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#4f46a5] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#40388f] disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : mode === 'sign-in' ? 'Enter LifeThread' : 'Create my profile'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
