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

export const CUSTOMER_NAMES = [
  'Mila','Noah','Sanne','Luuk','Emma','Daan','Fleur','Bram','Sofie','Finn',
  'Julia','Sem','Nora','Jesse','Lotte','Milan','Anna','Tijn','Roos','Liam',
  'Yara','Gijs','Isa','Cas','Elin','Ruben','Maud','Thijs','Nina','Joep',
  'Amira','Kai','Zoë','Rens','Livia','Otto','Suus','Boaz','Merel','Aron',
];

export const CUSTOMER_FACES = [
  '👩','🧑','👨','👵','👴','👧','👦','🧕','👩‍🦰','👨‍🦱',
  '👩‍🦳','🧑‍🎤','👩‍🍳','🧑‍🚀','👸','🤴','🧚','🧑‍🎨','👩‍🎓','🕵️',
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
