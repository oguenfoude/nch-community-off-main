// app/checkout/page.jsx
'use client';

import { useState, useEffect } from 'react';
import SofizPay  from 'sofizpay-sdk-js'; // Adjust if using local file

export default function Checkout() {
  const [sdk, setSdk] = useState(null);
  const [error, setError] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [formData, setFormData] = useState({
    full_name: 'Ahmed',
    phone: '+20123456789', // Default for CIB (Egypt)
    email: 'ahmed@sofizpay.com',
    amount: 150, // EGP for CIB, adjust for DZD
    memo: 'Test Payment',
  });

  // Initialize SDK
  useEffect(() => {
    try {
      const sofizpay = new SofizPay({
        merchantId: process.env.NEXT_PUBLIC_SOFIZPAY_MERCHANT_ID,
        apiKey: process.env.NEXT_PUBLIC_SOFIZPAY_API_KEY,
        sandbox: true,
      });
      setSdk(sofizpay);
      console.log('SofizPay SDK initialized');
    } catch (err) {
      setError('Failed to initialize SDK');
      console.error('SDK init error:', err);
    }
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle payment submission
  const handlePayment = async (paymentMethod) => {
    if (!sdk) {
      setError('SDK not loaded');
      console.error('SDK not loaded');
      return;
    }

    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentMethod,
          currency: paymentMethod === 'CIB' ? 'EGP' : 'DZD',
          return_url: 'http://localhost:3000/payment-success',
        }),
      });
      const bankResult = await response.json();
      if (bankResult.success) {
        setPaymentUrl(bankResult.url);
        console.log(`${paymentMethod} Payment URL:`, bankResult.url);
        window.location.href = bankResult.url; // Redirect to SofizPay
      } else {
        setError(bankResult.error);
        console.error(`${paymentMethod} Payment error:`, bankResult.error);
      }
    } catch (err) {
      setError('Failed to process payment');
      console.error('Payment processing error:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Manual Test Checkout</h1>
      <p>Test CIB and Carte Edhabhya payments with the SofizPay SDK.</p>
      <form>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Full Name:
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Phone:
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder={formData.paymentMethod === 'CIB' ? '+20123456789' : '+213123456789'}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Amount:
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Memo:
            <input
              type="text"
              name="memo"
              value={formData.memo}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
      </form>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={() => handlePayment('CIB')}
          style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Test CIB Payment
        </button>
        <button
          onClick={() => handlePayment('Edhabhya')}
          style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Test Carte Edhabhya Payment
        </button>
      </div>
      {error && (
        <p style={{ color: 'red', marginTop: '15px' }} data-testid="error-message">
          {error}
        </p>
      )}
      {paymentUrl && (
        <p style={{ marginTop: '15px' }} data-testid="payment-url">
          Redirecting to: <a href={paymentUrl}>{paymentUrl}</a>
        </p>
      )}
    </div>
  );
}