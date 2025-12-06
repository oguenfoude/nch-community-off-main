import SofizPaySDK from 'sofizpay-sdk-js';

const sdk = new SofizPaySDK();

// Send payment
const result = await sdk.submit({
    secretkey: 'YOUR_SECRET_KEY',
    destinationPublicKey: 'RECIPIENT_PUBLIC_KEY',
    amount: 100,
    memo: 'Payment description'
});

console.log(result.success ? 'Payment sent!' : result.error);