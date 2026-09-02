// src/services/replyService.ts
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface GenerateReplyResponse {
  reply: string;
  retrieved_context: string;
}

export const replyService = {
  generateReply: async (conversationId: string): Promise<GenerateReplyResponse> => {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ conversation_id: conversationId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Generate reply error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate reply'
      );
    }
  },

  approveReply: async (conversationId: string, aiResponse: string): Promise<void> => {
    if (!conversationId || !aiResponse) {
      throw new Error('Conversation ID and response are required');
    }

    try {
      // 1. Find the latest AI log
      const { data: aiLogData, error: aiLogError } = await supabase
        .from('ai_logs')
        .select('id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (aiLogError) throw new Error('No AI log found for this conversation');

      // 2. Update the log
      const { error: updateError } = await supabase
        .from('ai_logs')
        .update({
          agent_edited_response: aiResponse,
          final_response: aiResponse,
          status: 'approved',
        })
        .eq('id', aiLogData.id);

      if (updateError) throw updateError;

      // 3. Add agent message to conversation
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender: 'agent',
        content: aiResponse,
        created_at: new Date().toISOString(),
      });

      if (msgError) throw msgError;
    } catch (error) {
      console.error('Approve reply error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to approve reply'
      );
    }
  },
};