'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Building,
  Plus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudios = async () => {
    try {
      const res = await fetch('/api/studios?all=true');
      if (res.ok) {
        const data = await res.json();
        setStudios(data.studios || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudios();
  }, []);

  const handleUpdateStatus = async (studioId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/studios/${studioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchStudios();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = studios.filter((s) => {
    const matchesFilter = activeFilter === 'ALL' || s.status === activeFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#E8E2D8] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/dashboard"
              className="p-1.5 rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#1A1816] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Badge variant="outline" size="sm">
              Guild Network
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
            Partner Photo Studios & Darkroom Labs
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
            Certify atelier applications, regulate commissions & audit equipment capacity
          </p>
        </div>

        <Link href="/admin/studios/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" /> + Onboard New Atelier
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border transition-all ${
                activeFilter === status
                  ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#8C827A] border-[#E8E2D8] hover:border-[#1A1816] hover:text-[#1A1816]'
              }`}
            >
              {status === 'ALL' ? 'All Darkrooms' : status.charAt(0) + status.slice(1).toLowerCase()} ({studios.filter((s) => status === 'ALL' || s.status === status).length})
            </button>
          ))}
        </div>

        <div className="w-full md:w-80">
          <Input
            placeholder="Search atelier, city, proprietor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Studio Cards Grid */}
      {loading ? (
        <div className="p-20 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
          Loading guild directory of darkroom labs...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center max-w-md mx-auto space-y-3 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px]">
          <Badge variant="outline" size="sm">
            Zero Records
          </Badge>
          <p className="font-serif italic text-sm text-[#8C827A]">
            No partner darkroom labs matched the specified query.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <Card
              key={s.id}
              className="p-6 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px] shadow-sm hover:border-[#1A1816] transition-all space-y-5 relative"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-[#E8E2D8] pb-3.5">
                <div>
                  <h3 className="font-serif text-lg font-normal text-[#1A1816] leading-snug">
                    {s.name}
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#8C827A] mt-0.5">Proprietor: {s.ownerName}</p>
                </div>

                <Badge
                  variant={
                    s.status === 'ACTIVE'
                      ? 'success'
                      : s.status === 'PENDING'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {s.status}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2 text-[#3D3A36]">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#8C827A]" />
                  <span className="font-serif">
                    {s.address}, <strong className="text-[#1A1816] font-medium">{s.city}</strong> — {s.pincode}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[11px] text-[#8C827A]">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-[#8C827A]" />
                  <span>{s.phone}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[#E8E2D8]">
                  <div className="p-3 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8]">
                    <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">
                      Platform Cut
                    </span>
                    <span className="font-serif text-base font-medium text-[#1A1816]">
                      {s.commissionRate}%
                    </span>
                  </div>

                  <div className="p-3 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8]">
                    <span className="font-mono text-[9px] text-[#8C827A] uppercase tracking-[0.15em] block">
                      Fulfillments
                    </span>
                    <span className="font-serif text-base font-medium text-[#1A1816]">
                      {s._count?.orders || 0} commissions
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E8E2D8] flex flex-wrap items-center justify-between gap-2.5">
                <Link href={`/admin/studios/${s.id}`} className="flex-1">
                  <Button variant="outline" size="sm" fullWidth>
                    Inspect & Settle
                  </Button>
                </Link>

                {s.status === 'PENDING' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus(s.id, 'ACTIVE')}
                  >
                    Certify Atelier
                  </Button>
                ) : s.status === 'ACTIVE' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUpdateStatus(s.id, 'INACTIVE')}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus(s.id, 'ACTIVE')}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
