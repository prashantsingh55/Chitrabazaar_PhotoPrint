'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Camera, ShieldCheck, LogOut, ArrowRight } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const role = user?.role;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D8]">
      {/* Editorial Top Chronicle Strip */}
      <div className="hidden sm:block border-b border-[#E8E2D8]/60 bg-[#F4F0E8]/50 py-1 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-[#8C827A] uppercase">
          <div>Vol. 01 • No. 04 — Autumn Print Edition</div>
          <div className="flex items-center gap-4">
            <span>Darkroom Dispatch: Active</span>
            <span>•</span>
            <span>Archival Giclée & Silver Gelatin</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Magazine Masthead Brand */}
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex flex-col">
              <span className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[#1A1816] group-hover:text-[#3D3A36] transition-colors">
                Chitrabazaar
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#8C827A] -mt-1">
                The Photographic Press
              </span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/upload"
              className={`text-xs font-mono uppercase tracking-[0.15em] py-1 transition-all ${
                pathname.startsWith('/upload')
                  ? 'text-[#1A1816] border-b border-[#1A1816] font-semibold'
                  : 'text-[#6B665F] hover:text-[#1A1816]'
              }`}
            >
              Order Prints
            </Link>

            <Link
              href="/orders"
              className={`text-xs font-mono uppercase tracking-[0.15em] py-1 transition-all ${
                pathname.startsWith('/orders')
                  ? 'text-[#1A1816] border-b border-[#1A1816] font-semibold'
                  : 'text-[#6B665F] hover:text-[#1A1816]'
              }`}
            >
              Track Orders
            </Link>

            {/* Studio portal link */}
            {(role === 'STUDIO_ADMIN' || role === 'SUPER_ADMIN') && (
              <Link
                href="/studio/dashboard"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-[0.15em] rounded-[2px] transition-all border ${
                  pathname.startsWith('/studio')
                    ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816]'
                    : 'text-[#6B665F] border-[#E8E2D8] hover:border-[#1A1816] hover:text-[#1A1816]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Studio Desk
              </Link>
            )}

            {/* Super Admin portal link */}
            {role === 'SUPER_ADMIN' && (
              <Link
                href="/admin/dashboard"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase tracking-[0.15em] rounded-[2px] transition-all border ${
                  pathname.startsWith('/admin')
                    ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816]'
                    : 'text-[#6B665F] border-[#E8E2D8] hover:border-[#1A1816] hover:text-[#1A1816]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Curator HQ
              </Link>
            )}
          </nav>

          {/* Right Area: Notifications & User profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NotificationCenter />

                <div className="flex items-center gap-2 pl-3 border-l border-[#E8E2D8]">
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-white/70 border border-[#E8E2D8] rounded-[2px] hover:border-[#1A1816] transition-all text-xs font-mono tracking-wider text-[#1A1816]"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#1A1816] text-[#FAF8F5] flex items-center justify-center text-[10px] font-serif">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                    <span className="truncate max-w-[90px]">
                      {user.name?.split(' ')[0]}
                    </span>
                  </Link>

                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="p-1.5 rounded-[2px] text-[#8C827A] hover:text-[#1A1816] hover:bg-[#F4F0E8] transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.15em] text-[#6B665F] hover:text-[#1A1816] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-mono uppercase tracking-[0.15em] text-[#FAF8F5] bg-[#1A1816] hover:bg-[#3D3A36] rounded-[2px] transition-all flex items-center gap-1.5"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

