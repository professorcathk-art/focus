# 💳 Payment Integration Guide

## Overview

This guide covers how to add payment/subscription functionality to your Focus app. There are several approaches depending on your needs.

---

## 🎯 Recommended Options

### Option 1: RevenueCat (Recommended for Mobile Apps)

**Best for:** iOS/Android apps with subscriptions

**Why RevenueCat:**
- ✅ Handles App Store/Play Store subscriptions automatically
- ✅ Cross-platform (iOS + Android)
- ✅ Free tier available
- ✅ Easy integration with React Native
- ✅ Handles receipt validation
- ✅ Analytics and user management

**Setup Steps:**

1. **Install RevenueCat SDK:**
   ```bash
   npm install react-native-purchases
   ```

2. **Create RevenueCat Account:**
   - Go to: https://www.revenuecat.com/
   - Sign up for free account
   - Create a project
   - Get your API key

3. **Configure Products:**
   - In RevenueCat dashboard, add products:
     - Monthly subscription: `focus_monthly`
     - Yearly subscription: `focus_yearly`
     - Lifetime: `focus_lifetime`

4. **Set up App Store Connect:**
   - Create in-app purchases in App Store Connect
   - Link them to RevenueCat products

5. **Add to Your App:**
   ```typescript
   import Purchases from 'react-native-purchases';
   
   // Initialize
   await Purchases.configure({
     apiKey: 'your_revenuecat_api_key',
   });
   
   // Get offerings
   const offerings = await Purchases.getOfferings();
   
   // Purchase
   const purchaseResult = await Purchases.purchasePackage(package);
   
   // Check subscription status
   const customerInfo = await Purchases.getCustomerInfo();
   const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
   ```

**Cost:** Free up to $10k/month revenue, then 1% of revenue

---

### Option 2: Stripe (For Web Payments)

**Best for:** Web payments, one-time purchases, custom payment flows

**Why Stripe:**
- ✅ Most flexible payment solution
- ✅ Supports subscriptions, one-time payments
- ✅ Great for web apps
- ✅ Mobile SDKs available
- ✅ International support

**Setup Steps:**

1. **Install Stripe SDK:**
   ```bash
   npm install @stripe/stripe-react-native
   ```

2. **Create Stripe Account:**
   - Go to: https://stripe.com/
   - Sign up
   - Get your publishable key and secret key

3. **Set up Backend:**
   - Create payment endpoints in your backend
   - Use Stripe API to create payment intents
   - Handle webhooks for subscription events

4. **Add to Your App:**
   ```typescript
   import { useStripe } from '@stripe/stripe-react-native';
   
   const { initPaymentSheet, presentPaymentSheet } = useStripe();
   
   // Initialize payment sheet
   await initPaymentSheet({
     merchantDisplayName: 'Focus App',
     paymentIntentClientSecret: clientSecret,
   });
   
   // Present payment sheet
   const { error } = await presentPaymentSheet();
   ```

**Cost:** 2.9% + $0.30 per transaction

---

### Option 3: In-App Purchases (Native)

**Best for:** Simple iOS/Android subscriptions

**Why Native:**
- ✅ No third-party fees (only App Store/Play Store fees)
- ✅ Direct integration
- ✅ Full control

**Setup Steps:**

1. **For iOS:**
   ```bash
   npm install react-native-iap
   ```

2. **Configure in App Store Connect:**
   - Create subscription groups
   - Add subscription products
   - Set pricing

3. **Add to Your App:**
   ```typescript
   import { initConnection, getProducts, purchaseProduct } from 'react-native-iap';
   
   // Initialize
   await initConnection();
   
   // Get products
   const products = await getProducts({ skus: ['focus_monthly'] });
   
   // Purchase
   const purchase = await purchaseProduct({ sku: 'focus_monthly' });
   ```

**Cost:** 15-30% to Apple/Google (standard App Store fees)

---

## 🏗️ Implementation Architecture

### Recommended: RevenueCat + Backend Verification

```
┌─────────────┐
│   Mobile    │
│     App     │
└──────┬──────┘
       │
       │ 1. User purchases subscription
       ▼
┌─────────────┐
│ RevenueCat  │
│   (SDK)     │
└──────┬──────┘
       │
       │ 2. Validate receipt
       ▼
┌─────────────┐
│   Backend   │
│   (Vercel)  │
└──────┬──────┘
       │
       │ 3. Update user subscription status
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │
└─────────────┘
```

---

## 📋 Step-by-Step: RevenueCat Integration

### Step 1: Install Dependencies

```bash
npm install react-native-purchases
```

### Step 2: Create Subscription Table in Supabase

```sql
-- Add subscription table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'expired', 'cancelled'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add premium flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
```

### Step 3: Create Backend Endpoint

**File:** `backend/routes/subscriptions.js`

```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const supabase = require('../lib/supabase');
const Purchases = require('react-native-purchases');

// Verify subscription status
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { receipt } = req.body;
    
    // Verify with RevenueCat
    const customerInfo = await Purchases.verifyReceipt(receipt);
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    
    // Update database
    await supabase
      .from('users')
      .update({ is_premium: isPremium })
      .eq('id', req.user.id);
    
    res.json({ isPremium });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
});
```

### Step 4: Add to Frontend

**File:** `src/hooks/use-subscription.ts`

```typescript
import { useState, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { apiClient } from '@/lib/api-client';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    try {
      await Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
      });
      
      const customerInfo = await Purchases.getCustomerInfo();
      setIsPremium(customerInfo.entitlements.active['premium'] !== undefined);
    } catch (error) {
      console.error('RevenueCat init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseSubscription = async (packageId: string) => {
    try {
      const offerings = await Purchases.getOfferings();
      const package = offerings.current?.availablePackages.find(p => p.identifier === packageId);
      
      if (!package) throw new Error('Package not found');
      
      const { customerInfo } = await Purchases.purchasePackage(package);
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
      
      // Verify with backend
      await apiClient.post('/subscriptions/verify', {
        receipt: customerInfo.originalPurchaseDate,
      });
      
      setIsPremium(isPremium);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return { isPremium, isLoading, purchaseSubscription };
}
```

### Step 5: Add Premium Features

**Example:** Limit free users to 10 ideas

```typescript
const { isPremium } = useSubscription();
const { ideas } = useIdeas();

if (!isPremium && ideas.length >= 10) {
  // Show upgrade prompt
  return <UpgradePrompt />;
}
```

---

## 💰 Pricing Strategy Recommendations

### Free Tier:
- ✅ 10 ideas per month
- ✅ Basic categories
- ✅ Search functionality

### Premium ($4.99/month or $39.99/year):
- ✅ Unlimited ideas
- ✅ Advanced categories
- ✅ Voice recording (when implemented)
- ✅ Export functionality
- ✅ Priority support

---

## 🔒 Security Best Practices

1. **Always verify on backend:**
   - Never trust client-side subscription status
   - Verify receipts server-side

2. **Use webhooks:**
   - RevenueCat/Stripe send webhooks for subscription events
   - Update database when subscriptions change

3. **Encrypt sensitive data:**
   - Store API keys in environment variables
   - Never expose secret keys in frontend

---

## 📚 Resources

- **RevenueCat Docs:** https://docs.revenuecat.com/
- **Stripe Docs:** https://stripe.com/docs
- **React Native IAP:** https://github.com/dooboolab/react-native-iap

---

## 🚀 Quick Start Checklist

- [ ] Choose payment provider (RevenueCat recommended)
- [ ] Create account and get API keys
- [ ] Install SDK
- [ ] Create subscription products
- [ ] Set up backend verification endpoint
- [ ] Add subscription check to frontend
- [ ] Test purchases in sandbox mode
- [ ] Submit for App Store/Play Store review

---

## 💡 Next Steps

1. **Start with RevenueCat** - Easiest for mobile apps
2. **Test in sandbox** - Use test accounts before going live
3. **Add premium features** - Gradually unlock features for premium users
4. **Monitor analytics** - Track conversion rates and revenue

Need help implementing? Let me know which option you prefer!

