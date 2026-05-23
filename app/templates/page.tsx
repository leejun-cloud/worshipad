'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/header';
import { templates, CardData } from '@/components/card-templates';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function TemplatesPage() {
  const router = useRouter();
  const [data, setData] = useState<CardData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sessionStorage에서 구조화된 데이터 가져오기
    const stored = sessionStorage.getItem('structuredData');
    if (!stored) {
      router.push('/');
      return;
    }

    try {
      const parsedData = JSON.parse(stored);
      setData(parsedData);
    } catch (error) {
      console.error('[v0] Failed to parse structured data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSelect = (templateId: string) => {
    if (!data) return;
    
    // 선택된 템플릿과 데이터를 저장하고 생성 페이지로 이동
    sessionStorage.setItem('selectedTemplate', templateId);
    router.push('/generate');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">데이터를 찾을 수 없습니다.</p>
          <Button
            onClick={() => router.push('/')}
            className="mt-4"
          >
            처음으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="flex-1 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            템플릿 선택
          </h1>
          <p className="text-slate-600">
            카드뉴스 스타일을 선택하세요. 미리보기에서 확인할 수 있습니다.
          </p>
        </div>

        {/* Structured Data Preview */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
          <h2 className="font-semibold text-slate-900 mb-4">AI가 추출한 내용</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-slate-700">핵심:</span>
              <p className="text-slate-600 mt-1">{data.key}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">질문:</span>
              <p className="text-slate-600 mt-1">{data.question}</p>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold text-slate-700">품성:</span>
              <p className="text-slate-600 mt-1">{data.character}</p>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold text-slate-700">실행:</span>
              <ul className="text-slate-600 mt-1 ml-4 list-disc">
                {data.implementation.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {templates.map((template) => (
            <Card
              key={template.id}
              onClick={() => setSelected(template.id)}
              className={`p-6 cursor-pointer transition-all border-2 ${
                selected === template.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {template.description}
                  </p>
                </div>
                {selected === template.id && (
                  <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                )}
              </div>

              {/* Template Preview */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 aspect-square overflow-hidden">
                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                  <div className="text-xs text-slate-500 text-center">
                    {template.id === 'impact' && (
                      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white w-full h-full flex items-center justify-center font-bold">
                        임팩트형
                      </div>
                    )}
                    {template.id === 'list' && (
                      <div className="flex flex-col justify-start p-3 text-left">
                        <div className="font-bold text-slate-900 mb-2">제목</div>
                        <div className="text-slate-600 space-y-1">
                          <div>1. 포인트</div>
                          <div>2. 포인트</div>
                          <div>3. 포인트</div>
                        </div>
                      </div>
                    )}
                    {template.id === 'story' && (
                      <div className="bg-gradient-to-b from-slate-800 to-slate-900 text-white w-full h-full flex flex-col justify-between p-4">
                        <div className="font-bold">스토리 제목</div>
                        <div>스토리 내용...</div>
                      </div>
                    )}
                    {template.id === 'beforeafter' && (
                      <div className="flex w-full h-full">
                        <div className="flex-1 bg-red-100 flex items-center justify-center text-red-700 font-bold">
                          Before
                        </div>
                        <div className="flex-1 bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          After
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                선택하면 미리보기를 볼 수 있습니다
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1"
          >
            처음부터 다시
          </Button>
          <Button
            onClick={() => handleSelect(selected || 'impact')}
            disabled={!selected}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            선택한 템플릿으로 생성
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
