'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Share2, 
  Compass, 
  Layout, 
  MapPin, 
  Heart, 
  Sparkles,
  Target,
  Home
} from 'lucide-react';
import html2canvas from 'html2canvas';
import Link from 'next/link';
import { Header } from '@/components/header';

const cards = [
  {
    id: 1,
    category: "FIELD REPORT",
    title: "5년 동안 꿈 이루는 프로세스\n필리핀 현지 가동 리얼 후기",
    subtitle: "솔직히 말씀드리면, 처음에는 될까 싶었습니다.\n사람을 바꾼다는 게 얼마나 어려운지 알기에.",
    footer: "품성독서 리더십 시리즈 #01",
    icon: <Target className="w-12 h-12 text-amber-400 mb-6" />,
    gradient: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #020617 100%)",
    accent: "border-amber-500/50"
  },
  {
    id: 2,
    category: "THE PROBLEM",
    title: "강연 한 번으로\n사람은 바뀌지 않습니다",
    content: [
      {
        step: "01. 일시적인 타오름",
        desc: "열정 페이로 몰아붙여도 한 달이면 꺼집니다. 저도 수없이 실패했습니다.",
        icon: <Compass className="w-6 h-6 text-cyan-400" />
      },
      {
        step: "02. 실패의 기록",
        desc: "독서 모임, 멘토링, 챌린지... 다 일시적이었습니다. 무엇이 진짜 필요한지 고민했습니다.",
        icon: <Layout className="w-6 h-6 text-emerald-400" />
      }
    ],
    footer: "변화는 순간의 감동이 아니라 지속되는 시스템에서 옵니다.",
    gradient: "radial-gradient(circle at 50% 50%, #064e3b 0%, #020617 100%)",
    accent: "border-emerald-500/50"
  },
  {
    id: 3,
    category: "THE SYSTEM",
    title: "매일 쌓이는 구조와\n누구나 따라오는 설계도",
    content: [
      {
        step: "03. 품성다이어리 5년",
        desc: "한 번의 감동이 아니라 매일 쌓이는 구조. 시스템으로 학교에 들어갈 수 있어야 했습니다.",
        icon: <MapPin className="w-6 h-6 text-blue-400" />
      },
      {
        step: "04. KQCI 생각독서",
        desc: "개인의 재능이 아니라 누구나 따라올 수 있는 설계도. 이제 아이들의 생각이 자라납니다.",
        icon: <Heart className="w-6 h-6 text-rose-400" />
      }
    ],
    footer: "시스템이 안착되면 사람이 스스로 움직이기 시작합니다.",
    gradient: "radial-gradient(circle at 50% 50%, #312e81 0%, #020617 100%)",
    accent: "border-blue-500/50"
  },
  {
    id: 4,
    category: "REAL GROWTH",
    title: "스스로 움직이는\n현지 리더십의 탄생",
    content: [
      {
        step: "05. 제자가 스승이 되다",
        desc: "조용히 듣기만 하던 현지 교사가 이제는 직접 강의를 주도합니다. 본인 강의처럼 자연스럽게요.",
        icon: <Sparkles className="w-6 h-6 text-purple-400" />
      }
    ],
    highlight: "그림을 그려주자 그들이 직접 아이디어를 내고 다음 스텝을 설계하기 시작했습니다.",
    footer: "리더십의 완성은 그들이 스스로 꿈꾸게 하는 것입니다.",
    gradient: "radial-gradient(circle at 50% 50%, #4c1d95 0%, #020617 100%)",
    accent: "border-purple-500/50"
  },
  {
    id: 5,
    category: "CONCLUSION",
    title: "5년, 시간을 견디면\n진짜가 나타납니다",
    summary: [
      "빠른 결과는 없습니다 (드라마틱한 변화는 환상)",
      "5년이라는 시간의 힘을 믿으세요",
      "자기 힘으로 움직이는 리더가 탄생합니다",
      "검증된 가장 확실한 리더십 프로세스",
      "진짜 변화를 원한다면, 이 길뿐입니다."
    ],
    cta: "사람을 진짜로 변화시키고 싶다면, 이 프로세스를 강력히 추천합니다.",
    footer: "© 품성독서. All rights reserved.",
    gradient: "radial-gradient(circle at 50% 50%, #111827 0%, #020617 100%)",
    accent: "border-slate-500/50"
  }
];

export default function PatchNotesCardPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % cards.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + cards.length) % cards.length);

  const downloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#020617',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `motivation-formula-${currentSlide + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const downloadAllSlides = useCallback(async () => {
    if (!cardRef.current || isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      for (let i = 0; i < cards.length; i++) {
        setCurrentSlide(i);
        // Wait for React to re-render the slide
        await new Promise(resolve => setTimeout(resolve, 500));
        const canvas = await html2canvas(cardRef.current!, {
          scale: 2,
          backgroundColor: '#020617',
          useCORS: true
        });
        const link = document.createElement('a');
        link.download = `motivation-formula-${i + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (err) {
      console.error('Bulk download failed:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  }, [isDownloadingAll]);

  const currentCard = cards[currentSlide];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 sm:p-8 font-sans antialiased">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mt-8">
        {/* Top Control Bar */}
        <div className="w-full flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-white font-bold text-xs">품성</span>
            </div>
            <span className="text-slate-200 font-bold tracking-tight">품성독서</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={downloadImage}
              className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95"
              title="현재 슬라이드 저장"
            >
              <Download size={18} />
            </button>
            <button
              onClick={downloadAllSlides}
              disabled={isDownloadingAll}
              className="px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait flex items-center gap-1.5"
              title="전체 슬라이드 저장"
            >
              <Download size={14} />
              {isDownloadingAll ? '저장 중...' : '전체 저장'}
            </button>
            <button className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Card News Area */}
        <div className="relative w-full aspect-square group">
          <div 
            ref={cardRef}
            style={{ background: currentCard.gradient }}
            className={`w-full h-full rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-2xl border-2 ${currentCard.accent} relative overflow-hidden transition-all duration-500`}
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full -mr-24 -mt-24 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blur-3xl rounded-full -ml-24 -mb-24 pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-bold tracking-widest mb-6 border border-white/10 uppercase">
                {currentCard.category}
              </span>
              
              {currentCard.icon && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {currentCard.icon}
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-[1.2] whitespace-pre-line tracking-tight mb-4">
                {currentCard.title}
              </h1>
              
              {currentCard.subtitle && (
                <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-line font-medium opacity-90">
                  {currentCard.subtitle}
                </p>
              )}

              {currentCard.content && (
                <div className="space-y-4 mt-2">
                  {currentCard.content.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        {item.icon}
                        <h3 className="font-bold text-white text-lg">{item.step}</h3>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-medium text-sm sm:text-base">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {currentCard.highlight && (
                <div className="mt-6 p-6 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-xl">
                  <p className="text-amber-200 text-lg font-bold leading-relaxed italic">
                    "{currentCard.highlight}"
                  </p>
                </div>
              )}

              {currentCard.summary && (
                <div className="mt-2 space-y-3">
                  {currentCard.summary.map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <p className="text-slate-200 font-bold text-base sm:text-lg">{text}</p>
                    </div>
                  ))}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-slate-300 leading-relaxed font-medium text-sm sm:text-base">
                      {currentCard.cta}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 flex justify-between items-center border-t border-white/10 pt-6 mt-4">
              <span className="text-white/50 text-xs font-bold tracking-wider">{currentCard.footer}</span>
              <span className="text-white/50 text-xs font-black bg-white/10 px-2 py-1 rounded">
                {currentSlide + 1} / {cards.length}
              </span>
            </div>
          </div>

          {/* Navigation Buttons (Desktop) */}
          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:scale-110 transition-all hidden lg:flex"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:scale-110 transition-all hidden lg:flex"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-3 mt-8">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-12 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Navigation Controls (Tablet/Mobile) */}
        <div className="mt-10 flex gap-4 w-full justify-center">
          <button 
            onClick={prevSlide}
            className="flex-1 max-w-[120px] py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} />
            이전
          </button>
          <button 
            onClick={nextSlide}
            className="flex-1 max-w-[200px] py-4 rounded-2xl bg-amber-600 text-white font-bold active:scale-95 transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
          >
            다음 슬라이드
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Home Button */}
        <div className="mt-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-medium">
              <Home size={18} />
              메인으로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
