/* ============================================================
   Build stamp.

   Shown at the bottom of Settings and used as the service-worker cache
   name, so "which version are you on?" has an answer you can read off
   the screen instead of guessing.

   Bump BUILD whenever content is added — candies, decorations, tools —
   so returning players get a "what's new" notice for anything the
   update handed them.
   ============================================================ */

export const BUILD = '2026-07-29.9';

/** Content revision. Raising this re-checks everything level-gated. */
export const CONTENT_REV = 4;
