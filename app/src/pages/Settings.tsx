import { useEffect, useState } from 'react';
import { LogOut, Save, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadProfile, updateProfile } from '../lib/remoteRepository';
import { enqueueMutation } from '../lib/mutationQueue';

export function Settings() {
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadProfile().then((profile) => setDisplayName(profile.display_name ?? '')).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Unable to load your profile.');
    });
  }, []);

  async function save() {
    setSaving(true); setError(''); setStatus('');
    try {
      const updates = { display_name: displayName.trim() || null };
      try { await updateProfile(updates); setStatus('Profile updated.'); }
      catch (reason) {
        if (!navigator.onLine) { await enqueueMutation({ kind: 'updateProfile', value: updates }); setStatus('Saved locally; it will sync when you are online.'); }
        else throw reason;
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update your profile.');
    } finally { setSaving(false); }
  }

  return <section className="max-w-2xl">
    <header className="mb-7"><p className="text-sm font-semibold text-[#c66b4b]">Account</p><h2 className="mt-1 text-3xl font-bold">Profile & settings</h2><p className="mt-2 text-sm text-[#766e64]">Keep your profile details up to date.</p></header>
    <div className="rounded-2xl border border-[#e6ded2] bg-[#fbf9f6] p-5 shadow-sm">
      <label className="block text-sm font-medium"><span className="mb-2 flex items-center gap-2"><User size={16} /> Display name</span>
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-xl border border-[#e6ded2] bg-white px-3.5 py-3 outline-none focus:border-[#4f46a5]" maxLength={80} autoComplete="name" />
      </label>
      {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
      {status && <p className="mt-4 rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-700">{status}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#4f46a5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{saving ? 'Saving…' : 'Save changes'}</button>
        <button onClick={() => void supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-xl border border-[#e6ded2] px-4 py-2.5 text-sm font-semibold text-[#766e64] hover:bg-[#f1ece5]"><LogOut size={16} /> Sign out</button>
      </div>
    </div>
  </section>;
}
