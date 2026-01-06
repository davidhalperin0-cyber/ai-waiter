export type BusinessType = 'bar' | 'pizza' | 'sushi' | 'generic';

export interface PrinterConfig {
  enabled: boolean;
  type: 'http' | 'tcp' | 'serial';
  endpoint: string; // IP address or URL
  payloadType: 'json' | 'text' | 'xml';
  headers?: Record<string, string>;
  port?: number; // For TCP/Serial
}

export interface PosConfig {
  enabled: boolean;
  provider?: string; // 'generic' | 'casbit' | 'resto' | etc. Defaults to 'generic'
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  timeoutMs: number;
}

export interface CustomContent {
  menuButtonImageUrl?: string; // Optional image for menu button background
  promotions?: Array<{
    id: string;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    imageUrl?: string;
    validUntil?: string;
    enabled: boolean;
  }>;
  events?: {
    enabled: boolean;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    formFields?: Array<{
      name: string;
      label: string;
      labelEn?: string;
      type: 'text' | 'email' | 'tel' | 'textarea' | 'select';
      required: boolean;
      options?: string[];
    }>;
  };
  contact?: {
    enabled: boolean;
    title?: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  };
  loyaltyClub?: {
    enabled: boolean;
    title?: string;
    titleEn?: string;
    description?: string;
    descriptionEn?: string;
    benefits?: Array<{
      text: string;
      textEn?: string;
    }>;
  };
  reviews?: {
    enabled: boolean;
    googleReviewsUrl?: string;
  };
  delivery?: {
    enabled: boolean;
    title: string;
    titleEn?: string;
    description: string;
    descriptionEn?: string;
    link?: string;
  };
}

/**
 * Canonical Order Model - SINGLE SOURCE OF TRUTH
 * This model is NEVER modified per POS.
 * All POS integrations adapt FROM this model.
 */
export interface CanonicalOrder {
  orderId: string;
  businessId: string;
  table: string;
  source: 'QR_MENU' | 'AI';
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export interface Business {
  _id?: string;
  businessId: string; // public id / slug
  name: string;
  logoUrl?: string; // URL to business logo image
  type: BusinessType;
  template: 'bar-modern' | 'bar-classic' | 'bar-mid' | 'pizza-modern' | 'pizza-classic' | 'pizza-mid' | 'sushi' | 'generic' | 'gold';
  email: string;
  passwordHash: string;
  isEnabled: boolean;
  subscription: {
    status: 'trial' | 'active' | 'expired' | 'past_due';
    planType?: 'full' | 'menu_only';
    menuOnlyMessage?: string | null;
    nextBillingDate?: string;
  };
  printerConfig?: PrinterConfig;
  posConfig?: PosConfig;
  aiInstructions?: string; // הוראות מותאמות אישית ל-AI
  businessHours?: {
    start: string; // Format: "HH:MM" (e.g., "10:00")
    end: string; // Format: "HH:MM" (e.g., "18:00")
  } | null; // null means business items are always available
  customContent?: CustomContent; // Custom content sections for menu
  createdAt: string;
}

export interface Table {
  _id?: string;
  businessId: string;
  tableId: string;
  label: string;
}

export interface MenuItem {
  _id?: string;
  businessId: string;
  category: string;
  categoryEn?: string;
  name: string;
  // Optional English variants for multi-language menu
  nameEn?: string;
  imageUrl?: string;
  // Price can be a single number or a range {min: number, max: number}
  price: number | { min: number; max: number };
  ingredients?: string[];
  allergens?: string[];
  ingredientsEn?: string[];
  allergensEn?: string[];
  customizationOptions?: string[];
  isFeatured?: boolean; // מנה מומלצת/דיל
  isPregnancySafe?: boolean; // האם מתאים להריון
  isBusiness?: boolean; // מנה עסקית (ארוחות צהריים, חבילות קבוצתיות, תפריטי אירועים)
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
}

export interface Order {
  _id?: string;
  orderId: string;
  businessId: string;
  tableId: string;
  items: OrderItem[];
  aiSummary?: string;
  status: 'received' | 'sent_to_printer' | 'printed' | 'printer_error' | 'sent_to_pos' | 'pos_error';
  createdAt: string;
  totalAmount: number;
}

