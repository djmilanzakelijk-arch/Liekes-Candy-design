/* ============================================================
   Missions — daily rotating goals + permanent career milestones.
   `stat` names a counter tracked in state.counters
   ============================================================ */

export const DAILY_POOL = [
  { id:'orders10',   emoji:'📋', stat:'orders',      goal:10, text:'Complete 10 orders',            coins:600  },
  { id:'orders20',   emoji:'📋', stat:'orders',      goal:20, text:'Complete 20 orders',            coins:1400 },
  { id:'five5',      emoji:'⭐', stat:'fiveStars',   goal:5,  text:'Earn five 5-star reviews',      coins:1200 },
  { id:'perfect3',   emoji:'💯', stat:'perfect',     goal:3,  text:'Land 3 perfect orders',         coins:1000 },
  { id:'coins500',   emoji:'🪙', stat:'coinsEarned', goal:500,text:'Earn 500 coins',                coins:400  },
  { id:'coins2000',  emoji:'🪙', stat:'coinsEarned', goal:2000,text:'Earn 2 000 coins',             coins:1100 },
  { id:'deco30',     emoji:'✨', stat:'decosPlaced', goal:30, text:'Place 30 decorations',          coins:500  },
  { id:'choc10',     emoji:'🍫', stat:'candy_bar',   goal:10, text:'Decorate 10 chocolate bars',    coins:700  },
  { id:'lolli10',    emoji:'🍭', stat:'candy_lolli', goal:10, text:'Decorate 10 lollipops',         coins:700  },
  { id:'wrap8',      emoji:'🎁', stat:'wrapped',     goal:8,  text:'Wrap 8 orders in packaging',    coins:650  },
  { id:'tip1000',    emoji:'💰', stat:'tips',        goal:1000,text:'Collect 1 000 coins in tips',  coins:900  },
  { id:'streak5',    emoji:'🔥', stat:'bestStreak',  goal:5,  text:'Reach a 5-order perfect streak',coins:1500 },
  { id:'unlock1',    emoji:'🔓', stat:'unlocked',    goal:1,  text:'Unlock a new decoration',       coins:800  },
  { id:'photo3',     emoji:'📸', stat:'photos',      goal:3,  text:'Save 3 creations to Photo Mode',coins:450  },
];

export const CAREER = [
  { id:'c_orders25',  emoji:'📋', stat:'orders',      goal:25,   text:'Serve 25 customers',        coins:1200, gems:1 },
  { id:'c_orders100', emoji:'📋', stat:'orders',      goal:100,  text:'Serve 100 customers',       coins:5000, gems:4 },
  { id:'c_orders500', emoji:'📋', stat:'orders',      goal:500,  text:'Serve 500 customers',       coins:24000,gems:15 },
  { id:'c_five25',    emoji:'⭐', stat:'fiveStars',   goal:25,   text:'Earn 25 five-star reviews', coins:3000, gems:3 },
  { id:'c_five150',   emoji:'⭐', stat:'fiveStars',   goal:150,  text:'Earn 150 five-star reviews',coins:16000,gems:12 },
  { id:'c_coins10k',  emoji:'🪙', stat:'coinsEarned', goal:10000,text:'Earn 10 000 coins total',   coins:2500, gems:2 },
  { id:'c_coins100k', emoji:'🪙', stat:'coinsEarned', goal:100000,text:'Earn 100 000 coins total', coins:20000,gems:14 },
  { id:'c_streak10',  emoji:'🔥', stat:'bestStreak',  goal:10,   text:'Hit a 10-order perfect run',coins:6000, gems:5 },
  { id:'c_deco20',    emoji:'✨', stat:'decoOwned',   goal:20,   text:'Own 20 decorations',        coins:4000, gems:3 },
  { id:'c_deco40',    emoji:'✨', stat:'decoOwned',   goal:40,   text:'Own 40 decorations',        coins:12000,gems:8 },
  { id:'c_candy6',    emoji:'🍬', stat:'candyOwned',  goal:6,    text:'Unlock 6 candy types',      coins:3500, gems:3 },
  { id:'c_candy10',   emoji:'🍬', stat:'candyOwned',  goal:10,   text:'Unlock every candy type',   coins:18000,gems:12 },
  { id:'c_loc3',      emoji:'🌍', stat:'locOwned',    goal:3,    text:'Own 3 shop locations',      coins:9000, gems:6 },
  { id:'c_lvl10',     emoji:'🏆', stat:'level',       goal:10,   text:'Reach shop level 10',       coins:5000, gems:5 },
  { id:'c_lvl20',     emoji:'🏆', stat:'level',       goal:20,   text:'Reach shop level 20',       coins:22000,gems:16 },
  { id:'c_perfect50', emoji:'💯', stat:'perfect',     goal:50,   text:'Land 50 perfect orders',    coins:11000,gems:8 },
];

export const MISSION_BY_ID = Object.fromEntries([...DAILY_POOL, ...CAREER].map(m => [m.id, m]));
