'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserCheck, Camera, ShieldAlert, Loader2 } from 'lucide-react';

export function DemoLoginBar() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  // Strictly gate demo logins behind dev environment or explicit opt-in flag
  const isEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

  if (!isEnabled) {
    return null;
  }

  const handleQuickLogin = async (email: string, role: string, redirectPath: string) => {
    try {
      setLoadingRole(role);
      const res = await signIn('credentials', {
        email,
        password: role === 'admin' ? 'admin123' : role === 'studio' ? 'studio123' : 'customer123',
        redirect: false,
      });

      if (res?.ok) {
        router.push(redirectPath);
        router.refresh();
      } else {
        alert(res?.error || 'Failed to login with demo credentials');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="bg-[#F4F0E8] border border-[#E8E2D8] rounded-[2px] p-3 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-[#1A1816] text-[#FAF8F5] text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded-[1px]">
            Archival Sandbox
          </span>
          <p className="text-xs font-serif italic text-[#3D3A36]">
            One-click demonstration ledger entries:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Customer */}
          <button
            type="button"
            disabled={!!loadingRole}
            onClick={() => handleQuickLogin('rahul@example.com', 'customer', '/orders')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1 bg-[#FAF8F5] hover:bg-white text-[#1A1816] text-xs font-mono uppercase tracking-[0.12em] rounded-[2px] border border-[#E8E2D8] hover:border-[#1A1816] transition-all disabled:opacity-50"
          >
            {loadingRole === 'customer' ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#1A1816]" />
            ) : (
              <UserCheck className="w-3 h-3 text-[#1A1816]" />
            )}
            Client Folio
          </button>

          {/* Studio Admin */}
          <button
            type="button"
            disabled={!!loadingRole}
            onClick={() => handleQuickLogin('apex@photostudio.com', 'studio', '/studio/dashboard')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1 bg-[#FAF8F5] hover:bg-white text-[#1A1816] text-xs font-mono uppercase tracking-[0.12em] rounded-[2px] border border-[#E8E2D8] hover:border-[#1A1816] transition-all disabled:opacity-50"
          >
            {loadingRole === 'studio' ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#1A1816]" />
            ) : (
              <Camera className="w-3 h-3 text-[#1A1816]" />
            )}
            Darkroom Studio
          </button>

          {/* Super Admin */}
          <button
            type="button"
            disabled={!!loadingRole}
            onClick={() => handleQuickLogin('admin@chitrabazaar.com', 'admin', '/admin/dashboard')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1 bg-[#FAF8F5] hover:bg-white text-[#1A1816] text-xs font-mono uppercase tracking-[0.12em] rounded-[2px] border border-[#E8E2D8] hover:border-[#1A1816] transition-all disabled:opacity-50"
          >
            {loadingRole === 'admin' ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#1A1816]" />
            ) : (
              <ShieldAlert className="w-3 h-3 text-[#1A1816]" />
            )}
            Curator HQ
          </button>
        </div>
      </div>
    </div>
  );
}

