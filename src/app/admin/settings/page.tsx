'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import {
  ShieldCheck,
  Save,
  Radio,
  Download,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Megaphone,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    default_currency: '$',
    platform_commission: '15',
    default_delivery_fee: '4.99',
    min_order_amount: '5.00',
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings((prev: any) => ({ ...prev, ...(data.settings || {}) }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBroadcasting(true);
    setBroadcastSuccess(null);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBroadcastSuccess(`Broadcast transmitted to ${data.notifiedStudiosCount} active partner darkrooms!`);
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        alert(data.error || 'Failed to broadcast');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-[#E8E2D8] pb-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/dashboard"
            className="p-1.5 rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#1A1816] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Badge variant="outline" size="sm">
            Curatorial Protocol
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
          Marketplace Configuration Desk
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
          Global tariffs, accounting currency units, audit exports & darkroom broadcast telegraph
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Settings Form */}
        <div className="md:col-span-7 space-y-6">
          <Card className="p-7 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-5">
            <h3 className="font-serif text-lg font-normal text-[#1A1816] border-b border-[#E8E2D8] pb-3">
              Fiscal Parameters & Localization
            </h3>

            {saveSuccess && (
              <div className="p-4 rounded-[2px] bg-[#FAF8F5] border border-[#2D4A3E]/40 text-[#2D4A3E] text-xs font-mono flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4" />
                <span>Configuration parameters applied across platform!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <Select
                label="System Currency Symbol"
                value={settings.default_currency}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
              >
                <option value="$">USD ($) — Global Standard</option>
                <option value="₹">INR (₹) — India Subcontinent</option>
                <option value="Rs.">NPR (Rs.) — Nepal Himalayan</option>
                <option value="€">EUR (€) — European Continent</option>
                <option value="£">GBP (£) — United Kingdom</option>
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Baseline Platform Tariff (%)"
                  type="number"
                  step="0.5"
                  value={settings.platform_commission}
                  onChange={(e) => setSettings({ ...settings, platform_commission: e.target.value })}
                />

                <Input
                  label="Courier Delivery Surcharge"
                  type="number"
                  step="0.1"
                  value={settings.default_delivery_fee}
                  onChange={(e) => setSettings({ ...settings, default_delivery_fee: e.target.value })}
                />
              </div>

              <Input
                label="Minimum Order Commission Threshold"
                type="number"
                step="0.5"
                value={settings.min_order_amount}
                onChange={(e) => setSettings({ ...settings, min_order_amount: e.target.value })}
              />

              <div className="pt-3 border-t border-[#E8E2D8]">
                <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-2" /> Save Fiscal Parameters
                </Button>
              </div>
            </form>
          </Card>

          {/* Export Report Card */}
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-3.5">
            <h3 className="font-serif text-base font-normal text-[#1A1816] border-b border-[#E8E2D8] pb-2.5">
              Archival Ledger & Audit Reports
            </h3>
            <p className="font-serif italic text-xs text-[#8C827A] leading-relaxed">
              Compile and download a comprehensive CSV registry containing every completed commission, photographic specification, patron address, and settled darkroom disbursement.
            </p>
            <div className="pt-1">
              <a href="/api/admin/export" download>
                <Button variant="outline" size="sm">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Historical Ledger CSV
                </Button>
              </a>
            </div>
          </Card>
        </div>

        {/* Right Column: Studio Broadcast Center */}
        <div className="md:col-span-5 space-y-6">
          <Card className="p-7 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-[#E8E2D8] pb-3">
              <Megaphone className="w-4 h-4 text-[#1A1816]" />
              <h3 className="font-serif text-lg font-normal text-[#1A1816]">
                Darkroom Telegraph Wire
              </h3>
            </div>

            <p className="font-serif italic text-xs text-[#8C827A] leading-relaxed">
              Transmits an immediate high-priority dispatch notice across all active partner studio dashboards in real time via live SSE telemetry.
            </p>

            {broadcastSuccess && (
              <div className="p-4 rounded-[2px] bg-[#FAF8F5] border border-[#2D4A3E]/40 text-[#2D4A3E] text-xs font-mono flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4" />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <Input
                label="Dispatch Headline"
                required
                placeholder="e.g. Winter Emulsion Curing Protocol"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
              />

              <Textarea
                label="Wire Message Contents"
                required
                placeholder="Compose directive to be telegraphed to all darkroom benches..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                fullWidth
                isLoading={isBroadcasting}
              >
                <Radio className="w-4 h-4 mr-2" /> Telegraph Wire to Guild
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
