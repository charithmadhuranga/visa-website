const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    // Enable CORS for GitHub Pages
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { firstName, lastName, email, phone, package, amount } = JSON.parse(event.body);

        // Validate required fields
        if (!firstName || !lastName || !email || !amount) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required fields'
                })
            };
        }

        // Validate amount
        const amountInCents = parseInt(amount * 100);
        if (amountInCents < 100) { // Minimum $1
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid amount'
                })
            };
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            metadata: {
                customer_name: `${firstName} ${lastName}`,
                customer_email: email,
                customer_phone: phone,
                package_type: package,
                service: 'Visa Consultation'
            },
            description: `Visa Consultation - ${package} Package`,
            receipt_email: email,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Log payment intent creation (for monitoring)
        console.log(`Payment intent created: ${paymentIntent.id} for ${email}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            })
        };

    } catch (error) {
        console.error('Error creating payment intent:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to create payment intent',
                details: error.message
            })
        };
    }
}; 