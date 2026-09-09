import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-[#1A1816] text-[#FAF8F5]/80 border-t border-[#3D3A36] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Colophon Top Banner */}
        <div className="pb-12 border-b border-[#3D3A36]/80 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8C827A] block mb-2">
              The Photographic Journal & Marketplace
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#FAF8F5] tracking-tight">
              Chitrabazaar
            </h3>
          </div>
          <p className="font-serif italic text-base text-[#FAF8F5]/70 max-w-md leading-relaxed">
            &ldquo;Photographs are not merely digital pixels on glowing glass; they are physical artifacts of light, silver, and paper.&rdquo;
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12 border-b border-[#3D3A36]/80">
          {/* Col 1: Atelier Philosophy */}
          <div className="space-y-4 md:col-span-2">
            <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF8F5]">
              Atelier & Guild Standards
            </h4>
            <p className="text-xs text-[#FAF8F5]/60 max-w-md leading-relaxed font-sans">
              Chitrabazaar connects photographers and collectors directly with certified regional darkrooms and master printmakers. Every commission uses genuine 260+ GSM archival luster, matte, or fine-art rag papers, calibrated chemical darkroom or pigment presses, and acid-free protective archival sleeves.
            </p>
            <div className="inline-flex items-center gap-2 border border-[#3D3A36] rounded-[2px] px-3 py-1 text-[11px] text-[#8C827A] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D4F3E]" />
              <span className="text-[#FAF8F5]/90">Darkroom Network: Active • Kathmandu Valley</span>
            </div>
          </div>

          {/* Col 2: Customer Desk */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF8F5]">
              Department of Prints
            </h4>
            <ul className="space-y-2 text-xs font-mono text-[#FAF8F5]/60">
              <li>
                <Link href="/upload" className="hover:text-[#FAF8F5] transition-colors">
                  Submit Print Commission
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-[#FAF8F5] transition-colors">
                  Track Order Chronicle
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#FAF8F5] transition-colors">
                  Archival Folio & Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Studio & Platform */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#FAF8F5]">
              Guild & Darkrooms
            </h4>
            <ul className="space-y-2 text-xs font-mono text-[#FAF8F5]/60">
              <li>
                <Link href="/studio/login" className="hover:text-[#FAF8F5] transition-colors">
                  Studio Darkroom Log
                </Link>
              </li>
              <li>
                <Link href="/register?type=studio" className="hover:text-[#FAF8F5] transition-colors">
                  Darkroom Certification Application
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#FAF8F5] transition-colors">
                  Curator Editorial Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-[#8C827A] uppercase tracking-[0.15em]">
          <div>
            © {new Date().getFullYear()} Chitrabazaar Press & Guild. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Typeset in Newsreader & Inter</span>
            <span>•</span>
            <span>Printed on Archival Rag</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

