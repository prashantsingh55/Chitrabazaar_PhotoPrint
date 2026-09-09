'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
} from '@/lib/utils';
import {
  Package,
  Search,
  ArrowRight,
  ArrowLeftRight,
  Download,
  Building,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Reassignment Modal State
  const [reassignOrder, setReassignOrder] = useState<any | null>(null);
  const [targetStudioId, setTargetStudioId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  const fetchData = async () => {
    try {
      const oRes = await fetch('/api/orders');
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData.orders || []);
      }

      const sRes = await fetch('/api/studios');
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudios(sData.studios || []);
        if (sData.studios?.length > 0) {
          setTargetStudioId(sData.studios[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignOrder || !targetStudioId) return;
    setIsReassigning(true);

    try {
      const res = await fetch(`/api/orders/${reassignOrder.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStudioId: targetStudioId,
          reason: reassignReason,
        }),
      });

      if (res.ok) {
        setReassignOrder(null);
        setReassignReason('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reassign order');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReassigning(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'ALL' || o.status === activeFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.studio?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.studio?.city?.toLowerCase().includes(searchQuery.toLowerCase());
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
              Global Dispatch
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
            Master Commissions Registry
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
            Oversee fulfillment pipelines across darkroom guilds & execute capacity reassignment
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a href="/api/admin/export" download>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Master CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PLACED', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border transition-all ${
                activeFilter === status
                  ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#8C827A] border-[#E8E2D8] hover:border-[#1A1816] hover:text-[#1A1816]'
              }`}
            >
              {status === 'ALL' ? 'All Commissions' : status.charAt(0) + status.slice(1).toLowerCase()} ({orders.filter((o) => status === 'ALL' || o.status === status).length})
            </button>
          ))}
        </div>

        <div className="w-full md:w-80">
          <Input
            placeholder="Search docket #, client, darkroom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="p-20 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
          Compiling platform-wide commission registry...
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center max-w-md mx-auto space-y-3 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px]">
          <Badge variant="outline" size="sm">
            Registry Clean
          </Badge>
          <p className="font-serif italic text-sm text-[#8C827A]">
            No commission records match your filtered criteria.
          </p>
        </Card>
      ) : (
        <div className="rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F0E8] border-b border-[#E8E2D8] text-[#8C827A] font-mono text-[10px] uppercase tracking-[0.15em] select-none">
              <tr>
                <th className="p-4">Docket #</th>
                <th className="p-4">Client</th>
                <th className="p-4">Assigned Atelier</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Atelier Status</th>
                <th className="p-4">Settlement</th>
                <th className="p-4">Logged</th>
                <th className="p-4 text-right">Oversight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusColor(order.status);

                return (
                  <tr key={order.id} className="hover:bg-[#F4F0E8]/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-[#1A1816]">
                      #{order.orderNumber}
                    </td>

                    <td className="p-4">
                      <span className="font-serif text-sm font-medium text-[#1A1816] block">{order.customer?.name}</span>
                      <span className="font-mono text-[10px] text-[#8C827A] block mt-0.5">
                        {order.customer?.email}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-serif text-sm font-medium text-[#1A1816] block">
                        {order.studio?.name || 'Unassigned Lab'}
                      </span>
                      <span className="font-mono text-[10px] text-[#8C827A] block mt-0.5">
                        {order.studio?.city}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-semibold text-[#1A1816]">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-[2px] border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[10px] text-[#2D4A3E] font-medium">
                      {order.paymentStatus}
                    </td>

                    <td className="p-4 font-mono text-[10px] text-[#8C827A]">
                      {formatDateTime(order.createdAt)}
                    </td>

                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReassignOrder(order);
                          setTargetStudioId(
                            studios.find((s) => s.id !== order.studioId)?.id || studios[0]?.id
                          );
                        }}
                        className="px-2.5 py-1.5 bg-[#FAF8F5] text-[#1A1816] border border-[#E8E2D8] hover:border-[#1A1816] rounded-[2px] font-mono text-[10px] uppercase tracking-[0.15em] shadow-xs flex items-center gap-1.5 transition-colors"
                        title="Reassign to a different studio"
                      >
                        <ArrowLeftRight className="w-3 h-3 text-[#8C827A]" /> Reassign
                      </button>

                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          Inspect <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reassignment Modal */}
      <Modal
        isOpen={!!reassignOrder}
        onClose={() => setReassignOrder(null)}
        title="Reassign Commission to Partner Darkroom"
      >
        <form onSubmit={handleExecuteReassign} className="space-y-5">
          <div className="p-4 rounded-[2px] bg-[#F4F0E8] border border-[#E8E2D8] text-xs space-y-1.5 font-mono text-[#3D3A36]">
            <div className="flex justify-between">
              <span className="text-[#8C827A]">Docket Identifier:</span>
              <span className="font-semibold text-[#1A1816]">#{reassignOrder?.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C827A]">Assigned Atelier:</span>
              <span className="font-medium text-[#1A1816]">{reassignOrder?.studio?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8C827A]">Commission Valuation:</span>
              <span className="font-semibold text-[#1A1816]">
                {formatCurrency(reassignOrder?.totalAmount || 0)}
              </span>
            </div>
          </div>

          <Select
            label="Select Receiving Partner Darkroom"
            value={targetStudioId}
            onChange={(e) => setTargetStudioId(e.target.value)}
          >
            {studios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city}) — {s.rating}★
              </option>
            ))}
          </Select>

          <Textarea
            label="Curatorial Reassignment Rationale"
            required
            placeholder="e.g. Current darkroom queue overloaded, emulsion chemistry restocking delay, or client address shift..."
            value={reassignReason}
            onChange={(e) => setReassignReason(e.target.value)}
          />

          <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setReassignOrder(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isReassigning}>
              Confirm Reassignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
