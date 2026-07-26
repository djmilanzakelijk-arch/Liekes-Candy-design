/* ============================================================
   Colours, flavours and rarity tiers
   ============================================================ */

/**
 * Each colour carries a 3-stop ramp so candy can be shaded with real
 * depth (dark → base → light) instead of flat fills.
 *  kind: 'solid' | 'metal' | 'rainbow'
 */
export const COLORS = [
  { id:'pink',    name:'Pink',    kind:'solid',  dark:'#c93f76', base:'#ff8ec0', light:'#ffd7ea', spec:'#fff2f8' },
  { id:'blue',    name:'Blue',    kind:'solid',  dark:'#1f5fa8', base:'#5aabff', light:'#c4e2ff', spec:'#f0f8ff' },
  { id:'purple',  name:'Purple',  kind:'solid',  dark:'#5b2ec2', base:'#9a6bff', light:'#dcc9ff', spec:'#f6f0ff' },
  { id:'green',   name:'Green',   kind:'solid',  dark:'#1d8d68', base:'#48cfa6', light:'#bff0df', spec:'#effcf7' },
  { id:'yellow',  name:'Yellow',  kind:'solid',  dark:'#c98f14', base:'#ffcf47', light:'#ffeeb3', spec:'#fffaea' },
  { id:'orange',  name:'Orange',  kind:'solid',  dark:'#c4611a', base:'#ff9a4d', light:'#ffd7b3', spec:'#fff4ea' },
  { id:'red',     name:'Red',     kind:'solid',  dark:'#a41f2e', base:'#f04f5f', light:'#ffb9bf', spec:'#fff0f1' },
  { id:'white',   name:'White',   kind:'solid',  dark:'#cbbcc6', base:'#fdf7fa', light:'#ffffff', spec:'#ffffff' },
  { id:'black',   name:'Black',   kind:'solid',  dark:'#161016', base:'#3a2f38', light:'#6d5f6b', spec:'#a99fa7' },
  { id:'brown',   name:'Cocoa',   kind:'solid',  dark:'#4a2c17', base:'#8b5e3c', light:'#c9a184', spec:'#e6cdb8' },
  { id:'gold',    name:'Gold',    kind:'metal',  dark:'#8a5c05', base:'#ffc94d', light:'#fff3c4', spec:'#ffffff' },
  { id:'silver',  name:'Silver',  kind:'metal',  dark:'#7e8c9c', base:'#c9d4e2', light:'#ffffff', spec:'#ffffff' },
  { id:'rainbow', name:'Rainbow', kind:'rainbow',dark:'#9a6bff', base:'#ff8ec0', light:'#ffe08a', spec:'#ffffff' },
];

export const COLOR_BY_ID = Object.fromEntries(COLORS.map(c => [c.id, c]));
export const getColor = id => COLOR_BY_ID[id] || COLOR_BY_ID.pink;

/** Colours available from the very start; the rest unlock with level. */
export const COLOR_UNLOCK = {
  pink:1, blue:1, brown:1, white:1,
  purple:2, yellow:3, green:4, red:5, orange:6,
  black:8, gold:10, silver:12, rainbow:15,
};

export const FLAVORS = [
  { id:'milk',       name:'Milk Chocolate', emoji:'🍫', unlock:1,  tint:'#8b5e3c' },
  { id:'strawberry', name:'Strawberry',     emoji:'🍓', unlock:1,  tint:'#ff7ba3' },
  { id:'vanilla',    name:'Vanilla',        emoji:'🌼', unlock:1,  tint:'#ffeec9' },
  { id:'dark',       name:'Dark Chocolate', emoji:'🖤', unlock:2,  tint:'#3d2418' },
  { id:'white',      name:'White Chocolate',emoji:'🤍', unlock:3,  tint:'#fff3e2' },
  { id:'lemon',      name:'Lemon',          emoji:'🍋', unlock:4,  tint:'#ffdd55' },
  { id:'blueberry',  name:'Blueberry',      emoji:'🫐', unlock:5,  tint:'#6f8ff0' },
  { id:'mint',       name:'Mint',           emoji:'🌿', unlock:6,  tint:'#7fe4c6' },
  { id:'caramel',    name:'Salted Caramel', emoji:'🍯', unlock:8,  tint:'#e0a13c' },
  { id:'raspberry',  name:'Raspberry',      emoji:'🫐', unlock:9,  tint:'#e0417b' },
  { id:'bubblegum',  name:'Bubblegum',      emoji:'🎈', unlock:11, tint:'#ffa8ca' },
  { id:'cotton',     name:'Cotton Candy',   emoji:'☁️', unlock:13, tint:'#d9c2ff' },
];

export const FLAVOR_BY_ID = Object.fromEntries(FLAVORS.map(f => [f.id, f]));

export const RARITY = {
  common:    { id:'common',    name:'Common',    order:0, tint:'#c3cdd9', mult:1.0,  animated:false },
  rare:      { id:'rare',      name:'Rare',      order:1, tint:'#6fb2ff', mult:1.25, animated:false },
  epic:      { id:'epic',      name:'Epic',      order:2, tint:'#a878ff', mult:1.6,  animated:true  },
  legendary: { id:'legendary', name:'Legendary', order:3, tint:'#ffbe2e', mult:2.2,  animated:true  },
  mythic:    { id:'mythic',    name:'Mythic',    order:4, tint:'#ff6fc7', mult:3.0,  animated:true  },
};
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic'];
