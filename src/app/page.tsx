'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DemoLoginBar } from '@/components/DemoLoginBar';
import {
  PRINT_SIZE_LABELS,
  PRINT_SIZE_PRICES,
  PAPER_TYPE_SURCHARGES,
  formatCurrency,
} from '@/lib/utils';
import {
  Sparkles,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building,
  Shield,
  Layers,
  Scroll,
  UploadCloud,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const estimatorFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingEstimator, setIsUploadingEstimator] = useState(false);

  // Interactive pricing calculator state
  const [calcSize, setCalcSize] = useState('SIZE_4X6');
  const [calcPaper, setCalcPaper] = useState('GLOSSY');
  const [calcQty, setCalcQty] = useState(12);

  // Keep estimator preferences saved to localStorage whenever user adjusts them
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'chitrabazaar_estimator_prefs',
          JSON.stringify({ size: calcSize, paper: calcPaper, qty: calcQty })
        );
      } catch (e) {
        console.error(e);
      }
    }
  }, [calcSize, calcPaper, calcQty]);

  const handleProceedToUpload = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'chitrabazaar_estimator_prefs',
        JSON.stringify({ size: calcSize, paper: calcPaper, qty: calcQty })
      );
    }
    router.push(`/upload?size=${calcSize}&paper=${calcPaper}&qty=${calcQty}`);
  };

  const handleEstimatorFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingEstimator(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.files) {
        const newItems = data.files.map((f: { url: string; filename: string }) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: f.url,
          filename: f.filename,
          size: calcSize,
          paperType: calcPaper,
          finish: 'BORDERLESS',
          quantity: calcQty,
          rotation: 0,
          aspect: 'original',
        }));

        if (typeof window !== 'undefined') {
          const existing = localStorage.getItem('chitrabazaar_cart_items');
          const existingItems = existing ? JSON.parse(existing) : [];
          localStorage.setItem(
            'chitrabazaar_cart_items',
            JSON.stringify([...existingItems, ...newItems])
          );
          localStorage.setItem(
            'chitrabazaar_estimator_prefs',
            JSON.stringify({ size: calcSize, paper: calcPaper, qty: calcQty })
          );
        }

        router.push(`/upload?size=${calcSize}&paper=${calcPaper}&qty=${calcQty}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingEstimator(false);
    }
  };

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const unitPrice = (PRINT_SIZE_PRICES[calcSize] || 1.2) + (PAPER_TYPE_SURCHARGES[calcPaper] || 0);
  const totalEstimate = unitPrice * calcQty;

  const faqs = [
    {
      q: 'Does Chitrabazaar operate centralized printing presses?',
      a: 'No. Chitrabazaar is an online marketplace and curatorial registry that connects photographers, collectors, and families directly with independent, certified regional photo laboratories and master darkrooms. Your commission is fulfilled locally on professional equipment and calibrated paper stocks.',
    },
    {
      q: 'What paper stocks and chemistry are standard for prints?',
      a: 'Every partner atelier in the Chitrabazaar network uses archival-grade photographic media — including Kodak Royal, Fujifilm Crystal Archive, and Canon Pro Luster rag papers (260–310 GSM). No thin office inkjet bond papers are ever utilized.',
    },
    {
      q: 'Can prints be collected in person from the darkroom atelier?',
      a: 'Yes. Upon checkout, you may designate "Studio Counter Pickup." Once the darkroom master finishes exposure, chemical fixing, and acid-free sleeving, your package is held at the atelier counter with zero delivery surcharge.',
    },
    {
      q: 'How are print technicians alerted when a commission is logged?',
      a: 'The moment payment or cash-on-delivery is authorized, our real-time notification wire immediately sounds an alert in the assigned studio’s darkroom console, dispatching high-resolution asset links and technical specifications into their print queue.',
    },
  ];

  return (
    <div className="w-full bg-[#FAF8F5] text-[#1A1816]">
      {/* Dev Mode Demo Login Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <DemoLoginBar />
      </div>

      {/* Cover Story Hero Section */}
      <section className="relative pt-6 pb-20 sm:pt-12 sm:pb-28 border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Magazine Cover Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-10 border-b border-[#1A1816]">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8C827A]">
              Issue N° 04 • Curated Print Guild
            </div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8C827A]">
              Kathmandu Valley & Regional Darkrooms
            </div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8C827A]">
              Standard 260+ GSM
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Col: Editorial Headline & Essay */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2D4F3E]" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#2D4F3E]">
                  Certified Atelier Network
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#1A1816] leading-[1.02]">
                Turning digital light into physical <span className="italic font-normal">artifact.</span>
              </h1>

              <div className="pt-2">
                <p className="font-serif italic text-lg sm:text-xl text-[#3D3A36] leading-relaxed max-w-xl border-l-2 border-[#1A1816] pl-4">
                  &ldquo;Photographs trapped on glowing glass screens fade into digital obscurity. We connect your camera roll directly with certified darkrooms for authentic silver halide and archival pigment printing.&rdquo;
                </p>
              </div>

              <p className="text-sm text-[#6B665F] leading-relaxed max-w-xl font-sans">
                Upload photographs from your phone, laptop, or archive. Choose custom sizes, paper finishes, and border matting. Prepared with museum-grade care and ready for studio counter pickup or doorstep delivery.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link href="/upload">
                  <Button variant="primary" size="lg">
                    Order Prints <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>

                <Link href="/orders">
                  <Button variant="secondary" size="lg">
                    Track Dispatch Chronicle
                  </Button>
                </Link>
              </div>

              {/* Publication Ledger Stats */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-[#E8E2D8] max-w-lg">
                <div>
                  <span className="block font-serif text-3xl sm:text-4xl text-[#1A1816]">50+</span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8C827A] mt-1 block">
                    Guild Darkrooms
                  </span>
                </div>
                <div>
                  <span className="block font-serif text-3xl sm:text-4xl text-[#1A1816]">&lt;24h</span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8C827A] mt-1 block">
                    Standard Pressing
                  </span>
                </div>
                <div>
                  <span className="block font-serif text-3xl sm:text-4xl text-[#1A1816]">100%</span>
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8C827A] mt-1 block">
                    Archival Stock
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Curated Photographic Plate */}
            <div className="lg:col-span-5">
              <div className="bg-[#FAF8F5] border border-[#E8E2D8] p-5 sm:p-7 shadow-xl rounded-[2px]">
                {/* Photographic Plate Framing */}
                <div className="border border-[#E8E2D8] p-4 bg-white/60 mb-4">
                  <div className="aspect-[4/5] overflow-hidden relative border border-[#E8E2D8]/80 bg-[#F4F0E8]">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=900&auto=format&fit=crop&q=80"
                      alt="Plate I. Portrait Study"
                      className="w-full h-full object-cover grayscale contrast-105 filter hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute bottom-2 right-2 bg-[#1A1816]/90 text-[#FAF8F5] text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-1">
                      Plate 01 • Luster 4"×6"
                    </div>
                  </div>
                </div>

                {/* Plate Caption & Colophon */}
                <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] text-[#8C827A]">
                    <span>Plate Docket #CB-84920</span>
                    <span className="text-[#2D4F3E] font-semibold">Archival Proof Passed</span>
                  </div>
                  <h4 className="font-serif text-base font-normal text-[#1A1816]">
                    Portrait Study in Directional Light
                  </h4>
                  <p className="text-xs text-[#6B665F] font-sans leading-relaxed">
                    Exemplary silver-halide exposure executed by Apex Darkroom Atelier. Calibrated 260 GSM Fuji Crystal Archive paper with natural white tone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Ticker / Guild Guarantees */}
      <section className="border-b border-[#E8E2D8] bg-[#F4F0E8]/70 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-[#8C827A] pt-0.5">01</span>
              <div>
                <p className="font-serif text-sm font-medium text-[#1A1816]">Zero Hardware Overhead</p>
                <p className="text-xs text-[#6B665F]">Direct client-to-darkroom routing</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-[#8C827A] pt-0.5">02</span>
              <div>
                <p className="font-serif text-sm font-medium text-[#1A1816]">Archival Chemistry</p>
                <p className="text-xs text-[#6B665F]">Fuji & Kodak 260 GSM papers</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-[#8C827A] pt-0.5">03</span>
              <div>
                <p className="font-serif text-sm font-medium text-[#1A1816]">Certified Ateliers</p>
                <p className="text-xs text-[#6B665F]">Color-calibrated production presses</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-[#8C827A] pt-0.5">04</span>
              <div>
                <p className="font-serif text-sm font-medium text-[#1A1816]">Curated Delivery</p>
                <p className="text-xs text-[#6B665F]">Atelier pickup or acid-free ship</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Printmaker's Atelier (3-Step Process) */}
      <section className="py-24 border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A]">
              Methodology & Craft
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#1A1816] tracking-tight">
              The Three Stages of Printmaking
            </h2>
            <p className="font-serif italic text-base text-[#6B665F]">
              From digital capture to lasting physical folio in three deliberate steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stage I */}
            <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-8 rounded-[2px] relative group hover:border-[#1A1816] transition-colors">
              <div className="font-mono text-xs text-[#8C827A] mb-4 pb-2 border-b border-[#E8E2D8] flex items-center justify-between">
                <span>STAGE I</span>
                <span>CURATION</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#1A1816] mb-3">
                Digital Upload & Specification
              </h3>
              <p className="text-xs text-[#6B665F] leading-relaxed mb-6 font-sans">
                Transmit your photographs in original fidelity. Select custom dimensions (from classic 4×6 pocket prints to exhibition A4 and gallery posters), paper finishes, and border margins.
              </p>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] pt-4 border-t border-[#E8E2D8]">
                RAW, JPG, PNG & WEBP Supported
              </div>
            </div>

            {/* Stage II */}
            <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-8 rounded-[2px] relative group hover:border-[#1A1816] transition-colors">
              <div className="font-mono text-xs text-[#8C827A] mb-4 pb-2 border-b border-[#E8E2D8] flex items-center justify-between">
                <span>STAGE II</span>
                <span>PRESSING</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#1A1816] mb-3">
                Darkroom Exposure & Inspection
              </h3>
              <p className="text-xs text-[#6B665F] leading-relaxed mb-6 font-sans">
                Your commission is assigned to an accredited regional atelier. Certified technicians review tonal range, expose onto genuine photographic stock, and dry-mount with precision.
              </p>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] pt-4 border-t border-[#E8E2D8]">
                Instant Production Docket Alert
              </div>
            </div>

            {/* Stage III */}
            <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-8 rounded-[2px] relative group hover:border-[#1A1816] transition-colors">
              <div className="font-mono text-xs text-[#8C827A] mb-4 pb-2 border-b border-[#E8E2D8] flex items-center justify-between">
                <span>STAGE III</span>
                <span>DISPATCH</span>
              </div>
              <h3 className="font-serif text-xl font-medium text-[#1A1816] mb-3">
                Archival Sleeving & Retrieval
              </h3>
              <p className="text-xs text-[#6B665F] leading-relaxed mb-6 font-sans">
                Finished prints are enclosed in acid-free glassine sleeves. Follow the chronological timeline in real time, then collect from the atelier counter or receive via courier.
              </p>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] pt-4 border-t border-[#E8E2D8]">
                Live Dispatch Chronicle
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pricing Calculator & Darkroom Spec Sheet */}
      <section className="py-24 bg-[#F4F0E8]/50 border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Spec Sheet Calculator */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-1">
                  Atelier Tariff Schedule
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816]">
                  Print Commission Estimator
                </h2>
                <p className="text-xs text-[#6B665F] mt-2 font-sans">
                  Calculate your custom print run with transparent per-unit studio rates:
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E8E2D8] p-6 sm:p-8 rounded-[2px] shadow-sm space-y-6">
                {/* Print Size Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#6B665F]">
                      1. Dimensions & Proportions
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(PRINT_SIZE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setCalcSize(key)}
                        className={`p-2.5 text-left border rounded-[2px] transition-all ${
                          calcSize === key
                            ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816]'
                            : 'bg-white/80 text-[#1A1816] border-[#E8E2D8] hover:border-[#1A1816]'
                        }`}
                      >
                        <span className="block text-xs font-serif">{label.split('(')[0]}</span>
                        <span className={`block text-[10px] font-mono ${calcSize === key ? 'text-[#FAF8F5]/70' : 'text-[#8C827A]'}`}>
                          {formatCurrency(PRINT_SIZE_PRICES[key] || 1.2)}/ea
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Type Selector */}
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#6B665F] block mb-2">
                    2. Surface & Emulsion Finish
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'GLOSSY', label: 'High Gloss' },
                      { key: 'MATTE', label: 'Velvet Matte' },
                      { key: 'LUSTRE', label: 'Crystal Luster' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setCalcPaper(p.key)}
                        className={`p-2.5 text-center border rounded-[2px] transition-all ${
                          calcPaper === p.key
                            ? 'bg-[#1A1816] text-[#FAF8F5] border-[#1A1816]'
                            : 'bg-white/80 text-[#1A1816] border-[#E8E2D8] hover:border-[#1A1816]'
                        }`}
                      >
                        <span className="block text-xs font-serif">{p.label}</span>
                        <span className={`block text-[10px] font-mono ${calcPaper === p.key ? 'text-[#FAF8F5]/70' : 'text-[#8C827A]'}`}>
                          {PAPER_TYPE_SURCHARGES[p.key] > 0 ? `+${formatCurrency(PAPER_TYPE_SURCHARGES[p.key])}` : 'Standard'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#6B665F]">
                      3. Edition Quantity
                    </label>
                    <span className="text-sm font-mono text-[#1A1816] font-semibold">
                      {calcQty} Prints
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={calcQty}
                    onChange={(e) => setCalcQty(parseInt(e.target.value))}
                    className="w-full h-1 bg-[#E8E2D8] appearance-none cursor-pointer accent-[#1A1816]"
                  />
                </div>

                {/* Estimated Total Display & Commission Actions */}
                <div className="border-t border-[#E8E2D8] pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8C827A] block">
                      Estimated Production Tariff ({calcQty} × {formatCurrency(unitPrice)})
                    </span>
                    <span className="font-serif text-3xl font-medium text-[#1A1816]">
                      {formatCurrency(totalEstimate)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="md"
                      type="button"
                      isLoading={isUploadingEstimator}
                      onClick={() => estimatorFileInputRef.current?.click()}
                      title="Upload photos directly with these exact dimensions, paper stock, and copies"
                    >
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                      Upload Photos for this Spec
                    </Button>

                    <Button
                      variant="primary"
                      size="md"
                      type="button"
                      onClick={handleProceedToUpload}
                    >
                      Commission Batch <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>

                    <input
                      ref={estimatorFileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/heic,image/tiff"
                      className="hidden"
                      onChange={(e) => handleEstimatorFileUpload(e.target.files)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Guild Lab Directory Showcase */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-1">
                  Atelier Registry
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816]">
                  The Darkroom Directory
                </h3>
                <p className="text-xs text-[#6B665F] mt-2 font-sans">
                  Selected regional ateliers currently accepting archival print commissions:
                </p>
              </div>

              <div className="border border-[#E8E2D8] bg-[#FAF8F5] p-6 rounded-[2px] space-y-4">
                <div className="divide-y divide-[#E8E2D8]">
                  {/* Atelier 1 */}
                  <div className="py-3.5 first:pt-0 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-serif text-base text-[#1A1816]">
                        Apex Darkroom & Color Atelier
                      </h4>
                      <p className="text-xs text-[#6B665F] font-sans flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#8C827A]" /> Durbar Marg, Kathmandu • 4.9★ (420+ prints)
                      </p>
                    </div>
                    <Badge variant="success" size="sm">Accepting Commissions</Badge>
                  </div>

                  {/* Atelier 2 */}
                  <div className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-serif text-base text-[#1A1816]">
                        Prism Silver Halide Press
                      </h4>
                      <p className="text-xs text-[#6B665F] font-sans flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#8C827A]" /> Jhamsikhel, Lalitpur • 4.8★ (310+ prints)
                      </p>
                    </div>
                    <Badge variant="success" size="sm">Accepting Commissions</Badge>
                  </div>

                  {/* Atelier 3 */}
                  <div className="py-3.5 last:pb-0 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-serif text-base text-[#1A1816]">
                        Himalayan Fine-Art Photo Lab
                      </h4>
                      <p className="text-xs text-[#6B665F] font-sans flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#8C827A]" /> Lakeside, Pokhara
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">Annual Audit</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between text-xs font-mono text-[#6B665F]">
                  <span>Operate a certified darkroom or photo studio?</span>
                  <Link href="/register?type=studio" className="text-[#1A1816] font-semibold underline">
                    Guild Registration →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical FAQ / Atelier Queries */}
      <section className="py-24 border-b border-[#E8E2D8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A]">
              Colophon & Queries
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1A1816]">
              Frequently Consulted Questions
            </h2>
          </div>

          <div className="border border-[#E8E2D8] divide-y divide-[#E8E2D8] bg-[#FAF8F5] rounded-[2px]">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left font-serif text-base text-[#1A1816] flex items-center justify-between gap-4 hover:bg-[#F4F0E8]/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-[#8C827A]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-[#8C827A]" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs text-[#6B665F] leading-relaxed font-sans border-t border-[#E8E2D8]/50 bg-[#F4F0E8]/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Back Cover / Final Call to Commission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="border border-[#1A1816] bg-[#1A1816] text-[#FAF8F5] p-10 sm:p-16 text-center space-y-6 rounded-[2px]">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block">
            Begin Your Archival Folio
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight max-w-2xl mx-auto leading-tight">
            Commit your memories to ink, paper, and physical time.
          </h2>
          <p className="font-serif italic text-base text-[#FAF8F5]/70 max-w-xl mx-auto leading-relaxed">
            Transmit photographs directly from your phone camera roll or studio workstation.
          </p>
          <div className="pt-2">
            <Link href="/upload">
              <Button variant="secondary" size="lg" className="bg-[#FAF8F5] text-[#1A1816] hover:bg-white border-0">
                Order Prints <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

