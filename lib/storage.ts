export interface SavedCard {
  id: string;
  inputText: string;
  structuredData: any;
  template: 'impact' | 'list' | 'story' | 'before-after';
  imageUrl?: string;
  createdAt: number;
  title: string;
}

const STORAGE_KEY = 'kqci_saved_cards';
const MAX_SAVED_CARDS = 10;

export function getSavedCards(): SavedCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCard(card: Omit<SavedCard, 'id' | 'createdAt'>): SavedCard {
  if (typeof window === 'undefined') return card as SavedCard;
  
  const cards = getSavedCards();
  const newCard: SavedCard = {
    ...card,
    id: `card_${Date.now()}`,
    createdAt: Date.now(),
  };

  // Keep only the latest MAX_SAVED_CARDS
  cards.unshift(newCard);
  const limitedCards = cards.slice(0, MAX_SAVED_CARDS);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedCards));
  return newCard;
}

export function deleteCard(id: string): void {
  if (typeof window === 'undefined') return;
  
  const cards = getSavedCards();
  const filtered = cards.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getCard(id: string): SavedCard | null {
  if (typeof window === 'undefined') return null;
  
  const cards = getSavedCards();
  return cards.find(c => c.id === id) || null;
}

export function updateCardImage(id: string, imageUrl: string): void {
  if (typeof window === 'undefined') return;
  
  const cards = getSavedCards();
  const card = cards.find(c => c.id === id);
  if (card) {
    card.imageUrl = imageUrl;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }
}

export function clearAllCards(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
