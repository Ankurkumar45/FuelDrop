import { useCallback, useState } from "react";
import { paymentService } from "../services/api";

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

export default function useRazorpay() {
    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState(null);

    const initiatePayment = useCallback(async ({
        orderId,
        userName,
        userEmail,
        userPhone,
        onSuccess,
        onFailure,
    }) => {
        setPaying(true);
        setPayError(null);

        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                const msg = 'Failed to load Razorpay SDK. Please check your connection.';
                setPayError(msg);
                onFailure?.(msg);
                return;
            }

            const { data } = await paymentService.createOrder(orderId);
            const { razorpayOrderId, amount, currency, keyId } = data;

            if (!keyId || !razorpayOrderId) {
                throw new Error("Invalid payment configuration received from server.");
            }

            const options = {
                key: keyId,
                amount,
                currency: currency || "INR",
                name: "FuelDrop",
                description: "Fuel Delivery Payment",
                image: '',
                order_id: razorpayOrderId,

                prefill: {
                    name: userName || '',
                    email: userEmail || '',
                    contact: userPhone || '',
                },

                notes: { orderId },

                theme: {
                    color: "#f97316",
                },

                handler: async (response) => {
                    try {
                        await paymentService.verifyPayment(orderId, {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        setPaying(false);
                        onSuccess?.(response.razorpay_payment_id);
                    } catch (verifyError) {
                        const msg = verifyError.response?.data?.message || verifyError.message || "Payment verification failed.";
                        setPaying(false);
                        setPayError(msg);
                        onFailure?.(msg);
                    }
                },

                modal: {
                    ondismiss: () => {
                        const msg = "Payment process was cancelled by the user.";
                        setPaying(false);
                        setPayError(msg);
                        onFailure?.(msg);
                    }
                },

                escape: true,
                animation: true,
                backdropclose: false,
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (response) => {
                const msg = response.error?.description || "Payment failed. Please try again.";
                setPaying(false);
                setPayError(msg);
                onFailure?.(msg);
            });

            rzp.open();
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "An unexpected error occurred during payment.";
            setPayError(msg);
            setPaying(false);
            onFailure?.(msg);
            return;
        }
    }, []);

    return { initiatePayment, paying, payError };
}