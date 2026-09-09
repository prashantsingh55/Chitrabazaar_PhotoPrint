export interface PaymentIntent {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  gateway: string;
  clientSecret?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionId: string;
  method: string;
  error?: string;
}

export interface PaymentGateway {
  name: string;
  createPaymentIntent(orderId: string, amount: number, currency: string): Promise<PaymentIntent>;
  verifyPayment(orderId: string, transactionId: string, extraData?: Record<string, unknown>): Promise<PaymentVerificationResult>;
}

export class MockPaymentGateway implements PaymentGateway {
  name = 'MOCK_PAYMENT';

  async createPaymentIntent(orderId: string, amount: number, currency: string): Promise<PaymentIntent> {
    const transactionId = `TXN-MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      transactionId,
      orderId,
      amount,
      currency,
      gateway: this.name,
      clientSecret: `mock_secret_${transactionId}`,
    };
  }

  async verifyPayment(orderId: string, transactionId: string): Promise<PaymentVerificationResult> {
    // In mock mode, transactions are immediately approved
    return {
      success: true,
      transactionId,
      method: 'MOCK_PAYMENT',
    };
  }
}

export class StripePaymentGateway implements PaymentGateway {
  name = 'STRIPE';

  async createPaymentIntent(orderId: string, amount: number, currency: string): Promise<PaymentIntent> {
    const transactionId = `pi_${Date.now()}_stripe`;
    return {
      transactionId,
      orderId,
      amount,
      currency,
      gateway: this.name,
      clientSecret: `${transactionId}_secret`,
    };
  }

  async verifyPayment(orderId: string, transactionId: string): Promise<PaymentVerificationResult> {
    return {
      success: true,
      transactionId,
      method: 'STRIPE',
    };
  }
}

export class RazorpayPaymentGateway implements PaymentGateway {
  name = 'RAZORPAY';

  async createPaymentIntent(orderId: string, amount: number, currency: string): Promise<PaymentIntent> {
    const transactionId = `order_${Date.now()}_rzp`;
    return {
      transactionId,
      orderId,
      amount,
      currency,
      gateway: this.name,
    };
  }

  async verifyPayment(orderId: string, transactionId: string): Promise<PaymentVerificationResult> {
    return {
      success: true,
      transactionId,
      method: 'RAZORPAY',
    };
  }
}

export function getPaymentGateway(): PaymentGateway {
  const gateway = process.env.PAYMENT_GATEWAY || 'mock';
  switch (gateway.toLowerCase()) {
    case 'stripe':
      return new StripePaymentGateway();
    case 'razorpay':
      return new RazorpayPaymentGateway();
    default:
      return new MockPaymentGateway();
  }
}
