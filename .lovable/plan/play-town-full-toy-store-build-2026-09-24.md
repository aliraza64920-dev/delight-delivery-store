# Play Town — Full Toy Store Build

Rebuild the Play Town site from the uploaded design (Cute Pastel palette, Baloo 2 + Nunito Sans, rounded cards, soft shadows) as a working online store backed by Lovable Cloud.

## What customers get
- **Home**: every section from the reference, now showing real products: hero, shop by category/age/budget, gift finder, best sellers, new arrivals, trust, store info, reviews.
- **Shop** (`/shop`): search by name, category, brand, keywords or SKU. Filters for category, age, price, brand, availability and rating. Sort by popular, newest, or price in either direction. A clear message when nothing matches.
- **Product page**: image gallery, sale/original price, discount badge, SKU, brand, age, specs, what's included, stock badge (In Stock / Low / Out), quantity limited to what's in stock, Add to Cart, Buy Now, Wishlist, Ask on WhatsApp (message includes the product name).
- **Cart**: add, remove and change quantity (up to available stock). Shows subtotal, delivery, discount and total, with apply/remove coupon. The cart is still there after a page refresh.
- **Checkout** in 3 steps: Customer info, Delivery (address plus the charge for the city), Payment (Cash on Delivery or Card). Guests can check out without an account.
- **Order confirmation** (`/order/PT-XXXXXX`): items, totals, payment, address, status, plus Track My Order, Continue Shopping and Send on WhatsApp buttons.
- **Track order** (`/track`): enter order number and phone to see a visual timeline from Placed to Delivered, or Cancelled.
- **Account** (optional): sign up/in/out, past orders, saved addresses, profile, a wishlist saved to the account, and "My Rewards" showing the 10% coupon.
- **Wishlist**: saved on the device for guests and to the account once signed in.
- Floating WhatsApp button on every page. Large buttons for phone use.

## Card payment and the 10% reward
- Card checkout goes through one payment layer that works with any gateway. The first gateway will be **Safepay** (a Pakistani hosted checkout), or another you choose. No card details ever touch our site.
- Until gateway keys are added, the Card option shows "Payment gateway configuration required" and can't be picked. Nothing pretends to succeed.
- The gateway's confirmation message is checked on our server before the order is marked Paid. Only then is stock reduced, the payment reference saved and the order confirmed.
- If a payment fails or is cancelled, no paid order is created. The customer returns to checkout with their cart intact and can try again.
- After a successful card payment, a one-time 10% coupon is created and linked to the customer's email/phone and account. The confirmation page shows "Card payment bonus! Get 10% OFF your next order" with a "View My 10% Discount" button. It is never applied to the current order and is never given for COD, failed or cancelled orders.

## Admin (`/admin`, admin role only)
- **Orders**: filter by status, see full details, change status. Cancelling returns items to stock.
- **Products**: add, edit and delete products, upload images, and set prices, stock, category, age and the featured/new/best-seller flags.
- **Coupons**: percent or fixed amount, expiry, minimum order, maximum discount, usage limit, on/off. WELCOME10 is included from the start.
- **Delivery settings**: base fee, free-delivery threshold, fees per city, delivery on/off.
- **COD stock policy**: choose whether stock is reduced when the order is placed or when it is confirmed.

## Technical details
- Cloud tables: products, product_images, categories, coupons, coupon_redemptions, orders, order_items, order_status_history, delivery_settings, city_rates, addresses, profiles, wishlists, user_roles (with a has_role function). Row-level security on every table, and each table has the grants it needs.
- Placing an order runs on the server: it validates input with zod, re-prices items from the database, re-checks the coupon and delivery fee, and reduces stock inside a database function so two buyers can't take the last item. An idempotency key stops duplicate orders from double clicks.
- Payment layer: a `PaymentProvider` interface (`createSession`, `verifyWebhook`) with a Safepay adapter that reads secrets on the server only. The webhook lives at `/api/public/payments/webhook` and checks the signature.
- Order lookup for guests requires both the order number and the phone number. Demo products and WELCOME10 are added through a migration.
- Storefront design tokens are mapped into the theme so the cart, checkout, account and admin pages all use the same pastel design.

## Needs from you later
- Gateway merchant keys (Safepay or your choice) to turn on card payments.
- The real WhatsApp number, store address and product catalogue. Placeholders will be used until then.
