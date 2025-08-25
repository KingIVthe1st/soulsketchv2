
/**
 * Apple Pay Integration for SoulmateSketch
 * Integrates with Stripe for seamless mobile payments
 */

class ApplePayService {
  constructor(stripeKey) {
    this.stripe = Stripe(stripeKey);
    this.config = {
  "merchantIdentifier": "merchant.com.soulmatesketch",
  "supportedNetworks": [
    "visa",
    "masterCard",
    "amex",
    "discover"
  ],
  "merchantCapabilities": [
    "supports3DS"
  ],
  "supportedCountries": [
    "US",
    "CA",
    "GB",
    "AU"
  ]
};
  }

  /**
   * Check if Apple Pay is available
   */
  isApplePayAvailable() {
    if (!window.ApplePaySession) {
      console.log('Apple Pay not supported on this browser');
      return false;
    }
    
    if (!ApplePaySession.canMakePayments()) {
      console.log('Apple Pay not available (no cards set up)');
      return false;
    }
    
    if (!ApplePaySession.supportsVersion(3)) {
      console.log('Apple Pay version 3 not supported');
      return false;
    }
    
    return true;
  }

  /**
   * Initialize Apple Pay button
   */
  initApplePayButton(containerId) {
    if (!this.isApplePayAvailable()) {
      console.log('Apple Pay not available on this device');
      return false;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Apple Pay container not found:', containerId);
      return false;
    }

    // Create Apple Pay button
    const button = document.createElement('button');
    button.className = 'apple-pay-button apple-pay-button-black';
    button.style.cssText = `
      -webkit-appearance: -apple-pay-button;
      -apple-pay-button-type: buy;
      -apple-pay-button-style: black;
      width: 100%;
      height: 50px;
      margin: 10px 0;
      border-radius: 8px;
      cursor: pointer;
      border: none;
    `;
    
    button.addEventListener('click', (e) => this.handleApplePayClick(e));
    
    container.appendChild(button);
    
    console.log('✅ Apple Pay button initialized');
    return true;
  }

  /**
   * Handle Apple Pay button click
   */
  async handleApplePayClick(event) {
    event.preventDefault();
    
    try {
      // Get current order details
      const orderData = this.getOrderData();
      
      if (!orderData) {
        throw new Error('Order data not available');
      }

      // Create payment request
      const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: this.config.supportedNetworks,
        merchantCapabilities: this.config.merchantCapabilities,
        total: {
          label: `SoulmateSketch - ${orderData.tierDisplayName}`,
          amount: (orderData.price / 100).toFixed(2)
        },
        lineItems: [
          {
            label: `${orderData.tierDisplayName} Soulmate Sketch`,
            amount: (orderData.price / 100).toFixed(2)
          }
        ]
      };

      // Start Apple Pay session
      const session = new ApplePaySession(3, paymentRequest);
      
      session.onvalidatemerchant = (event) => {
        this.validateMerchant(event, session);
      };
      
      session.onpaymentauthorized = (event) => {
        this.processPayment(event, session, orderData);
      };
      
      session.oncancel = (event) => {
        console.log('Apple Pay cancelled');
      };
      
      session.begin();
      
    } catch (error) {
      console.error('Apple Pay error:', error);
      this.showError('Apple Pay is temporarily unavailable. Please try the regular checkout.');
    }
  }

  /**
   * Validate merchant with Apple
   */
  async validateMerchant(event, session) {
    try {
      // This validation happens on your server
      const response = await fetch('/api/applepay/validate-merchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validationURL: event.validationURL,
          displayName: 'SoulmateSketch'
        })
      });
      
      const merchantSession = await response.json();
      session.completeMerchantValidation(merchantSession);
      
    } catch (error) {
      console.error('Merchant validation failed:', error);
      session.abort();
    }
  }

  /**
   * Process the Apple Pay payment
   */
  async processPayment(event, session, orderData) {
    try {
      // Create Stripe PaymentMethod from Apple Pay token
      const {paymentMethod, error} = await this.stripe.createPaymentMethod({
        type: 'card',
        card: {
          token: event.payment.token
        }
      });

      if (error) {
        throw error;
      }

      // Process payment on server
      const response = await fetch('/api/process-apple-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          orderData: orderData,
          billingContact: event.payment.billingContact,
          shippingContact: event.payment.shippingContact
        })
      });

      const result = await response.json();

      if (result.success) {
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        
        // Redirect to success page
        window.location.href = `/order-success?id=${result.orderId}`;
        
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      session.completePayment(ApplePaySession.STATUS_FAILURE);
      this.showError('Payment failed. Please try again.');
    }
  }

  /**
   * Get current order data from the page
   */
  getOrderData() {
    // Extract order data from form or page context
    const tierSelect = document.querySelector('input[name="tier"]:checked');
    const emailInput = document.querySelector('input[name="email"]');
    
    if (!tierSelect || !emailInput?.value) {
      return null;
    }

    const tier = tierSelect.value;
    const prices = {
      basic: 1999,   // $19.99
      plus: 2999,    // $29.99
      premium: 4999  // $49.99
    };

    const tierNames = {
      basic: 'Essential',
      plus: 'Plus', 
      premium: 'Premium'
    };

    return {
      tier,
      price: prices[tier],
      tierDisplayName: tierNames[tier],
      email: emailInput.value,
      // Add other form data as needed
    };
  }

  /**
   * Show error message to user
   */
  showError(message) {
    // You can customize this to match your UI
    alert(message);
  }
}

// Auto-initialize Apple Pay when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Replace with your actual Stripe publishable key
  const stripeKey = 'pk_test_your-stripe-key-here';
  
  if (typeof Stripe !== 'undefined') {
    window.applePayService = new ApplePayService(stripeKey);
    
    // Initialize Apple Pay button if container exists
    const container = document.getElementById('apple-pay-button-container');
    if (container) {
      // Show the container first
      container.style.display = 'block';
      // Then initialize the button
      if (window.applePayService.initApplePayButton('apple-pay-button')) {
        console.log('Apple Pay button initialized successfully');
      } else {
        console.log('Apple Pay not available on this device');
        container.style.display = 'none';
      }
    }
  }
});
