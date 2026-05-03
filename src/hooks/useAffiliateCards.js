import { useState, useEffect, useCallback } from 'react';
import { API } from '../config/api';

const AFFILIATE_API = `${API.BASE}/api/affiliate/cards`;

export function useAffiliateCards(page) {
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(AFFILIATE_API);
      const data = await res.json();
      setAllCards(Array.isArray(data) ? data : []);
    } catch { setAllCards([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function upsert(card) {
    if (card.id) {
      await fetch(`${AFFILIATE_API}/${card.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) });
    } else {
      await fetch(AFFILIATE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card) });
    }
    await fetch_();
  }

  async function remove(id) {
    await fetch(`${AFFILIATE_API}/${id}`, { method: 'DELETE' });
    await fetch_();
  }

  const cards = page ? allCards.filter(c => c.page === page) : allCards;

  return { cards, allCards, upsert, remove, loading };
}
