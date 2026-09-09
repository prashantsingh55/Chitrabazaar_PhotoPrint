'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const recipientId =
    session?.user?.role === 'STUDIO_ADMIN' && session?.user?.studioId
      ? session.user.studioId
      : session?.user?.role === 'SUPER_ADMIN'
      ? 'ALL_ADMINS'
      : session?.user?.id;

  // Web Audio synthetic notification chime
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const fetchNotifications = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // 1. Initial fetch & 4-second Polling Fallback
  useEffect(() => {
    if (!session?.user) return;
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [session?.user]);

  // 2. Server-Sent Events (SSE) stream listener
  useEffect(() => {
    if (!recipientId) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/notifications/stream?recipientId=${recipientId}`);

      eventSource.addEventListener('notification', (event) => {
        try {
          const newNotif = JSON.parse(event.data) as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          setHasNewAlert(true);
          playChime();
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      });
    } catch (err) {
      console.error('SSE connection error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [recipientId]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  if (!session?.user) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewAlert(false);
        }}
        className="relative p-2 rounded-[2px] text-[#6B665F] hover:text-[#1A1816] hover:bg-[#F4F0E8] border border-[#E8E2D8] bg-[#FAF8F5] transition-colors"
        title="Dispatches"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#1A1816] text-[#FAF8F5] text-[9px] font-mono w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FAF8F5] border border-[#E8E2D8] rounded-[2px] shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#F4F0E8]/70 border-b border-[#E8E2D8]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C827A]">
                Dispatch Wire {unreadCount > 0 && `(${unreadCount} new)`}
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] font-mono text-[#6B665F] hover:text-[#1A1816] transition-colors uppercase tracking-wider"
              >
                <CheckCheck className="w-3 h-3" />
                Acknowledge All
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E8E2D8]/70">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs font-serif italic text-[#8C827A]">
                No dispatch notices on the wire
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors ${
                    n.isRead ? 'bg-[#FAF8F5]' : 'bg-[#F4F0E8]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className={`font-serif text-sm leading-snug ${n.isRead ? 'text-[#3D3A36]' : 'text-[#1A1816] font-medium'}`}>
                      {n.title}
                    </h5>
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-[#8C827A] hover:text-[#1A1816] p-0.5 shrink-0 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#6B665F] mt-1 leading-relaxed font-sans">{n.message}</p>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="text-[10px] font-mono text-[#8C827A] uppercase tracking-wider">
                      {formatDateTime(n.createdAt)}
                    </span>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => {
                          markAsRead(n.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[#1A1816] hover:underline"
                      >
                        Docket <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

