# Təməl — construction materials marketplace (concept demo)

A clickable concept for a construction-materials classifieds marketplace in Azerbaijan: stores and
private sellers post listings (photo, price per unit, specs), buyers search, filter, use a
consumption calculator, put items from several sellers into one cart and place an order that is
split per seller. The site owner moderates everything from an admin panel.

All stores, listings, prices and orders are fictional sample data. Product photos are generated.

## What works in the demo

- Home: search (text, category, city, price range, new/used), category tiles with live counts,
  "posted today" feed, VIP listings, discounts, stores.
- Search results with sidebar filters (seller type, delivery, on sale, category) and sorting.
- Listing page: gallery, unit price, quantity stepper (pack-aware), seller card, specs, similar items.
- Consumption calculator per material (cement, plaster, adhesive, bricks, blocks, paint, tiles,
  laminate, drywall, insulation, roofing, length goods). Every step of the math is shown and the
  wall or floor is drawn to scale and "laid" with the material.
- Cart grouped by seller, checkout with delivery/pick-up, orders split per seller.
- Post a listing: photos (compressed in the browser), live preview of the card as the buyer sees it.
- Admin: overview (KPIs, listings per category, recent orders), listings moderation (VIP, hide,
  delete), orders with status, sellers with block/unblock, demo reset.

Data lives in the visitor's browser (`localStorage`); nothing is sent anywhere.

## Run

Static files, no build step:

```
python3 -m http.server 8731
```

then open `http://localhost:8731/`.

## Production plan (not in the demo)

Backend and database (orders, listings, users), seller sign-in by SMS, image storage, moderation
queue, order notifications to sellers (Telegram/SMS), real domain and analytics.
