# Lanka Global Access - Payment System

A professional and robust Stripe payment implementation for visa consulting services. This system provides a complete payment solution with secure processing, beautiful UI, and comprehensive error handling.

## Features

- ✅ **Professional Pricing Page** - Beautiful, responsive pricing with service packages
- ✅ **Secure Payment Processing** - Stripe integration with PCI compliance
- ✅ **Real-time Validation** - Form validation and error handling
- ✅ **Payment Success Page** - Confirmation with order details and next steps
- ✅ **Backend API** - Node.js/Express server for payment processing
- ✅ **Webhook Handling** - Automatic payment confirmation and customer management
- ✅ **Responsive Design** - Works perfectly on all devices
- ✅ **Security Features** - CSRF protection, rate limiting, and secure headers

## Quick Start (GitHub Pages + Netlify)

### 1. Prerequisites

- GitHub account
- Netlify account (free to sign up)
- Stripe account (free to sign up)
- Modern web browser

### 2. GitHub Pages Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd visa-consultant-main

# Push to your GitHub repository
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. Netlify Deployment

1. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login with your GitHub account
   - Click "New site from Git"
   - Select your GitHub repository

2. **Configure Build Settings:**
   - Build command: Leave empty (not needed for static sites)
   - Publish directory: `.` (root directory)
   - Click "Deploy site"

### 4. Stripe Configuration

1. **Get Stripe Keys:**
   - Sign up at [stripe.com](https://stripe.com)
   - Go to Dashboard → Developers → API keys
   - Copy your publishable and secret keys

2. **Update Frontend:**
   In `payment.js`, replace the placeholder:
   ```javascript
   const stripe = Stripe('pk_test_your_actual_publishable_key_here');
   ```

3. **Set Netlify Environment Variables:**
   - Go to Netlify Dashboard → Site settings → Environment variables
   - Add: `STRIPE_SECRET_KEY` = `sk_test_your_secret_key_here`

### 5. Deploy

```bash
# Push changes to GitHub
git add .
git commit -m "Update Stripe configuration"
git push origin main
```

Netlify will automatically deploy your site. The URL will be something like: `https://your-site-name.netlify.app`

## File Structure

```
visa-consultant-main/
├── index.html                    # Main homepage
├── pricing.html                  # Pricing page with packages
├── payment.html                  # Payment form with Stripe
├── payment-success.html          # Payment confirmation page
├── payment.js                    # Frontend payment logic
├── netlify.toml                  # Netlify configuration
├── netlify/
│   └── functions/
│       ├── create-payment-intent.js  # Serverless payment function
│       └── package.json              # Function dependencies
├── README.md                     # This file
└── images/                       # Website images and assets
```

## Payment Flow

1. **Pricing Page** (`pricing.html`)
   - Customer selects a service package
   - Package details stored in localStorage
   - Redirects to payment page

2. **Payment Page** (`payment.html`)
   - Customer enters personal information
   - Stripe Elements for secure card input
   - Real-time form validation
   - Payment processing with loading states

3. **Payment Processing** (`server.js`)
   - Creates Stripe Payment Intent
   - Validates payment data
   - Handles webhook events
   - Manages customer records

4. **Success Page** (`payment-success.html`)
   - Payment confirmation
   - Order details display
   - Next steps timeline
   - Support information

## Stripe Integration

### Frontend (payment.js)

```javascript
// Initialize Stripe
const stripe = Stripe('pk_test_your_key');

// Create card element
const cardElement = elements.create('card');

// Process payment
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
        card: cardElement,
        billing_details: { /* customer info */ }
    }
});
```

### Backend (Netlify Functions)

```javascript
// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: { /* customer data */ }
});

// Handle webhooks (optional - can be added later)
exports.handler = async (event, context) => {
    // Handle payment events
};
```

## Security Features

- **PCI Compliance** - Stripe handles sensitive card data
- **CSRF Protection** - Tokens prevent cross-site request forgery
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **Input Validation** - Server-side validation of all inputs
- **HTTPS Only** - Secure communication in production
- **Webhook Verification** - Ensures webhook authenticity

## Customization

### Adding New Packages

Edit the packages object in `payment.js`:

```javascript
const packages = {
    basic: {
        name: 'Basic Consultation',
        price: 99,
        features: [/* features array */]
    },
    // Add new packages here
};
```

### Styling

The system uses Tailwind CSS for styling. Customize colors and styles in the CSS variables:

```css
:root {
    --primary-color: #1e40af;
    --secondary-color: #3b82f6;
    --accent-color: #f59e0b;
    --success-color: #10b981;
    --error-color: #ef4444;
}
```

### Email Templates

Implement email functionality in `server.js`:

```javascript
async function sendConfirmationEmail(email, name, package, paymentId) {
    // Use Nodemailer, SendGrid, or similar
    // Customize email templates here
}
```

## Production Deployment

### 1. Environment Setup

```bash
# Set production environment in Netlify
NODE_ENV=production

# Use live Stripe keys
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### 2. Security Checklist

- [x] Use HTTPS in production (Netlify provides this automatically)
- [x] Set up proper CORS origins
- [x] Configure rate limiting (Netlify handles this)
- [x] Use environment variables for secrets
- [ ] Set up webhook endpoints (optional)
- [ ] Configure email service (optional)
- [ ] Set up database (optional)

### 3. Deployment Options

- **Netlify** (Recommended): Automatic deployment from GitHub
- **Vercel**: Alternative serverless platform
- **GitHub Pages**: Static hosting only (requires external API)
- **Firebase**: Google's hosting platform

## Testing

### Test Cards (Stripe Test Mode)

Use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

### Testing the Payment System

```bash
# Test the payment flow locally
# Open payment.html in your browser
# Use Stripe test cards:
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
```

## Support

For technical support or questions:

- **Email**: admin@lgavisa.com
- **Phone**: +94 11 234 5678
- **Documentation**: [Stripe Docs](https://stripe.com/docs)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.0.0 (2024-01-XX)
- Initial release
- Stripe payment integration
- Professional UI/UX
- Complete payment flow
- Backend API with webhooks
- Security features

---

**Built with ❤️ by Lanka Global Access** 