export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface Brand {
  id: string;
  name: string;
  tone_guidelines?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  brand_id: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  brand_id: string;
  product_name: string;
  order_date: string;
  delivery_date: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'customer' | 'agent' | 'ai';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  brand_id: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  brand?: Brand;
  messages?: Message[];
}

export interface ConversationListItem {
  id: string;
  customer: Pick<Customer, 'name' | 'email'>;
  brand: Pick<Brand, 'name'>;
  latestMessage: {
    content: string;
    created_at: string;
  };
}

export interface KBArticle {
  id: string;
  brand_id: string;
  category: 'return' | 'refund' | 'shipping' | 'cancellation';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AILog {
  id: string;
  conversation_id: string;
  customer_message: string;
  retrieved_context: string;
  ai_response: string;
  agent_edited_response?: string;
  final_response?: string;
  status: 'generated' | 'edited' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface GenerateReplyResponse {
  reply: string;
  retrieved_context: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';
export type MessageSender = 'customer' | 'agent' | 'ai';
export type KBCategory = 'return' | 'refund' | 'shipping' | 'cancellation';
export type AILogStatus = 'generated' | 'edited' | 'approved';