# 🍬 Lieke's Candy Design

A cosy candy-decorating shop game for phones. Customers walk in through the door,
place very specific orders, and you decorate the sweets exactly as asked to earn
coins, tips and five-star reviews.

Playable in any modern browser, installable as a PWA, and fully playable offline.
**No image files at all** — every candy, decoration, wrapper and the shop itself is
drawn live on `<canvas>`.

## Play it

Open `index.html` over HTTP (ES modules need a server):

```bash
npx http-server -p 8099 -c-1 .
# → http://127.0.0.1:8099
```

Or publish the folder to GitHub Pages and open it on your phone — "Add to Home
Screen" gives you a full-screen app.

## Languages

English and Dutch (Nederlands). The game guesses from your browser on first launch,
asks you to confirm, and you can switch any time under **More → Settings → Taal**.
Order sentences are generated per language with their own grammar, so Dutch orders
read naturally ("Ik wil graag een blauwe chocoladereep met een gouden lint").

## The loop

1. **Customers arrive** — they walk in through the shop door and queue at the
   counter. Each has a personality, patience meter, budget and favourite colours.
   Tap one in the shop or in the list below it.
2. **Decorate** — pick the candy, its colour and flavour, then drag decorations
   straight onto it. Tap a placed decoration to resize, rotate or delete it. Add
   packaging and pipe a personal message.
3. **Serve** — you are graded on candy type, colour, decorations (including their
   colours), packaging, message, tidiness and speed. 1–5 stars.
4. **Spend** — new decorations, shop upgrades, better packaging and whole new
   locations.

## What's in it

| System | Details |
| --- | --- |
| **Candy** | Chocolate bars, lollipops, bonbons, gummy bears, marshmallows, candy canes, chocolate hearts, cookies, gift boxes, donuts (event) |
| **Decorations** | 50+ across icing, sprinkles, ribbons, flowers, charms and stickers |
| **Rarity** | Common → Rare → Epic → Legendary → Mythic; epic and above are animated |
| **Colours** | 13, including gold, silver and rainbow with real metallic/gradient shading |
| **Packaging** | 10 wraps from a paper bag to a mythic crystal case |
| **Upgrades** | 11 tracks × 5 levels — counter, shelves, machines, table, register, waiting area, walls, floor, lighting, music, employee |
| **Locations** | Small Village → City Center → Beach → Christmas Market → Luxury Mall → Candy Festival |
| **Events** | Valentine's, Easter, Summer, Birthday Week, Halloween, Christmas — each with exclusive decorations and a payout bonus |
| **Modes** | Story queue, Endless, Speed, Challenge, Free Design, daily specials, VIP customers |
| **Meta** | Daily rewards with streaks, mystery boxes, daily + career missions, collection book, photo mode with PNG export, local leaderboards, combo streaks, shop satisfaction |

## How it is built

Plain ES modules. No build step, no dependencies, no bundler.

```
index.html            app shell
sw.js                 offline cache
styles/               design system + per-screen layout
src/
  core/
    utils.js          helpers, seeded RNG, tiny DOM builder
    state.js          save game, levelling, currency, event bus
    audio.js          procedural music + SFX (Web Audio, no files)
    fx.js             toasts, confetti, coin flights, sparkles
    i18n.js           EN/NL strings, content names, order grammar
  data/               candy, decorations, colours, customers,
                      upgrades, locations, events, missions
  game/
    orders.js         customer + order generation (only ever asks
                      for content the player actually owns)
    scoring.js        accuracy, stars, coins, tips, XP
  render/
    shade.js          gradients, gloss, specular, shape paths
    candyArt.js       the 10 candy base shapes
    decoArt.js        40+ decoration shapes, animated where rare
    candy.js          compositor: candy + decorations + wrap + text
    shop.js           the shop diorama and the customers in it
  ui/                 screens, router, modals, the design studio
```

Progress is saved to `localStorage` and can be exported/imported as a code from
Settings.

## Notes

- Orders are generated from what you own, so every request is completable.
- Patience only starts draining once a customer has finished walking to the counter.
- Rare decorations animate everywhere they appear: the tray, the store, the
  collection book and on the candy itself.
