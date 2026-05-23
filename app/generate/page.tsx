'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Header } from '@/components/header';
import { templates, CardData } from '@/components/card-templates';
import { ArrowLeft, Download, Copy, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function GeneratePage() {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<CardData | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // sessionStorage에서 데이터와 템플릿 가져오기
    const stored = sessionStorage.getItem('structuredData');
    const selected = sessionStorage.getItem('selectedTemplate');

    if (!stored || !selected) {
      router.push('/');
      return;
    }

    try {
      const parsedData = JSON.parse(stored);
      setData(parsedData);
      setTemplateId(selected);
    } catch (error) {
      console.error('[v0] Failed to parse data:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleGenerateImage = async () => {
    if (!previewRef.current || !data || !templateId) return;

    setGenerating(true);
    setError('');

    try {
      // url-safe base64 encoding
      const payload = JSON.stringify({ templateId, data });
      const dataStr = btoa(encodeURIComponent(payload));
      
      const imageUrl = `/api/og?data=${dataStr}`;
      
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('서버 사이드 이미지 렌더링에 실패했습니다.');
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setGeneratedImage(objectUrl);
    } catch (err) {
      console.error('[v0] Error generating image:', err);
      setError('이미지 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `card-news-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!data || !templateId) return;

    setSaving(true);
    setError('');

    try {
      // Firebase Firestore에 저장
      await addDoc(collection(db, 'cards'), {
        templateId,
        data,
        timestamp: Date.now(),
      });

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[v0] Error saving card to Firebase:', err);
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
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

  if (!data || !templateId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">데이터를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            처음으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const template = templates.find((t) => t.id === templateId);
  const TemplateComponent = template?.component;

  if (!TemplateComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">템플릿을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="flex-1 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/templates')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            템플릿 다시 선택
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            카드뉴스 미리보기
          </h1>
          <p className="text-slate-600">
            {template?.name} - 만족스러우신가요?
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Preview */}
          <div className="lg:col-span-2">
            <Card className="p-4 border-2 border-slate-200">
              <div
                ref={previewRef}
                className="bg-white rounded-lg overflow-hidden shadow-lg"
              >
                <TemplateComponent data={data} />
              </div>
            </Card>
          </div>

          {/* Generated Image & Actions */}
          <div className="space-y-6">
            {/* Image Generation */}
            <Card className="p-6">
              <h2 className="font-bold text-slate-900 mb-4">이미지 생성</h2>
              
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={generatedImage}
                      alt="Generated card"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleDownload}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PNG 다운로드
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateImage}
                  disabled={generating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <span>이미지 생성</span>
                  )}
                </Button>
              )}
            </Card>

            {/* Save & Actions */}
            <Card className="p-6">
              <h2 className="font-bold text-slate-900 mb-4">저장</h2>
              <div className="space-y-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  {saving ? <Spinner className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '저장됨!' : saving ? '저장 중...' : '클라우드에 저장하기'}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Firestore에 데이터를 안전하게 보관합니다
                </p>
              </div>
            </Card>

            {/* Data Summary */}
            <Card className="p-6 bg-slate-50">
              <h2 className="font-bold text-slate-900 mb-4">추출 내용</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-700">핵심:</span>
                  <p className="text-slate-600 mt-1">{data.key}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">질문:</span>
                  <p className="text-slate-600 mt-1">{data.question}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="flex-1"
          >
            처음부터 다시
          </Button>
          <Button
            onClick={() => router.push('/library')}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
          >
            저장된 카드 보기
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
