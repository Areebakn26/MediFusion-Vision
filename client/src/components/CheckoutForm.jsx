import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

const CheckoutForm = ({ onSuccess, amount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/patient/appointments',
            },
            redirect: 'if_required',
        });

        if (error) {
            // Stripe validation errors or network errors
            if (error.type === 'card_error' || error.type === 'validation_error') {
                setMessage(error.message);
            } else {
                setMessage('An unexpected error occurred. Please try again.');
            }
            console.error('[PAYMENT ERROR]', error);
            setIsLoading(false);
            return;
        }

        if (paymentIntent) {
            switch (paymentIntent.status) {
                case 'succeeded':
                    // Payment completed immediately (most cards)
                    onSuccess(paymentIntent);
                    break;
                case 'processing':
                    // Payment is being processed (bank transfers etc.)
                    setMessage('⏳ Payment is processing. Your appointment will be confirmed shortly.');
                    // Still call onSuccess to book the appointment optimistically
                    onSuccess(paymentIntent);
                    break;
                case 'requires_payment_method':
                    // Card was declined
                    setMessage('Payment was declined. Please try a different payment method.');
                    break;
                case 'requires_action':
                    // 3D Secure authentication required
                    setMessage('Additional authentication is required. Please follow the prompts.');
                    break;
                default:
                    setMessage(`Payment status: ${paymentIntent.status}. Please contact support.`);
            }
        } else {
            setMessage('Payment could not be confirmed. Please try again.');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm">
                <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total to Pay</span>
                    <span className="text-green-600">Rs. {amount}</span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <PaymentElement
                    options={{
                        // Limit to card only to avoid redirect issues with Link/bank transfers in SPA
                        paymentMethodOrder: ['card'],
                        wallets: { applePay: 'never', googlePay: 'never' }
                    }}
                />
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-sm border ${message.startsWith('⏳')
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-red-50 border-red-200 text-red-600'
                    }`}>
                    {!message.startsWith('⏳') && '❌ '}{message}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200 mt-6"
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Payment...
                    </span>
                ) : (
                    <>💳 Pay Rs. {amount} Now</>
                )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
                🔒 Your payment is secured with Stripe encryption
            </p>
        </form>
    );
};

export default CheckoutForm;

