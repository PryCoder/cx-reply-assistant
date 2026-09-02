// src/hooks/useConversation.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Conversation, Customer, Brand, Order, Message } from '../types';

interface UseConversationReturn {
  conversation: Conversation | null;
  customer: Customer | null;
  brand: Brand | null;
  orders: Order[];
  messages: Message[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useConversation = (conversationId: string): UseConversationReturn => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setError('No conversation ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      setConversation(convData);

      const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', convData.customer_id)
        .single();

      if (custError) throw custError;
      setCustomer(custData);

      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', convData.brand_id)
        .single();

      if (brandError) throw brandError;
      setBrand(brandData);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', convData.customer_id)
        .eq('brand_id', convData.brand_id)
        .order('delivery_date', { ascending: false });

      if (orderError) throw orderError;
      setOrders(orderData || []);

      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;
      setMessages(msgData || []);
    } catch (err) {
      console.error('Fetch conversation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    customer,
    brand,
    orders,
    messages,
    loading,
    error,
    refetch: fetchConversation,
  };
};