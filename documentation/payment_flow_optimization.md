The payment and onboarding flow has been optimized to request sensitive banking information only at the final logical step.

### Changes Implemented

1.  **Selling Flow (`ListingForm`):**
    -   Added a check during the "Publicar" (Submit) action.
    -   If the item is a paid product (`price > 0`) and the user has not fully onboarded with Stripe (checked against `stripe_accounts` table), the submission is paused.
    -   A dialog appears explaining that banking details are required to receive payments.
    -   The dialog provides a direct "Configurar cuenta bancaria" button that triggers the Stripe Connect flow.
    -   This ensures users can fill out the entire product form first, and only deal with banking setup when they are ready to publish.

2.  **Flat Listings (`NewFlatPage`):**
    -   Confirmed that valid flat listings (category "pisos") do not trigger this check.
    -   Flat listings continue to bypass Stripe requirements, as requested ("para pisos no tienes que poder pagar por stripe ni nada").

3.  **Buying Flow (`CheckoutModal`):**
    -   Buying flow remains streamlined: The "Comprar" button opens the checkout modal immediately.
    -   Banking details (card info) are entered directly in the final payment modal via Stripe Elements.

### User Impact
-   **Sellers:** Improved UX by not blocking entry to the "Sell" page. Sellers encounter the requirement only when they commit to selling a paid item.
-   **Buyers:** Friction-less flow until the actual point of purchase.
