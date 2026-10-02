'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          Gestalt <span>Guild</span>
        </Link>
        <nav className="nav">
          <Link href="/">Lobbies</Link>
          <Link href="/give">Give</Link>
          {session && <Link href="/house">House</Link>}
          {session && <Link href="/lobbies/new">Host</Link>}
          {session && <Link href="/profile">Profile</Link>}
          {session ? (
            <button className="linklike" onClick={handleLogout}>Logout</button>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
