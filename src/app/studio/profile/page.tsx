'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/utils';
import {
  Building,
  DollarSign,
  Clock,
  CheckCircle,
  FileSpreadsheet,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
} from 'lucide-react';

export default function StudioProfilePage() {
  const { data: session } = useSession();
  const studioId = session?.user?.studioId;

  const [studio, setStudio] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    workingHours: '',
    servicesOffered: '',
  });

  const fetchStudioAndPayouts = async () => {
    if (!studioId) return;
    try {
      const sRes = await fetch(`/api/studios/${studioId}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudio(sData.studio);
        setFormData({
          name: sData.studio.name || '',
          ownerName: sData.studio.ownerName || '',
          phone: sData.studio.phone || '',
          address: sData.studio.address || '',
          city: sData.studio.city || '',
          pincode: sData.studio.pincode || '',
          workingHours: sData.studio.workingHours || '',
          servicesOffered: sData.studio.servicesOffered || '',
        });
      }

      const pRes = await fetch(`/api/payouts?studioId=${studioId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setPayouts(pData.payouts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioAndPayouts();
  }, [studioId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/studios/${studioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSaveSuccess(true);
        fetchStudioAndPayouts();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to update studio profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate audit totals from Payout model
  const totalSettledPaid = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((acc, p) => acc + p.netPayout, 0);

  const totalPendingOwed = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((acc, p) => acc + p.netPayout, 0);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
        Retrieving financial audit ledger & atelier credentials...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Top Header */}
      <div className="border-b border-[#E8E2D8] pb-6">
        <Badge variant="outline" size="sm">
          Atelier Ledger & Accreditation
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
          {studio?.name || 'Studio Management'}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
          Dedicated Payout Audit Ledger & Darkroom Equipment Specifications
        </p>
      </div>

      {/* Payout Ledger Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            <span>I. Pending Disbursement</span>
            <Clock className="w-4 h-4 text-[#B8860B]" />
          </div>
          <span className="text-3xl font-serif font-normal text-[#1A1816] block">
            {formatCurrency(totalPendingOwed)}
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Awaiting bi-weekly bank transfer
          </p>
        </Card>

        <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            <span>II. Total Settled Revenue</span>
            <CheckCircle className="w-4 h-4 text-[#2D4A3E]" />
          </div>
          <span className="text-3xl font-serif font-normal text-[#2D4A3E] block">
            {formatCurrency(totalSettledPaid)}
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Directly disbursed to atelier
          </p>
        </Card>

        <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            <span>III. Platform Tariff Agreement</span>
            <ShieldCheck className="w-4 h-4 text-[#1A1816]" />
          </div>
          <span className="text-3xl font-serif font-normal text-[#1A1816] block">
            {studio?.commissionRate || 15.0}%
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Certified Partner Darkroom Tier
          </p>
        </Card>
      </div>

      {/* Dedicated Payout Model Audit Ledger Table */}
      <Card className="p-7 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-[#1A1816]" />
            <h2 className="font-serif text-xl font-normal text-[#1A1816]">
              Settlement Ledger & Audit Trail
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            {payouts.length} Batches Recorded
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center font-serif italic text-sm text-[#8C827A]">
            No settlement batches compiled yet. Completed darkroom orders are aggregated on the 1st and 15th of each month.
          </div>
        ) : (
          <div className="rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F0E8] border-b border-[#E8E2D8] font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
                <tr>
                  <th className="p-4">Settlement Period</th>
                  <th className="p-4">Batched Orders</th>
                  <th className="p-4">Gross Revenue</th>
                  <th className="p-4">Platform Tariff</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Transaction Ref</th>
                  <th className="p-4">Settled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8]">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F4F0E8]/50 transition-colors">
                    <td className="p-4 font-mono text-[#3D3A36]">
                      {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                    </td>
                    <td className="p-4 font-serif text-sm font-medium text-[#1A1816]">
                      {p.orderIds.length} orders
                    </td>
                    <td className="p-4 font-mono text-[#1A1816]">
                      {formatCurrency(p.grossAmount)}
                    </td>
                    <td className="p-4 font-mono text-[#8C827A]">
                      -{formatCurrency(p.commissionAmount)}
                    </td>
                    <td className="p-4 font-mono font-bold text-[#1A1816]">
                      {formatCurrency(p.netPayout)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] rounded-[2px] border ${
                          p.status === 'PAID'
                            ? 'bg-[#FAF8F5] text-[#2D4A3E] border-[#2D4A3E]/30'
                            : 'bg-[#FAF3E8] text-[#B8860B] border-[#B8860B]/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-[#8C827A]">
                      {p.transactionRef || 'PENDING_BATCH'}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-[#8C827A]">
                      {p.paidAt ? formatDateTime(p.paidAt) : 'Pending Settlement'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Studio Profile Form */}
      <Card className="p-7 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-6">
        <div className="border-b border-[#E8E2D8] pb-4">
          <h2 className="font-serif text-xl font-normal text-[#1A1816]">
            Atelier Public Profile & Darkroom Equipment
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
            Grounded in local directories and displayed during checkout for counter handovers
          </p>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-[2px] bg-[#FAF8F5] border border-[#2D4A3E]/40 text-[#2D4A3E] text-xs font-mono flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4" />
            <span>Studio profile & darkroom settings updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Atelier Business Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Proprietor / Master Printer"
              required
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Official Telephone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Operating Schedule"
              placeholder="e.g. 9:00 AM - 8:30 PM (Mon-Sat)"
              value={formData.workingHours}
              onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
            />
          </div>

          <Textarea
            label="Street Address / Atelier Building"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-5">
            <Input
              label="City"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Postal Index / PIN"
              required
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            />
          </div>

          <Input
            label="Accredited Print Formats & Finishes"
            placeholder="e.g. Carte-de-Visite, Cabinet Print, Gallery Portrait, Exhibition Folio; Lustre, Matte, Glossy"
            value={formData.servicesOffered}
            onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
          />

          <div className="pt-3 border-t border-[#E8E2D8]">
            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" /> Save Atelier Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
