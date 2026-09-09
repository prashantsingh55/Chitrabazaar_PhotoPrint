'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DemoLoginBar } from '@/components/DemoLoginBar';
import { LogIn, User, Camera, ShieldAlert, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/orders';

  const [activeTab, setActiveTab] = useState<'customer' | 'studio' | 'admin'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (!res?.ok) {
        setError(res?.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Route based on role/tab
      if (activeTab === 'studio') {
        router.push('/studio/dashboard');
      } else if (activeTab === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push(callbackUrl === '/login' ? '/orders' : callbackUrl);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during authentication');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-md w-full space-y-6">
        {/* Environment-gated 1-click demo login bar */}
        <DemoLoginBar />

        {/* Editorial Bookplate Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A]">
            Folio Registry & Authentication
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816] tracking-tight">
            Sign In to Chitrabazaar
          </h1>
          <p className="font-serif italic text-xs text-[#6B665F]">
            Select your ledger designation to access your workspace:
          </p>
        </div>

        {/* Account Type Tabs */}
        <div className="flex border border-[#E8E2D8] bg-[#F4F0E8]/50 p-1 rounded-[2px] gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customer');
              setError(null);
            }}
            className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.15em] rounded-[1px] flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'customer'
                ? 'bg-[#1A1816] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B665F] hover:text-[#1A1816]'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Client
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('studio');
              setError(null);
            }}
            className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.15em] rounded-[1px] flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'studio'
                ? 'bg-[#1A1816] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B665F] hover:text-[#1A1816]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Darkroom
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError(null);
            }}
            className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.15em] rounded-[1px] flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-[#1A1816] text-[#FAF8F5] shadow-xs'
                : 'text-[#6B665F] hover:text-[#1A1816]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Curator HQ
          </button>
        </div>

        {/* Login Form Card */}
        <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-7 rounded-[2px] shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-[2px] bg-[#F4F0E8] border border-[#A3432B]/30 text-[#A3432B] text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Identity (Email)"
              type="email"
              required
              placeholder={
                activeTab === 'admin'
                  ? 'admin@chitrabazaar.com'
                  : activeTab === 'studio'
                  ? 'apex@photostudio.com'
                  : 'rahul@example.com'
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Secret Passkey"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                isLoading={isLoading}
              >
                <LogIn className="w-4 h-4 mr-1.5" /> Authenticate & Enter
              </Button>
            </div>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-4 border-t border-[#E8E2D8] flex items-center justify-between text-xs font-mono">
            <span className="text-[#8C827A]">Unregistered?</span>
            <Link
              href={activeTab === 'studio' ? '/register?type=studio' : '/register'}
              className="font-medium text-[#1A1816] underline hover:text-[#6B665F] transition-colors"
            >
              {activeTab === 'studio' ? 'Darkroom Partner Application' : 'Create Client Account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-mono text-[#8C827A]">Loading authentication ledger...</div>}>
      <LoginForm />
    </Suspense>
  );
}

