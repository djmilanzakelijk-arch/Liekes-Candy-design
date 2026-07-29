/* ============================================================
   Level milestones — what a level actually opens up.

   The features are gated in a dozen different modules; this is the one
   place that knows which level opens which door, purely so the level-up
   modal can say "you just unlocked bezorgen" instead of leaving the
   player to find a tab that quietly stopped being grey.

   Nothing here grants anything. It is a lookup table for the message.
   ============================================================ */

import { DELIVERY_LEVEL } from '../core/state.js';
import { SOCIAL_LEVEL } from './social.js';
import { CONTEST_LEVEL } from '../data/contests.js';
import { PET_LEVEL } from '../data/pet.js';
import { LOCATIONS } from '../data/upgrades.js';

/**
 * `go` is the screen to jump to, when jumping there makes sense.
 * The text lives in i18n under `ms.<id>` / `ms.<id>.sub`.
 */
export const MILESTONES = [
  { id:'speed',    level:4,              emoji:'⚡',  go:null },
  { id:'tools',    level:4,              emoji:'🔧',  go:null },
  { id:'delivery', level:DELIVERY_LEVEL, emoji:'🚲', go:'delivery' },
  { id:'pet',      level:PET_LEVEL,      emoji:'🐾', go:'pet' },
  { id:'social',   level:SOCIAL_LEVEL,   emoji:'📱', go:'social' },
  { id:'contest',  level:CONTEST_LEVEL,  emoji:'🏆', go:'contest' },
  { id:'vip',      level:5,              emoji:'👑', go:null },
  { id:'challenge',level:7,              emoji:'🎯', go:null },
  { id:'queue',    level:8,              emoji:'🧍', go:null },
  { id:'text',     level:8,              emoji:'✍️', go:null },
];

/**
 * Everything that opens at exactly this level, features first and then
 * any new shop location, which is the one unlock people care most about.
 */
export function milestonesFor(level){
  const out = MILESTONES.filter(m => m.level === level)
    .map(m => ({ ...m, kind:'feature' }));
  for (const loc of LOCATIONS){
    if (loc.level === level && loc.cost > 0){
      out.push({ kind:'location', id:loc.id, name:loc.name, level, emoji:loc.emoji, go:'store' });
    }
  }
  return out;
}

/** For a run of levels gained at once, in the order they were earned. */
export function milestonesForLevels(levels = []){
  return levels.flatMap(milestonesFor);
}
