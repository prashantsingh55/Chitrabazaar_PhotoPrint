'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDateTime } from '@/lib/utils';
import { Users, Search, ArrowLeft, CheckCircle, Ban } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
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
              Patron Directory
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-[#1A1816] mt-2">
            Registered Patrons & Clients
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A] mt-1">
            Oversee client account access, recorded dispatch addresses & historical commissions
          </p>
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Search patron name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[#8C827A]">
          Compiling patron directory...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center max-w-md mx-auto space-y-3 border border-[#E8E2D8] bg-[#FAF8F5] rounded-[2px]">
          <Badge variant="outline" size="sm">
            Zero Records
          </Badge>
          <p className="font-serif italic text-sm text-[#8C827A]">No patron accounts match the current filter.</p>
        </Card>
      ) : (
        <div className="rounded-[2px] border border-[#E8E2D8] bg-[#FAF8F5] shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F0E8] border-b border-[#E8E2D8] text-[#8C827A] font-mono text-[10px] uppercase tracking-[0.15em] select-none">
              <tr>
                <th className="p-4">Patron Name</th>
                <th className="p-4">Communication Wire</th>
                <th className="p-4">Telephone</th>
                <th className="p-4">Commissions</th>
                <th className="p-4">Recorded Addresses</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Account Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8]">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-[#F4F0E8]/50 transition-colors">
                  <td className="p-4 font-serif text-sm font-medium text-[#1A1816]">
                    {u.name}
                  </td>
                  <td className="p-4 text-[#3D3A36] font-mono text-[11px]">
                    {u.email}
                  </td>
                  <td className="p-4 text-[#8C827A] font-mono text-[11px]">
                    {u.phone || '—'}
                  </td>
                  <td className="p-4 font-mono text-[#1A1816]">
                    {u._count.orders} orders
                  </td>
                  <td className="p-4 text-[#8C827A] font-mono text-[11px]">
                    {u._count.addresses} saved
                  </td>
                  <td className="p-4 text-[11px] font-mono text-[#8C827A]">
                    {formatDateTime(u.createdAt)}
                  </td>
                  <td className="p-4">
                    <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
                      {u.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(u.id, u.isActive)}
                      className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] rounded-[2px] border transition-all ${
                        u.isActive
                          ? 'border-[#E8E2D8] text-[#8C827A] hover:text-[#C05A46] hover:border-[#C05A46]/30 hover:bg-[#FAF0ED]'
                          : 'border-[#2D4A3E]/30 text-[#2D4A3E] bg-[#FAF8F5] hover:bg-[#F4F8F4]'
                      }`}
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
