import { ReactNode } from 'react';

export interface CardData {
  key: string;
  question: string;
  character: string;
  implementation: string[];
}

// 템플릿 1: 임팩트형 (Hook형) - 화려한 그라데이션 & 글래스모피즘
export function ImpactTemplate({ data }: { data: CardData }) {
  return (
    <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 flex flex-col items-center justify-center p-16 text-white relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-pink-500/40 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500/40 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-[800px] w-full">
        {/* Main Message */}
        <div className="text-[5.5rem] font-black leading-[1.2] drop-shadow-2xl">
          {data.key.split('\n').map((line, i) => (
            <div key={i} className="mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-100">{line}</div>
          ))}
        </div>

        {/* Question */}
        <div className="text-4xl font-bold opacity-95 bg-white/10 px-8 py-4 rounded-3xl backdrop-blur-md shadow-2xl border border-white/20">
          {data.question}
        </div>

        {/* Implementation Points */}
        <div className="flex gap-6 justify-center flex-wrap mt-8">
          {data.implementation.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/10 rounded-2xl px-8 py-5 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] hover:scale-105 transition-transform duration-300"
            >
              <div className="text-2xl font-bold tracking-tight">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 템플릿 2: 리스트형 - 클린&모던 UI
export function ListTemplate({ data }: { data: CardData }) {
  return (
    <div className="w-[1080px] h-[1080px] bg-slate-50 flex flex-col p-16 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-200/50 rounded-bl-[100%] blur-[80px] -z-0"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="border-b-8 border-blue-600 pb-8 mb-10 inline-block self-start">
          <h2 className="text-[3.5rem] font-extrabold text-slate-900 leading-tight">{data.key}</h2>
        </div>

        {/* Question */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 mb-10 border-l-8 border-blue-600 shadow-xl shadow-blue-900/5">
          <p className="text-3xl font-bold text-blue-900">{data.question}</p>
        </div>

        {/* Character/Description */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-blue-600 mb-6 uppercase tracking-wider">핵심 내용</h3>
          <p className="text-[2rem] text-slate-700 leading-snug whitespace-pre-wrap font-medium">
            {data.character}
          </p>
        </div>

        {/* Implementation List */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-blue-600 mb-6 uppercase tracking-wider">실행 방법</h3>
          <div className="space-y-6">
            {data.implementation.map((item, idx) => (
              <div key={idx} className="flex gap-6 items-center bg-white rounded-2xl p-6 shadow-md border border-slate-100 transform hover:-translate-y-1 transition-transform">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0 text-2xl shadow-lg shadow-blue-500/30">
                  {idx + 1}
                </div>
                <p className="text-2xl font-bold text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 템플릿 3: 스토리형 - 다크모드 프리미엄
export function StoryTemplate({ data }: { data: CardData }) {
  return (
    <div className="w-[1080px] h-[1080px] bg-slate-950 flex flex-col p-16 text-white relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[120px]"></div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top Section */}
        <div className="space-y-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 rounded-full text-lg font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            Story
          </div>
          <h1 className="text-[4rem] font-black leading-[1.3] text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            {data.key}
          </h1>
        </div>

        {/* Middle Section - Character */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-2xl font-bold tracking-widest text-indigo-400 mb-6 uppercase">상황 / 전개</h2>
          <p className="text-[2.25rem] text-slate-300 leading-relaxed font-medium">
            {data.character}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="space-y-6">
          <div className="text-xl font-bold text-rose-400 uppercase tracking-widest">
            교훈 / 해결
          </div>
          <p className="text-[3rem] font-bold text-white shadow-sm leading-tight">{data.question}</p>
          <div className="flex gap-4 pt-6 flex-wrap">
            {data.implementation.map((item, idx) => (
              <div
                key={idx}
                className="bg-indigo-950/50 border border-indigo-500/30 px-6 py-3 rounded-full text-xl font-bold text-indigo-100 backdrop-blur-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 템플릿 4: Before/After - 대비 효과 극대화
export function BeforeAfterTemplate({ data }: { data: CardData }) {
  return (
    <div className="w-[1080px] h-[1080px] bg-slate-50 flex flex-col p-0 relative">
      {/* Header */}
      <div className="h-[240px] bg-gradient-to-r from-rose-500 via-purple-600 to-blue-600 text-white flex items-center justify-center p-12 shadow-xl z-20">
        <h1 className="text-[3.5rem] font-black text-center drop-shadow-lg">{data.key}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex z-10 relative">
        {/* Before */}
        <div className="flex-1 bg-gradient-to-b from-rose-50 to-white flex flex-col items-center justify-center p-12 lg:border-r-4 border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/40 rounded-full blur-[80px]"></div>
          
          <div className="bg-rose-500 text-white px-8 py-3 rounded-full text-2xl font-black mb-10 shadow-lg shadow-rose-500/30 transform -rotate-2">
            Before (문제)
          </div>
          <div className="text-[2.5rem] font-bold text-rose-950 mb-12 text-center leading-snug relative z-10">
            {data.character.split('\n')[0]}
          </div>
          <div className="space-y-6 w-full relative z-10">
            {data.implementation.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex items-center gap-5 bg-white/60 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-rose-100">
                <span className="text-rose-600 font-extrabold text-3xl">✗</span>
                <span className="text-2xl font-bold text-rose-900">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* After */}
        <div className="flex-1 bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/40 rounded-full blur-[80px]"></div>

          <div className="bg-blue-600 text-white px-8 py-3 rounded-full text-2xl font-black mb-10 shadow-lg shadow-blue-600/30 transform rotate-2">
            After (해결)
          </div>
          <div className="text-[2.5rem] font-bold text-blue-950 mb-12 text-center leading-snug relative z-10">
            {data.question}
          </div>
          <div className="space-y-6 w-full relative z-10">
            {data.implementation.map((item, idx) => (
              <div key={idx} className="flex items-center gap-5 bg-white/60 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-blue-100">
                <span className="text-blue-600 font-extrabold text-3xl">✓</span>
                <span className="text-2xl font-bold text-blue-900">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const templates = [
  {
    id: 'impact',
    name: '임팩트형 (Hook형)',
    description: '강력한 질문으로 시작 - 전도/설교용',
    component: ImpactTemplate,
  },
  {
    id: 'list',
    name: '리스트형',
    description: '3~5가지 포인트 - 자기계발 콘텐츠',
    component: ListTemplate,
  },
  {
    id: 'story',
    name: '스토리형',
    description: '문제→갈등→해결→교훈 - 간증/사례용',
    component: StoryTemplate,
  },
  {
    id: 'beforeafter',
    name: 'Before/After',
    description: '변화 강조 - 변화 중심',
    component: BeforeAfterTemplate,
  },
];
