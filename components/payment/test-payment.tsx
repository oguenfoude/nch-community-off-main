import { useState, useEffect } from 'react';
import SofizPaySDK from 'sofizpay-sdk-js';

export default function WalletComponent() {
    const [sdk] = useState(() => new SofizPaySDK());
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const loadBalance = async () => {
            const result = await sdk.getBalance('YOUR_PUBLIC_KEY');
            if (result.success) setBalance(result.balance);
        };
        loadBalance();
    }, []);

    const sendPayment = async () => {
        const result = await sdk.submit({
            secretkey: 'YOUR_SECRET_KEY',
            destinationPublicKey: 'RECIPIENT_KEY',
            amount: 25,
            memo: 'React payment'
        });

        if (result.success) {
            alert('Payment sent successfully!');
            // Reload balance
        }
    };

    return (
        <div>
            <h2>Balance: {balance}</h2>
            <button onClick={sendPayment}>Send Payment</button>
        </div>
    );

}

