export const APP_CONFIG = {
  name: 'CX Reply Assistant',
  version: '1.0.0',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'badge-warning',
  shipped: 'badge-primary',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

export const MESSAGE_SENDER = {
  CUSTOMER: 'customer',
  AGENT: 'agent',
  AI: 'ai',
} as const;

export const KB_CATEGORIES = {
  RETURN: 'return',
  REFUND: 'refund',
  SHIPPING: 'shipping',
  CANCELLATION: 'cancellation',
} as const;

export const AI_LOG_STATUS = {
  GENERATED: 'generated',
  EDITED: 'edited',
  APPROVED: 'approved',
} as const;

export const DEMO_CREDENTIALS = {
  email: 'agent@example.com',
  password: 'any password',
} as const;