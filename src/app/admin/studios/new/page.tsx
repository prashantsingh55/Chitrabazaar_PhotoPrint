'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Building, Plus, ArrowLeft, AlertCircle } from 'lucide-react';

export default function AdminNewStudioPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    commissionRate: '15.0',
    workingHours: '9:00 AM - 8:30 PM (Mon-Sat)',
    servicesOffered: '4x6, 5x7, A4, 8x10, Passport, Glossy, Matte, Lustre',
    password: 'studio123',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to onboard studio');
        setIsLoading(false);
        return;
      }

      router.push('/admin/studios');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the studio');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-[#E8E2D8] pb-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/studios"
            className="p-1.5 rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#1A1816] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Badge variant="outline" size="sm">
            Guild Accreditation
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
          Onboard Partner Darkroom Atelier
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
          Establishes darkroom credentials, baseline tariff percentage & initial access key
        </p>
      </div>

      <Card className="p-8 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-6">
        {error && (
          <div className="p-4 rounded-[2px] bg-[#FAF0ED] border border-[#C05A46]/30 text-[#C05A46] text-xs font-mono flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Studio Commercial Name"
              required
              placeholder="e.g. Prestige Darkroom Labs"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Proprietor / Master Printer"
              required
              placeholder="e.g. Arvind Mehta"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Official Darkroom Email"
              type="email"
              required
              placeholder="studio@photolab.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Direct Phone Line"
              required
              placeholder="+91 98200 11223"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Textarea
            label="Atelier Physical Address"
            required
            placeholder="Commercial unit number, gallery building, street..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-5">
            <Input
              label="City"
              required
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Postal PIN"
              required
              placeholder="e.g. 400001"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
            <Input
              label="Platform Cut (%)"
              required
              placeholder="15.0"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Operating Schedule"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
            />
            <Input
              label="Initial Staff Passkey"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="pt-5 border-t border-[#E8E2D8] flex items-center justify-end gap-3">
            <Link href="/admin/studios">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
              <Plus className="w-4 h-4 mr-1.5" /> Certify & Activate Atelier
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
