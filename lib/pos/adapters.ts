/**
 * POS Adapter System
 * 
 * All POS integrations must implement PosAdapter interface.
 * The system uses ONE canonical order format internally.
 * Adapters translate canonical → POS-specific format.
 */

import { CanonicalOrder, PosConfig } from '@/lib/types';

/**
 * POS Adapter Interface
 * All POS integrations must implement this interface
 */
export interface PosAdapter {
  /**
   * Sends order to POS system
   * @param order - Canonical order format (internal)
   * @param config - POS configuration from business
   * @throws Error if sending fails
   */
  sendOrder(order: CanonicalOrder, config: PosConfig): Promise<void>;
}

/**
 * Generic HTTP Adapter
 * Sends canonical order as JSON to any HTTP endpoint
 * This is the default adapter for most POS systems
 */
export class GenericHttpAdapter implements PosAdapter {
  async sendOrder(order: CanonicalOrder, config: PosConfig): Promise<void> {
    // Validate URL protocol
    if (!config.endpoint.match(/^https?:\/\//)) {
      throw new Error('Endpoint must start with http:// or https://');
    }
    
    const url = config.endpoint;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(order),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `POS returned error: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`POS request timeout after ${config.timeoutMs}ms`);
      }
      
      throw new Error(`POS request failed: ${error.message}`);
    }
  }
}

/**
 * Caspit POS Adapter
 * Example adapter for Caspit POS system
 * Maps canonical order to Caspit-specific format
 */
export class CaspitAdapter implements PosAdapter {
  async sendOrder(order: CanonicalOrder, config: PosConfig): Promise<void> {
    // Map canonical order to Caspit format
    const caspitPayload = {
      order_number: order.orderId,
      table: order.table,
      items: order.items.map((item) => ({
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.total,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      notes: order.notes || '',
      created_at: order.createdAt,
    };

    // Validate URL protocol
    if (!config.endpoint.match(/^https?:\/\//)) {
      throw new Error('Endpoint must start with http:// or https://');
    }
    
    const url = config.endpoint;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(caspitPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Caspit POS returned error: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Caspit POS request timeout after ${config.timeoutMs}ms`);
      }
      
      throw new Error(`Caspit POS request failed: ${error.message}`);
    }
  }
}

/**
 * Resto POS Adapter
 * Example adapter for Resto POS system
 * Maps canonical order to Resto-specific format
 */
export class RestoAdapter implements PosAdapter {
  async sendOrder(order: CanonicalOrder, config: PosConfig): Promise<void> {
    // Map canonical order to Resto format
    const restoPayload = {
      id: order.orderId,
      business_id: order.businessId,
      table_number: order.table,
      order_source: order.source,
      line_items: order.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        qty: item.quantity,
        price: item.unitPrice,
        amount: item.total,
      })),
      amounts: {
        subtotal: order.subtotal,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
      },
      customer_notes: order.notes || '',
      timestamp: order.createdAt,
    };

    // Validate URL protocol
    if (!config.endpoint.match(/^https?:\/\//)) {
      throw new Error('Endpoint must start with http:// or https://');
    }
    
    const url = config.endpoint;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: JSON.stringify(restoPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Resto POS returned error: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Resto POS request timeout after ${config.timeoutMs}ms`);
      }
      
      throw new Error(`Resto POS request failed: ${error.message}`);
    }
  }
}

/**
 * Adapter Resolver
 * Returns the appropriate adapter based on provider
 * 
 * @param provider - POS provider name (e.g., 'generic', 'casbit', 'resto')
 * @returns PosAdapter instance
 */
export function getPosAdapter(provider?: string): PosAdapter {
  switch (provider?.toLowerCase()) {
    case 'casbit':
    case 'caspit':
      return new CaspitAdapter();
    case 'resto':
      return new RestoAdapter();
    case 'generic':
    default:
      return new GenericHttpAdapter();
  }
}

