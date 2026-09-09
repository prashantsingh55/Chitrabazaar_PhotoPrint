'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  Building,
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  ArrowRight,
  Download,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  PLACED: '#B8860B',
  ASSIGNED: '#6B655F',
  PRINTING: '#8C6D23',
  READY: '#2D4A3E',
  COMPLETED: '#1A1816',
  CANCELLED: '#C05A46',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
        Compiling marketplace analytics & darkroom telemetry...
      </div>
    );
  }

  const { metrics, charts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E8E2D8] pb-6">
        <div>
          <Badge variant="outline" size="sm">
            Curatorial Command
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
            Marketplace Analytics & Dispatch Desk
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
            Global volume, partner lab capacity, financial commissions & registry audit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a href="/api/admin/export" download>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Historical CSV
            </Button>
          </a>

          <Link href="/admin/studios/new">
            <Button variant="primary" size="sm">
              + Onboard Atelier Lab
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total GMV */}
        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">
            I. Marketplace GMV
          </span>
          <span className="text-3xl font-serif font-normal text-[#1A1816] block">
            {formatCurrency(metrics.totalGMV)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Cumulative order volume
          </span>
        </Card>

        {/* Platform Commission */}
        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#2D4A3E] block">
            II. Platform Tariff Take
          </span>
          <span className="text-3xl font-serif font-normal text-[#2D4A3E] block">
            {formatCurrency(metrics.totalCommissionCut)}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            Net revenue retained
          </span>
        </Card>

        {/* Active Studios */}
        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">
            III. Accredited Darkrooms
          </span>
          <span className="text-3xl font-serif font-normal text-[#1A1816] block">
            {metrics.activeStudios} Active
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            {metrics.pendingStudios > 0 ? (
              <span className="text-[#B8860B] font-bold">
                {metrics.pendingStudios} Pending Audits
              </span>
            ) : (
              'All labs certified'
            )}
          </span>
        </Card>

        {/* Total Orders */}
        <Card className="p-5 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] block">
            IV. Print Commissions
          </span>
          <span className="text-3xl font-serif font-normal text-[#1A1816] block">
            {metrics.totalOrders}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A]">
            {metrics.completedOrders} fulfilled
          </span>
        </Card>

        {/* Customers */}
        <Card className="p-5 border border-[#1A1816] bg-[#1A1816] text-[#FAF8F5] rounded-[2px] shadow-sm space-y-1.5 col-span-2 lg:col-span-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#FAF8F5]/70 block">
            V. Registered Patrons
          </span>
          <span className="text-3xl font-serif font-normal text-[#FAF8F5] block">
            {metrics.totalCustomers}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#FAF8F5]/60">
            Active client accounts
          </span>
        </Card>
      </div>

      {/* Visual Analytics Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Revenue & Volume Chart */}
        <div className="lg:col-span-8">
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3.5">
              <h3 className="font-serif text-lg font-normal text-[#1A1816]">
                Daily Commission Volume & Gross Tariff
              </h3>
              <Badge variant="outline" size="sm">
                Past 7-Day Cycle
              </Badge>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.dailyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#E8E2D8" />
                  <XAxis dataKey="day" stroke="#8C827A" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <YAxis stroke="#8C827A" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF8F5',
                      border: '1px solid #E8E2D8',
                      borderRadius: '2px',
                      boxShadow: '0 2px 4px 0 rgba(0,0,0,0.05)',
                      fontFamily: 'Newsreader, Georgia, serif',
                      fontSize: '13px',
                      color: '#1A1816',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#1A1816" radius={[1, 1, 0, 0]} name="Gross Revenue ($)" />
                  <Bar dataKey="orders" fill="#C4BCB1" radius={[1, 1, 0, 0]} name="Orders Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Order Status Distribution Pie Chart */}
        <div className="lg:col-span-4">
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-5">
            <div className="border-b border-[#E8E2D8] pb-3.5">
              <h3 className="font-serif text-lg font-normal text-[#1A1816]">
                Pipeline Emulsion Breakdown
              </h3>
            </div>

            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {charts.statusBreakdown.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#8C827A'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF8F5',
                      border: '1px solid #E8E2D8',
                      borderRadius: '2px',
                      boxShadow: '0 2px 4px 0 rgba(0,0,0,0.05)',
                      fontFamily: 'Newsreader, Georgia, serif',
                      fontSize: '13px',
                      color: '#1A1816',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#3D3A36]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Admin Modules Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/studios" className="block group">
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-2.5 hover:border-[#1A1816] transition-all">
            <div className="flex items-center justify-between">
              <span className="font-serif font-medium text-[#1A1816] text-base">Guild Darkrooms</span>
              <Building className="w-4 h-4 text-[#8C827A]" />
            </div>
            <p className="font-serif italic text-xs text-[#8C827A] leading-relaxed">
              Curate partner ateliers, negotiate tariff rates, and audit darkroom capabilities.
            </p>
            <div className="pt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#1A1816] flex items-center gap-1 group-hover:underline">
              Manage Studios →
            </div>
          </Card>
        </Link>

        <Link href="/admin/orders" className="block group">
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-2.5 hover:border-[#1A1816] transition-all">
            <div className="flex items-center justify-between">
              <span className="font-serif font-medium text-[#1A1816] text-base">Global Dispatch</span>
              <Package className="w-4 h-4 text-[#8C827A]" />
            </div>
            <p className="font-serif italic text-xs text-[#8C827A] leading-relaxed">
              Inspect all client commissions, reassign darkrooms dynamically, and monitor press delays.
            </p>
            <div className="pt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#1A1816] flex items-center gap-1 group-hover:underline">
              Inspect Orders →
            </div>
          </Card>
        </Link>

        <Link href="/admin/users" className="block group">
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-2.5 hover:border-[#1A1816] transition-all">
            <div className="flex items-center justify-between">
              <span className="font-serif font-medium text-[#1A1816] text-base">Client Register</span>
              <Users className="w-4 h-4 text-[#8C827A]" />
            </div>
            <p className="font-serif italic text-xs text-[#8C827A] leading-relaxed">
              Browse patron directories, review delivery addresses, and regulate portal access.
            </p>
            <div className="pt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#1A1816] flex items-center gap-1 group-hover:underline">
              Review Directory →
            </div>
          </Card>
        </Link>

        <Link href="/admin/settings" className="block group">
          <Card className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm space-y-2.5 hover:border-[#1A1816] transition-all">
            <div className="flex items-center justify-between">
              <span className="font-serif font-medium text-[#1A1816] text-base">Curatorial Desk</span>
              <ShieldCheck className="w-4 h-4 text-[#8C827A]" />
            </div>
            <p className="font-serif italic text-xs text-[#8C827A] leading-relaxed">
              Define commission algorithms, global currencies, and broadcast wire dispatches to studios.
            </p>
            <div className="pt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#1A1816] flex items-center gap-1 group-hover:underline">
              Configure Policy →
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
