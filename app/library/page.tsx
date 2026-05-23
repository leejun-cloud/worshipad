'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/header';
import { templates, CardData } from '@/components/card-templates';
import { ArrowLeft, Trash2, Download, Edit2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface SavedCard {
  id: string;
  templateId: string;
  data: CardData;
  timestamp: number;
}

export default function LibraryPage() {
  const router = useRouter();
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const q = query(collection(db, 'cards'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const cards: SavedCard[] = [];
        querySnapshot.forEach((doc) => {
          cards.push({ id: doc.id, ...doc.data() } as SavedCard);
        });
        setSavedCards(cards);
      } catch (error) {
        console.error('[v0] Error loading saved cards from Firestore:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cards', id));
      const updated = savedCards.filter((card) => card.id !== id);
      setSavedCards(updated);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleEdit = (card: SavedCard) => {
    // 카드 데이터를 sessionStorage에 저장하고 generate 페이지로 이동
    sessionStorage.setItem('structuredData', JSON.stringify(card.data));
    sessionStorage.setItem('selectedTemplate', card.templateId);
    router.push('/generate');
  };

  const handleDownload = async (card: SavedCard) => {
    const template = templates.find((t) => t.id === card.templateId);
    if (!template) return;

    try {
      const payload = JSON.stringify({ templateId: card.templateId, data: card.data });
      const dataStr = btoa(encodeURIComponent(payload));
      const imageUrl = `/api/og?data=${dataStr}`;

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('서버 사이드 이미지 다운로드에 실패했습니다.');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `card-news-${card.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('[v0] Error downloading card:', error);
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
            홈으로
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            저장된 카드
          </h1>
          <p className="text-slate-600">
            {savedCards.length > 0
              ? `${savedCards.length}개의 카드가 저장되어 있습니다`
              : '저장된 카드가 없습니다'}
          </p>
        </div>

        {savedCards.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-slate-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m0 0h6M6 12a6 6 0 1112 0 6 6 0 01-12 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-600 mb-4">
              아직 저장된 카드가 없습니다
            </p>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              새로운 카드를 만들고 저장하면 여기에 나타납니다
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              새 카드 만들기
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCards.map((card) => {
              const template = templates.find((t) => t.id === card.templateId);
              const date = new Date(card.timestamp).toLocaleDateString('ko-KR');

              return (
                <Card key={card.id} className="overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
                  {/* Card Preview */}
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-700 mb-2">
                        {template?.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {card.data.key}
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-slate-900 mb-2 truncate">
                      {card.data.key}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      {date}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(card)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        수정
                      </Button>
                      <Button
                        onClick={() => handleDownload(card)}
                        variant="outline"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Download className="w-3 h-3" />
                        다운로드
                      </Button>
                      <Button
                        onClick={() => handleDelete(card.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        {savedCards.length > 0 && (
          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="flex-1"
            >
              새 카드 만들기
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
