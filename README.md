# Remix of Remix of Remix of Remix of Remix of Pastel Play Emporium

Upgrade the existing Play Town website into a complete, professional, production-ready toy store e-commerce website.

Use the downloaded Claude website as the **main visual design reference**. Preserve its Cute Pastel design, layout, spacing, typography, cards, animations and overall visual quality.

The website must also have a complete online ordering system similar in functionality to established Pakistani toy e-commerce stores.

IMPORTANT:
Do not only create UI mockups.
All buttons, forms, cart actions, checkout actions and customer flows must actually work.

---

# 1. PRODUCT SYSTEM

Create a proper product system.

Each product must support:

* Product name
* Product images
* Price
* Sale price
* Original price
* Discount percentage
* SKU
* Category
* Subcategory
* Age range
* Brand
* Description
* Specifications
* What's included
* Stock status
* Stock quantity
* Featured status
* New arrival status
* Best seller status

Product cards must have:

* View Product
* Add to Cart
* Buy Now
* Wishlist
* Correct price
* Sale badge when applicable

---

# 2. SHOPPING CART

Build a fully functional cart.

Customers must be able to:

* Add products
* Remove products
* Increase quantity
* Decrease quantity
* See subtotal
* See delivery charges
* See discount
* See final total
* Apply coupon
* Remove coupon
* Continue shopping
* Proceed to checkout

Cart should persist if the customer refreshes the page.

Prevent customers from ordering quantities greater than available stock.

---

# 3. CHECKOUT

Create a professional multi-step checkout.

Step 1:
Customer Information

Fields:

Full Name
Phone Number
Email
Complete Address
City
Postal Code
Order Notes

Step 2:
Delivery

Show delivery address and delivery charges.

Step 3:
Payment Method

Give customers these options:

### Cash on Delivery

Customer pays when the order arrives.

### Card Payment

Allow payment through a real Pakistani payment gateway once the merchant credentials are connected.

IMPORTANT:
Do NOT fake successful card payments.

If a payment gateway is not configured yet, clearly structure the integration so real credentials can be added later.

Do not store raw card numbers, CVV or sensitive card information in the website database.

Use the payment provider's secure hosted/embedded checkout.

---

# 4. PAYMENT FLOW

For card payment:

Customer selects Card Payment.

Customer is redirected to / shown the secure payment gateway.

After successful payment:

* Mark order as Paid
* Generate order number
* Save payment reference
* Reduce product stock
* Show order confirmation
* Send customer to order confirmation page

If payment fails:

* Do NOT create a paid order
* Show a clear payment failed message
* Allow customer to retry payment

If payment is cancelled:

* Return customer to checkout
* Keep their cart/order information

For COD:

* Mark payment status as Pending / COD
* Create the order
* Reduce stock only according to the configured order policy
* Show confirmation

---

# 5. ORDER CONFIRMATION

After placing an order, show:

**Order Confirmed! 🎉**

Order Number:
PT-XXXXXX

Show:

* Products
* Quantities
* Subtotal
* Delivery
* Discount
* Total
* Payment method
* Delivery address
* Order status

Buttons:

**Track My Order**

**Continue Shopping**

Also provide:

**Order via WhatsApp**

where appropriate.

---

# 6. ORDER TRACKING

Create a customer order tracking page.

Customer can enter:

Order Number
Phone Number

Show order status:

Order Placed
Order Confirmed
Processing
Packed
Shipped
Out for Delivery
Delivered
Cancelled

Use a clean visual progress timeline.

---

# 7. CUSTOMER ACCOUNT

Create an optional customer account system.

Customers should be able to:

* Sign up
* Log in
* Log out
* View previous orders
* View order details
* Track orders
* Manage addresses
* Manage profile
* View wishlist

Guest checkout must still be available.

Do NOT force customers to create an account before ordering.

---

# 8. DISCOUNT / COUPON SYSTEM

Build a proper coupon system.

Coupons should support:

* Percentage discount
* Fixed amount discount
* Expiry date
* Minimum order value
* Maximum discount
* Usage limits
* Active/inactive status

Example coupon:

**WELCOME10**

10% off for eligible customers.

Do not hard-code fake discounts everywhere.

---

# 9. CARD PAYMENT → NEXT ORDER 10% DISCOUNT

Create a customer loyalty rule:

If a customer successfully completes an order using **Card Payment**, they become eligible for a **10% discount on their next order**.

Important:

* Discount should only activate after successful card payment.
* It should NOT activate for failed payments.
* It should NOT activate for cancelled orders.
* It should NOT activate for COD orders.
* The 10% discount should be linked to the customer's account/verified phone or email.
* Generate a unique coupon/token for the customer.
* Coupon can be used once.
* Clearly show the customer after payment:

**🎉 Card payment bonus!**

**Get 10% OFF your next order.**

Button:

**View My 10% Discount**

Do not automatically apply it to the current order.

Make it available for the customer's NEXT eligible order.

---

# 10. ADMIN ORDER MANAGEMENT

Create a secure admin dashboard.

Admin should be able to:

### Orders

View all orders.

Filter by:

* New
* Confirmed
* Processing
* Packed
* Shipped
* Out for Delivery
* Delivered
* Cancelled

View:

* Customer information
* Products
* Total
* Payment method
* Payment status
* Order date
* Delivery address
* Order notes

Admin can update order status.

---

# 11. PRODUCT MANAGEMENT

Admin should be able to:

* Add product
* Edit product
* Delete product
* Upload images
* Change price
* Change sale price
* Update stock
* Change category
* Change age group
* Mark as featured
* Mark as new
* Mark as best seller

Changes should appear on the storefront.

---

# 12. INVENTORY

Create proper stock handling.

Show:

In Stock
Low Stock
Out of Stock

Prevent overselling.

When an order is successfully processed according to the selected payment/order policy:

Reduce stock automatically.

When an order is cancelled:

Restore stock where appropriate.

---

# 13. DELIVERY

Create configurable delivery settings.

Admin should be able to configure:

* Delivery fee
* Free delivery threshold
* Different city delivery charges if needed
* Delivery availability

Do not hard-code delivery prices if they may change.

---

# 14. WHATSAPP

Keep a floating WhatsApp button.

Product pages should have:

**Ask on WhatsApp**

The message should automatically include the product name.

After checkout, optionally provide:

**Send Order Details on WhatsApp**

with:

Order number
Products
Total
Customer name

Do not expose sensitive payment information.

---

# 15. SEARCH

Make search fully functional.

Search should find products by:

* Product name
* Category
* Brand
* Keywords
* SKU

Include a proper empty state when no products match.

---

# 16. FILTERS

Shop page filters must actually work.

Filters:

Category
Age
Price
Brand
Availability
Rating

Sorting:

Popular
Newest
Price Low → High
Price High → Low

---

# 17. WISHLIST

Wishlist must work.

Customers can:

* Add product
* Remove product
* View wishlist

Guests can use local wishlist storage.

Logged-in customers can have their wishlist saved to their account.

---

# 18. MOBILE

The complete ordering experience must work perfectly on mobile.

Especially:

* Add to cart
* Cart
* Checkout
* Payment
* Order confirmation
* Order tracking
* Account
* WhatsApp

Make buttons large enough for touch.

---

# 19. SECURITY

Follow secure e-commerce practices.

Never store:

* Card numbers
* CVV
* Card PINs
* Payment passwords

Use secure authentication.

Protect admin routes.

Validate checkout data on the server.

Do not trust prices or discount values sent from the browser.

Recalculate:

* Product prices
* Discounts
* Delivery
* Final total

on the server before creating an order.

Prevent duplicate orders from repeated button clicks.

---

# 20. DESIGN

The entire ordering system must visually match the downloaded Claude reference.

Keep the Cute Pastel design:

Baby Blue #CFEFFF
Blush Pink #FFD6E3
Soft Lilac #E5D9FF
Butter Yellow #FFF0B8
Soft Peach #FFE0CC
Cream White #FFFDF9
Dark Navy #263248

The checkout, cart, account and admin interfaces should use the same design system.

Do not create an ugly generic dashboard.

---

# 21. BUTTON FUNCTIONALITY

Every visible button must either:

1. Perform its intended action,
2. Navigate to a real page,
3. Open the appropriate modal,
4. Submit valid information,
5. Or be removed.

There must be NO fake buttons.

Test:

* Navbar links
* Search
* Categories
* Product cards
* Add to cart
* Buy now
* Wishlist
* Cart
* Checkout
* COD
* Card payment
* Coupons
* Order confirmation
* Order tracking
* Account
* WhatsApp
* Admin actions

---

# 22. REAL PAYMENT GATEWAY ARCHITECTURE

Structure the payment system so that a real Pakistani payment provider can be connected using environment variables/secrets.

Do not put secret API keys in frontend code.

Create a clean payment service abstraction so the gateway can be changed later without rebuilding checkout.

For now, if actual gateway credentials are not available, clearly show the integration as "payment gateway configuration required" rather than pretending that cards are working.

---

# 23. FINAL QUALITY CHECK

Before finishing:

* Test the complete customer journey.
* Test guest checkout.
* Test logged-in checkout.
* Test COD.
* Test card-payment flow architecture.
* Test failed payment handling.
* Test coupons.
* Test the 10% next-order card-payment reward.
* Test inventory.
* Test order tracking.
* Test mobile checkout.
* Test admin order management.
* Test all buttons.
* Fix console errors.
* Fix broken links.
* Fix responsive issues.

The final result should feel like a **real Pakistani toy e-commerce store**, not a UI prototype.

PRIORITY:

1. Functional online ordering
2. Secure checkout/payment architecture
3. Reliable cart and inventory
4. Easy customer experience
5. Claude reference design
6. Cute Pastel visual identity
7. Mobile responsiveness

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://delight-delivery-store.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fdeaf65a-dee3-40c9-85aa-5b4aa34e45d4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
