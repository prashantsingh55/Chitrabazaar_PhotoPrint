'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/utils';
import {
  Building,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Phone,
  Save,
  FileSpreadsheet,
} from 'lucide-react';

export default function AdminStudioInspectorPage() {
  const params = useParams();
  const studioId = params?.id as string;

  const [studio, setStudio] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [settlingPayoutId, setSettlingPayoutId] = useState<string | null>(null);

  // Form State
  const [status, setStatus] = useState('ACTIVE');
  const [commissionRate, setCommissionRate] = useState('15.0');

  const fetchDetails = async () => {
    try {
      const sRes = await fetch(`/api/studios/${studioId}`);
      if (sRes.ok) {
        const data = await sRes.json();
        setStudio(data.studio);
        setStatus(data.studio.status);
        setCommissionRate(data.studio.commissionRate.toString());
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
    fetchDetails();
  }, [studioId]);

  const handleUpdateStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/studios/${studioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          commissionRate: parseFloat(commissionRate),
        }),
      });

      if (res.ok) {
        fetchDetails();
        alert('Studio settings updated successfully!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSettlePayout = async (payoutId: string) => {
    setSettlingPayoutId(payoutId);
    try {
      const res = await fetch('/api/payouts/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId,
          transactionRef: `BANK-SETTLE-${Date.now()}`,
          notes: 'Settled by Chitrabazaar HQ finance desk',
        }),
      });

      if (res.ok) {
        fetchDetails();
      } else {
        alert('Failed to settle payout');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSettlingPayoutId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
        Retrieving atelier accreditation dossier...
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <Card className="p-8 space-y-4 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px]">
          <Badge variant="danger" size="sm">
            Unrecorded
          </Badge>
          <p className="font-serif italic text-sm text-[#8C827A]">Partner studio record not found in guild registry.</p>
          <div className="pt-2">
            <Link href="/admin/studios">
              <Button variant="primary" size="md">
                Return to Directory
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E8E2D8] pb-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/studios"
            className="p-1.5 rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#1A1816] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Badge variant="outline" size="sm">
            Atelier Dossier
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
          {studio.name}
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
          Proprietor: {studio.ownerName} • {studio.email} • {studio.phone}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Admin Controls */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-7 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-5">
            <h3 className="font-serif text-lg font-normal text-[#1A1816] border-b border-[#E8E2D8] pb-3">
              Guild Accreditation & Tariff Controls
            </h3>

            <form onSubmit={handleUpdateStudio} className="space-y-5">
              <Select
                label="Certification Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE (Accepting Physical Commissions)</option>
                <option value="PENDING">PENDING AUDIT (Awaiting Curatorial Inspection)</option>
                <option value="INACTIVE">INACTIVE (Capacity Suspended)</option>
              </Select>

              <Input
                label="Platform Tariff Cut (%)"
                type="number"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />

              <Button type="submit" variant="primary" size="md" fullWidth isLoading={isUpdating}>
                <Save className="w-4 h-4 mr-2" /> Save Accreditation Terms
              </Button>
            </form>
          </Card>

          {/* Location & Services */}
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-3.5 text-xs">
            <h4 className="font-serif text-base font-normal text-[#1A1816] border-b border-[#E8E2D8] pb-2.5">
              Physical Atelier Location & Schedule
            </h4>
            <p className="font-serif text-sm text-[#1A1816]">{studio.address}</p>
            <p className="font-mono text-[11px] text-[#8C827A]">
              {studio.city} — {studio.pincode}
            </p>
            <p className="font-mono text-[11px] text-[#8C827A]">Schedule: {studio.workingHours}</p>
            <div className="pt-3 border-t border-[#E8E2D8]">
              <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">
                Equipment, Finishes & Supported Dimensions
              </span>
              <p className="font-serif text-xs text-[#3D3A36] mt-1">{studio.servicesOffered}</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Payout Ledger & Settlement Desk */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-7 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3.5">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-[#1A1816]" />
                <h3 className="font-serif text-lg font-normal text-[#1A1816]">
                  Disbursement Settlement Desk
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
                {payouts.length} Recorded Cycles
              </span>
            </div>

            {payouts.length === 0 ? (
              <div className="p-12 text-center font-serif italic text-sm text-[#8C827A]">
                No payout batches compiled for this partner atelier yet.
              </div>
            ) : (
              <div className="space-y-4">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] space-y-3.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[#1A1816] font-medium">
                          {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                        </span>
                        <span className="bg-[#F4F0E8] border border-[#E8E2D8] text-[#1A1816] px-2 py-0.5 rounded-[2px] font-mono text-[10px]">
                          {p.orderIds.length} orders
                        </span>
                      </div>

                      <Badge variant={p.status === 'PAID' ? 'success' : 'warning'} size="sm">
                        {p.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">Gross Tariff</span>
                        <span className="font-mono text-[#1A1816]">{formatCurrency(p.grossAmount)}</span>
                      </div>
                      <div>
                        <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">Platform Cut</span>
                        <span className="font-mono text-[#8C827A]">
                          -{formatCurrency(p.commissionAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">Net Due</span>
                        <span className="font-mono font-bold text-sm text-[#1A1816]">
                          {formatCurrency(p.netPayout)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-[#8C827A]">
                        Ref: {p.transactionRef || 'UNSETTLED_BATCH'}
                      </span>

                      {p.status === 'PENDING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={settlingPayoutId === p.id}
                          onClick={() => handleSettlePayout(p.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Disburse & Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
