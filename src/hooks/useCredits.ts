import { useEffect, useState } from "react";

// Exemplo de hook para buscar e atualizar créditos do usuário no banco do Lovable
export function useCredits(userId?: string) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar créditos no banco Lovable
  useEffect(() => {
    if (!userId) return;

    const fetchCredits = async () => {
      try {
        const res = await fetch(`/api/credits?user_id=${userId}`);
        const data = await res.json();
        setCredits(data.credits ?? 0);
      } catch (err) {
        console.error("Erro ao carregar créditos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [userId]);

  // Atualizar créditos no banco Lovable
  const updateCredits = async (amount: number) => {
    if (!userId) return;

    const newCredits = (credits ?? 0) + amount;
    setCredits(newCredits);

    await fetch(`/api/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, credits: newCredits }),
    });
  };

  return { credits, updateCredits, loading };
}

