'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Home, Settings, Library } from 'lucide-react';

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 hover:text-blue-700 transition">
            <Sparkles className="w-6 h-6" />
            <span>KQCI 카드</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link
              href="/"
              className={`flex items-center gap-2 text-sm font-medium transition ${
                isActive('/') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4" />
              홈
            </Link>

            <Link
              href="/library"
              className={`flex items-center gap-2 text-sm font-medium transition ${
                isActive('/library') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Library className="w-4 h-4" />
              라이브러리
            </Link>
          </nav>

          {/* User Guide */}
          <button className="p-2 text-slate-600 hover:text-slate-900 transition" title="사용 설명서">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
