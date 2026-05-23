'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Header } from '@/components/header';
import { AlertCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('텍스트를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/structure-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('텍스트 구조화 실패');
      }

      const data = await response.json();
      
      // 구조화된 데이터를 localStorage에 저장
      sessionStorage.setItem('structuredData', JSON.stringify(data));
      
      // 템플릿 선택 페이지로 이동
      router.push('/templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">KQCI 카드뉴스</h1>
          </div>
          <p className="text-lg text-slate-600">
            AI가 텍스트를 자동으로 구조화하고 인스타그램 카드뉴스를 생성합니다
          </p>
        </div>

        {/* Main Card */}
        <Card className="border border-slate-200 shadow-lg">
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-6">
              {/* Input Label */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  카드뉴스로 변환할 텍스트 입력
                </label>
                <p className="text-sm text-slate-500 mb-4">
                  뉴스 기사, 교육 콘텐츠, 제품 설명 등 어떤 텍스트든 입력하세요
                </p>
              </div>

              {/* Textarea */}
              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError('');
                }}
                placeholder="여기에 텍스트를 붙여넣기 하거나 입력하세요..."
                className="min-h-64 resize-none p-4 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />

              {/* Character Count */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">
                  {text.length} / 5000 자
                </span>
                {text.length > 5000 && (
                  <span className="text-sm text-red-600">
                    최대 5000자까지만 입력 가능합니다
                  </span>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !text.trim() || text.length > 5000}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    <span>AI가 분석 중입니다...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>템플릿 선택하기</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="text-2xl font-bold text-blue-600 mb-2">4가지</div>
            <p className="text-slate-600 text-sm">임팩트형, 리스트형, 스토리형, Before/After</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="text-2xl font-bold text-blue-600 mb-2">자동</div>
            <p className="text-slate-600 text-sm">AI 기반 텍스트 구조화로 시간 단축</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="text-2xl font-bold text-blue-600 mb-2">1080x1080</div>
            <p className="text-slate-600 text-sm">인스타그램 표준 이미지 자동 생성</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
