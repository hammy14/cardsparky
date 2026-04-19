import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api/affiliate/cards';

export function useAffiliateCards(page) {
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setAllCards(Array.isArray(data) ? data : []);
    } catch { setAllCards([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function upsert(card) {
    if (card.id) {
      await fetch(`${API}/${card.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) });
    } else {
      await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) });
    }
    await fetch_();
  }

  async function remove(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    await fetch_();
  }

  const cards = page ? allCards.filter(c => c.page === page) : allCards;

  return { cards, allCards, upsert, remove, loading };
}
