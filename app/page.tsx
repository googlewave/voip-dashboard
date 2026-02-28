'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Child {
  id: number;
  name: string;
  status: string;
  provider: string;
}

export default function Home() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChildName, setNewChildName] = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/child?select=*&order=created_at.desc`;
      const response = await fetch(url, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      });
      const data = await response.json();
      setChildren(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/child`;
      await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ 
          name: newChildName,
          status: 'enabled',
          provider: 'Twilio'
        }),
      });
      setNewChildName('');
      fetchChildren();
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const toggleStatus = async (childId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'enabled' ? 'disabled' : 'enabled';
    
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/child?id=eq.${childId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        fetchChildren();
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const deleteChild = async (childId: number) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/child?id=eq.${childId}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      });
      fetchChildren();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p>Loading devices...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
            Parent Dashboard
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Control your children's VoIP devices, toggle access, and manage settings
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-3 justify-center mb-12 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-200">
          <Link 
            href="/" 
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Dashboard
          </Link>
          <Link 
            href="/settings" 
            className="px-6 py-3 bg-white text-slate-900 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-all"
          >
            Settings
          </Link>
          <Link 
            href="/billing" 
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Billing
          </Link>
        </nav>

        {/* Add Device Form */}
        <section className="bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl p-8 mb-12 border border-slate-200">
          <h2 className="text-3xl font-bold mb-6 text-slate-900">Add New Device</h2>
          <form onSubmit={createChild} className="flex gap-4 max-w-lg">
            <input
              type="text"
              placeholder="Liam's Desk Phone, Kitchen Phone, etc."
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              className="flex-1 px-6 py-4 text-lg border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-slate-200 focus:border-slate-400 transition-all shadow-inner"
              required
            />
            <button
              type="submit"
              className="px-10 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:from-slate-800 hover:to-slate-700 transform hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
            >
              + Add Device
            </button>
          </form>
        </section>

        {/* Devices Grid */}
        <section className="bg-white/70 backdrop-blur-md shadow-2xl rounded-3xl p-8 border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Child Devices <span className="text-2xl text-slate-500">({children.length})</span>
            </h2>
            <button
              onClick={fetchChildren}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all"
            >
              🔄 Refresh
            </button>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl">
                📱
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                No devices configured
              </h3>
              <p className="text-lg text-slate-600 mb-6 max-w-md mx-auto">
                Add your first child device using the form above
              </p>
              <div className="w-24 h-12 bg-emerald-100 border-2 border-emerald-200 rounded-2xl mx-auto flex items-center justify-center">
                <span className="text-emerald-800 font-semibold">Ready to start</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {children.map((child) => (
                <div 
                  key={String(child.id)} 
                  className="group bg-gradient-to-r from-white to-slate-50 p-8 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
                        child.status === 'enabled' 
                          ? 'bg-green-500 shadow-green-200' 
                          : 'bg-red-500 shadow-red-200'
                      }`}>
                        {child.status === 'enabled' ? '✓' : '✗'}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 group-hover:text-slate-800">
                          {child.name}
                        </h3>
                        <p className="text-slate-500 mt-1">Twilio Provider</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 ml-8">
                      <span className={`px-6 py-2 rounded-full text-lg font-bold shadow-md ${
                        child.status === 'enabled'
                          ? 'bg-green-100 text-green-800 border-2 border-green-200 shadow-green-100'
                          : 'bg-red-100 text-red-800 border-2 border-red-200 shadow-red-100'
                      }`}>
                        {child.status.toUpperCase()}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => toggleStatus(child.id, child.status)}
                        className="px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-slate-800 hover:to-slate-700 transform hover:-translate-y-0.5 transition-all duration-200 text-sm whitespace-nowrap"
                      >
                        {child.status === 'enabled' ? 'Disable' : 'Enable'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => deleteChild(child.id)}
                        className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-xl transition-all text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 text-center text-sm text-slate-500">
          Built with Next.js + Supabase • RLS disabled for demo
        </div>
      </div>
    </main>
  );
}
