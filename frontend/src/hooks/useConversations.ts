// src/hooks/useConversations.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Define types locally
interface ConversationListItem {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  brand: {
    name: string;
  };
  latestMessage: {
    content: string;
    created_at: string;
  };
}

interface UseConversationsReturn {
  conversations: ConversationListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ✅ Make sure this is exported correctly
export const useConversations = (): UseConversationsReturn => {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('conversations')
        .select(`
          id,
          customer_id,
          brand_id,
          customers(name, email),
          brands(name)
        `)
        .order('updated_at', { ascending: false });

      if (queryError) throw queryError;

      if (!data || data.length === 0) {
        setConversations([]);
        return;
      }

      const enriched = await Promise.all(
        data.map(async (conv: any) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            id: conv.id,
            customer: conv.customers,
            brand: conv.brands,
            latestMessage: messages?.[0] || { 
              content: 'No messages', 
              created_at: '' 
            },
          };
        })
      );

      setConversations(enriched);
    } catch (err) {
      console.error('Fetch conversations error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
};

// ✅ Also export as default if needed
export default useConversations;