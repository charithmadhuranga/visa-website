// Initialize Stripe
const stripe = Stripe('pk_test_51RsMZSRVw7PRnjqbkksaetbwSLiwyoztKubDMGigH2bO7Yb3ohQkrXwqEiM4qnwNEInQx6mPCnNpthLmWjwbziGx00cBnRkT0S'); // Replace with your actual Stripe publishable key
const elements = stripe.elements();

// Package configurations
const packages = {
    basic: {
        name: 'Basic Consultation',
        price: 99,
        features: [
            'Initial consultation (1 hour)',
            'Visa eligibility assessment',
            'Document checklist',
            'Email support (7 days)',
            'Basic application guidance'
        ]
    },
    standard: {
        name: 'Standard Package',
        price: 299,
        features: [
            'Everything in Basic',
            'Full application preparation',
            'Document review & optimization',
            'Application submission support',
            'Priority email support (30 days)',
            'Follow-up assistance',
            'Interview preparation guide'
        ]
    },
    premium: {
        name: 'Premium Service',
        price: 599,
        features: [
            'Everything in Standard',
            'Dedicated case manager',
            'Unlimited consultations',
            'Document translation services',
            'Priority processing support',
            'Mock interview sessions',
            'Post-approval guidance',
            '90-day support period'
        ]
    }
};

// Load package details from localStorage
function loadPackageDetails() {
    const selectedPackage = localStorage.getItem('selectedPackage');
    const packagePrice = localStorage.getItem('packagePrice');
    
    if (!selectedPackage || !packagePrice) {
        // Redirect to pricing page if no package selected
        window.location.href = 'pricing.html';
        return;
    }
    
    const packageData = packages[selectedPackage];
    if (!packageData) {
        window.location.href = 'pricing.html';
        return;
    }
    
    // Update package details
    document.getElementById('packageDetails').innerHTML = `
        <h3 class="text-xl font-bold mb-2">${packageData.name}</h3>
        <div class="text-3xl font-bold">$${packageData.price}</div>
        <p class="opacity-90">One-time payment</p>
    `;
    
    // Update features list
    const featuresList = document.getElementById('packageFeatures');
    featuresList.innerHTML = packageData.features.map(feature => 
        `<li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i>${feature}</li>`
    ).join('');
}

// Create Stripe card element
const cardElement = elements.create('card', {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
});

cardElement.mount('#card-element');

// Handle real-time validation errors from the card Element
cardElement.on('change', function(event) {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
        displayError.textContent = event.error.message;
        document.getElementById('card-element').classList.add('border-red-500');
    } else {
        displayError.textContent = '';
        document.getElementById('card-element').classList.remove('border-red-500');
    }
});

// Handle form submission
const form = document.getElementById('payment-form');
const submitButton = document.getElementById('submit-button');
const buttonText = document.getElementById('button-text');
const spinner = document.getElementById('spinner');

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    submitButton.disabled = true;
    buttonText.textContent = 'Processing...';
    spinner.classList.remove('hidden');
    
    // Hide any previous error messages
    document.getElementById('errorMessage').classList.add('hidden');
    
    // Get form data
    const formData = new FormData(form);
    const paymentData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        package: localStorage.getItem('selectedPackage'),
        amount: localStorage.getItem('packagePrice')
    };
    
    try {
        // Process payment using client-side Stripe
        const paymentIntent = await processPayment(paymentData);
        
        // Payment successful
        showSuccessMessage();
        
        // Store payment confirmation
        localStorage.setItem('paymentId', paymentIntent.id || 'pi_' + Math.random().toString(36).substr(2, 9));
        localStorage.setItem('paymentStatus', 'success');
        localStorage.setItem('customerData', JSON.stringify(paymentData));
        
        // Redirect to success page after 2 seconds
        setTimeout(() => {
            window.location.href = 'payment-success.html';
        }, 2000);
        
    } catch (error) {
        console.error('Payment error:', error);
        showErrorMessage(error.message);
    } finally {
        // Reset button state
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    }
});

// Client-side Stripe payment processing for GitHub Pages
async function processPayment(paymentData) {
    try {
        // Check if we're in development/local environment
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            // For local testing, simulate successful payment
            console.log('Local environment - simulating payment success');
            return await simulateLocalPayment(paymentData);
        }
        
        // Create payment method
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: `${paymentData.firstName} ${paymentData.lastName}`,
                email: paymentData.email,
                phone: paymentData.phone,
            },
        });

        if (paymentMethodError) {
            throw new Error(paymentMethodError.message);
        }

        // For GitHub Pages, we'll use Stripe's client-side payment processing
        // This creates a payment intent directly on the client side
        const { error: paymentIntentError, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret: await createPaymentIntent(paymentData),
            confirmParams: {
                return_url: window.location.origin + '/payment-success.html',
                payment_method: paymentMethod.id,
            },
        });

        if (paymentIntentError) {
            throw new Error(paymentIntentError.message);
        }

        return paymentIntent;

    } catch (error) {
        throw new Error(error.message);
    }
}

// Simulate local payment for testing
async function simulateLocalPayment(paymentData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockPaymentIntent = {
                id: 'pi_' + Math.random().toString(36).substr(2, 9),
                status: 'succeeded',
                amount: paymentData.amount * 100,
                metadata: {
                    customer_name: `${paymentData.firstName} ${paymentData.lastName}`,
                    customer_email: paymentData.email,
                    package_type: paymentData.package
                }
            };
            console.log('Local payment simulation successful:', mockPaymentIntent);
            resolve(mockPaymentIntent);
        }, 2000);
    });
}

// Create payment intent using Stripe's client-side API
async function createPaymentIntent(paymentData) {
    // Check if we're in development/local environment
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
        // For local testing, simulate payment intent creation
        console.log('Local environment detected - using demo payment intent');
        return await createDemoPaymentIntent(paymentData);
    }
    
    // Use Netlify serverless function for production
    try {
        const response = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        return clientSecret;

    } catch (error) {
        console.error('Payment intent creation failed:', error);
        throw new Error('Payment service temporarily unavailable. Please try again.');
    }
}

// Demo payment intent creation for local testing
async function createDemoPaymentIntent(paymentData) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Generate a mock client secret for testing
            const mockClientSecret = 'pi_' + Math.random().toString(36).substr(2, 9) + '_secret_' + Math.random().toString(36).substr(2, 9);
            console.log('Demo payment intent created for:', paymentData);
            resolve(mockClientSecret);
        }, 1000);
    });
}



function showSuccessMessage() {
    document.getElementById('successMessage').classList.remove('hidden');
}

function showErrorMessage(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').classList.remove('hidden');
}

// Form validation
function validateForm() {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        
        if (!value) {
            field.classList.add('border-red-500');
            isValid = false;
        } else {
            field.classList.remove('border-red-500');
        }
    });
    
    // Email validation
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        document.getElementById('email').classList.add('border-red-500');
        isValid = false;
    }
    
    // Terms and conditions validation
    const terms = document.getElementById('terms');
    if (!terms.checked) {
        isValid = false;
        // Add visual feedback for terms checkbox
        terms.parentElement.classList.add('text-red-500');
    } else {
        terms.parentElement.classList.remove('text-red-500');
    }
    
    if (!isValid) {
        showErrorMessage('Please fill in all required fields correctly and accept the terms.');
    }
    
    return isValid;
}

// Real-time form validation
document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
    input.addEventListener('blur', function() {
        const value = this.value.trim();
        if (!value) {
            this.classList.add('border-red-500');
        } else {
            this.classList.remove('border-red-500');
        }
        
        // Email validation
        if (this.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.classList.add('border-red-500');
            } else {
                this.classList.remove('border-red-500');
            }
        }
    });
});

// Terms checkbox validation
document.getElementById('terms').addEventListener('change', function() {
    if (this.checked) {
        this.parentElement.classList.remove('text-red-500');
    } else {
        this.parentElement.classList.add('text-red-500');
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadPackageDetails();
});

// Add some security features
document.addEventListener('DOMContentLoaded', function() {
    // Prevent form resubmission
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
    
    // Add CSRF protection (in production, implement proper CSRF tokens)
    const csrfToken = Math.random().toString(36).substr(2, 15);
    localStorage.setItem('csrfToken', csrfToken);
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        simulatePayment,
        packages
    };
} 