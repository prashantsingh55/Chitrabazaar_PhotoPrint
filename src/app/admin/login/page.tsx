'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@chitrabazaar.com');
  const [password, setPassword] = useState('admin123');
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
        setError(res?.error || 'Invalid admin credentials');
        setIsLoading(false);
        return;
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('An error occurred during admin login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-md w-full space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] hover:text-[#1A1816] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Masthead
        </Link>

        <div className="text-center space-y-2 border-b border-[#E8E2D8] pb-6">
          <Badge variant="outline" size="sm">
            Curatorial Oversight
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
            Platform Command Desk
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
            Guild network audits, dispatch controls & financial ledgers
          </p>
        </div>

        <Card className="p-8 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-[2px] bg-[#FAF0ED] border border-[#C05A46]/30 text-[#C05A46] text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6 p-4 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] text-xs space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">
              Curator Demo Credentials:
            </span>
            <p className="text-[#3D3A36]">
              Email: <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded-[2px] border border-[#E8E2D8] font-mono text-[#1A1816]">admin@chitrabazaar.com</code>
            </p>
            <p className="text-[#3D3A36]">
              Passkey: <code className="bg-[#FAF8F5] px-1.5 py-0.5 rounded-[2px] border border-[#E8E2D8] font-mono text-[#1A1816]">admin123</code>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Curator Email Identity"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Master Security Passkey"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" fullWidth size="md" isLoading={isLoading}>
                <ShieldCheck className="w-4 h-4 mr-2" /> Authenticate Command Desk
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
