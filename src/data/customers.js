/* ============================================================
   Customers — personalities, names, faces and dialogue.
   ============================================================ */

export const PERSONALITIES = [
  {
    id:'sweet', name:'Sweetheart', emoji:'🥰',
    patience:1.25, tip:1.15, fuss:.75, chatty:1,
    greet:['Hi there! Take your time, okay?','Hello! Your shop smells amazing.','Oh I love it in here!'],
    happy:['This is even prettier than I imagined!','You have such a gentle touch.','I could cry, it is so cute.'],
    okay:['Thank you, that is lovely.','Sweet! Thanks so much.','That will do nicely.'],
    sad:['Oh… that is not quite what I pictured.','Hmm. Maybe next time?','I will still eat it, don\'t worry.'],
  },
  {
    id:'picky', name:'Perfectionist', emoji:'🧐',
    patience:.85, tip:1.35, fuss:1.4, chatty:.8,
    greet:['I have a very specific request.','Listen carefully, please.','Precision matters to me.'],
    happy:['Flawless. Genuinely flawless.','Now THAT is craftsmanship.','I have no notes. None.'],
    okay:['Acceptable. Not exceptional.','Close enough, I suppose.','Fine. It is fine.'],
    sad:['That is not what I asked for.','Did you even read the order?','Disappointing, frankly.'],
  },
  {
    id:'rush', name:'In a Hurry', emoji:'😅',
    patience:.6, tip:1.05, fuss:.85, chatty:.6,
    greet:['Quick quick, my bus leaves soon!','I am SO late, please hurry!','Fast as you can, please!'],
    happy:['Perfect and fast! You are a legend.','Amazing, thank you, byeee!','You saved me!'],
    okay:['Great, gotta run!','Thanks! Bye!','Got it, cheers!'],
    sad:['Ugh, I waited all that time for this?','No time to argue. Bye.','That took ages.'],
  },
  {
    id:'kid', name:'Excited Kid', emoji:'🤩',
    patience:.9, tip:.8, fuss:.6, chatty:1.3,
    greet:['I saved up ALL my pocket money!','Can you make it super colourful?!','This is the best shop EVER!'],
    happy:['WOOOOW! Look at it!','Mum! MUM! Look what I got!','It is the coolest thing I own.'],
    okay:['Cool, thanks!','Yay! Candy!','Nice one!'],
    sad:['Aww… I wanted more sprinkles.','That is not the colour I said.','Oh. Okay.'],
  },
  {
    id:'lux', name:'Connoisseur', emoji:'💅',
    patience:1.0, tip:1.7, fuss:1.25, chatty:.9,
    greet:['Money is not an object here.','I want something exquisite.','Impress me, darling.'],
    happy:['Divine. Simply divine.','I will be telling everyone about you.','Worth every single coin.'],
    okay:['Passable for the price.','Mm. Adequate.','I have seen better, but fine.'],
    sad:['I expected far more.','This is beneath the shop\'s reputation.','No. Just… no.'],
  },
  {
    id:'chill', name:'Easy-Going', emoji:'😌',
    patience:1.5, tip:1.0, fuss:.55, chatty:.7,
    greet:['No rush at all, honestly.','Whatever you think looks nice.','Take your time, friend.'],
    happy:['Oh that is beautiful. Thank you.','You really nailed it.','Lovely work.'],
    okay:['Nice one, cheers.','That works for me.','Sweet, thanks.'],
    sad:['Ah well, not to worry.','No stress. Next time.','It is all good.'],
  },
  {
    id:'vip', name:'VIP Guest', emoji:'👑', vip:true,
    patience:.95, tip:2.4, fuss:1.6, chatty:1.1,
    greet:['I have heard extraordinary things.','My order is… elaborate. Ready?','Only the very best will do.'],
    happy:['Magnificent. You have a gift.','I am commissioning a hundred more.','A masterpiece. Truly.'],
    okay:['Hm. Not your best work, I sense.','Serviceable.','I will take it. This time.'],
    sad:['I am deeply underwhelmed.','My expectations were not met.','We shall not speak of this.'],
  },
];

export const PERS_BY_ID = Object.fromEntries(PERSONALITIES.map(p => [p.id, p]));

/**
 * Customers, with the name and who they are — so a Bram never turns up
 * as a girl and a Fleur never as a man. `g` is 'f', 'm' or 'n' for the
 * names that go either way.
 */
export const CUSTOMERS = [
  { name:'Mila',  g:'f' }, { name:'Noah',  g:'m' }, { name:'Sanne', g:'f' },
  { name:'Luuk',  g:'m' }, { name:'Emma',  g:'f' }, { name:'Daan',  g:'m' },
  { name:'Fleur', g:'f' }, { name:'Bram',  g:'m' }, { name:'Sofie', g:'f' },
  { name:'Finn',  g:'m' }, { name:'Julia', g:'f' }, { name:'Sem',   g:'m' },
  { name:'Nora',  g:'f' }, { name:'Jesse', g:'m' }, { name:'Lotte', g:'f' },
  { name:'Milan', g:'m' }, { name:'Anna',  g:'f' }, { name:'Tijn',  g:'m' },
  { name:'Roos',  g:'f' }, { name:'Liam',  g:'m' }, { name:'Yara',  g:'f' },
  { name:'Gijs',  g:'m' }, { name:'Isa',   g:'f' }, { name:'Cas',   g:'m' },
  { name:'Elin',  g:'f' }, { name:'Ruben', g:'m' }, { name:'Maud',  g:'f' },
  { name:'Thijs', g:'m' }, { name:'Nina',  g:'f' }, { name:'Joep',  g:'m' },
  { name:'Amira', g:'f' }, { name:'Kai',   g:'n' }, { name:'Zoë',   g:'f' },
  { name:'Rens',  g:'m' }, { name:'Livia', g:'f' }, { name:'Otto',  g:'m' },
  { name:'Suus',  g:'f' }, { name:'Boaz',  g:'m' }, { name:'Merel', g:'f' },
  { name:'Aron',  g:'m' }, { name:'Robin', g:'n' }, { name:'Sam',   g:'n' },
];

/** Kept for anything that just wants a name. */
export const CUSTOMER_NAMES = CUSTOMERS.map(c => c.name);

/**
 * Faces, split by who they belong to.
 *
 * Only single-codepoint emoji here on purpose: the joined ones
 * (👩‍🦰, 🧑‍🎤, 🕵️…) come out blank in a canvas on some phones, which
 * is exactly how customers ended up invisible in the shop.
 */
export const FACES_BY_GENDER = {
  f: ['👧', '👩', '👵'],
  m: ['👦', '👨', '👴'],
  n: ['🧒', '🧑'],
};

/** A face that matches the name. */
export function faceFor(gender){
  const list = FACES_BY_GENDER[gender] || FACES_BY_GENDER.n;
  return list[Math.floor(Math.random() * list.length)];
}

/** Every face that can turn up, for anything that needs the whole set. */
export const CUSTOMER_FACES = [
  ...FACES_BY_GENDER.f, ...FACES_BY_GENDER.m, ...FACES_BY_GENDER.n,
];

/** Flavour text glued onto orders to keep them feeling handwritten. */
/** Each opener has to read naturally in front of "a pink chocolate bar…". */
export const ORDER_OPENERS = [
  'Could I get', 'I would love', 'May I have', 'I am after',
  'Please make me', 'I would like', 'Can you do',
];

export const ORDER_CLOSERS = [
  'please!', 'if you can.', 'thank you!', 'that would be perfect.',
  'you are the best.', 'no rush.', 'as pretty as possible!',
];

/** Occasion tags — used to colour the order text and pick decorations. */
export const OCCASIONS = [
  { id:'birthday', label:'for a birthday',      decos:['candle','st_star','sprinkles','ev_balloon'], colors:['pink','yellow','blue'] },
  { id:'wedding',  label:'for a wedding',       decos:['rose','pearls','lace_ribbon','bouquet'],     colors:['white','gold','silver'] },
  { id:'thanks',   label:'as a thank-you gift', decos:['bow','ribbon','heart'],                       colors:['pink','purple','green'] },
  { id:'sorry',    name:'apology',              label:'as an apology',  decos:['rose','heart','icing_swirl'], colors:['red','pink','white'] },
  { id:'treat',    label:'just for me',         decos:['sprinkles','drizzle','glitter'],              colors:['pink','blue','purple'] },
  { id:'party',    label:'for a party',         decos:['rainbow_spr','st_star','glitter','ev_balloon'],colors:['rainbow','yellow','orange'] },
];
