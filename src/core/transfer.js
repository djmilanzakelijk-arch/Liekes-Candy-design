/* ============================================================
   Save transfer.

   Progress lives in localStorage, which browsers scope to the exact
   origin. Moving the game to a different host therefore looks, to the
   browser, like a brand new game with an empty save.

   This module carries a save across that boundary: it packs the save
   into a compact, URL-safe payload that can travel in a link, a file
   or a pasted code, and unpacks it on the other side.
   ============================================================ */

import { SAVE_KEY } from './state.js';
import { getLang } from './i18n.js';

const LANG_KEY = 'liekes-candy-design/lang';

/** Where players should be sent when this deployment is retired.
 *  Leave empty to hide the banner entirely. */
export const NEW_SITE_URL = '';

const PLAIN = 'b';   // base64 of raw JSON
const GZIP  = 'z';   // base64 of gzipped JSON

/* ── base64url helpers (no +, / or = so links stay clean) ── */
function bytesToB64url(bytes){
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk){
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(str){
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const hasCompression = () =>
  typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

async function gzip(text){
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function gunzip(bytes){
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

/* ══════════════ encode / decode ══════════════ */

/**
 * Pack a save object into a URL-safe string.
 * Photos are dropped by default — they are the bulk of a save and are
 * purely cosmetic, so leaving them out keeps links short enough to share.
 */
export async function encodeSave(save, { includePhotos = false } = {}){
  const copy = { ...save, __lang: getLang() };
  if (!includePhotos) delete copy.photos;
  const json = JSON.stringify(copy);

  if (hasCompression()){
    try { return GZIP + bytesToB64url(await gzip(json)); }
    catch { /* fall through to plain */ }
  }
  return PLAIN + bytesToB64url(new TextEncoder().encode(json));
}

/** Unpack a payload produced by encodeSave. Throws if it is not valid. */
export async function decodeSave(payload){
  const trimmed = String(payload || '').trim();
  if (!trimmed) throw new Error('empty');

  const kind = trimmed[0];
  const body = trimmed.slice(1);
  let json;

  if (kind === GZIP){
    if (!hasCompression()) throw new Error('no-gzip-support');
    json = await gunzip(b64urlToBytes(body));
  } else if (kind === PLAIN){
    json = new TextDecoder().decode(b64urlToBytes(body));
  } else {
    // legacy: plain base64 of JSON, as produced by the old export box
    json = decodeURIComponent(escape(atob(trimmed)));
  }

  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.level !== 'number'){
    throw new Error('not-a-save');
  }
  return parsed;
}

/** Full link that carries the save to another address. */
export function buildTransferLink(baseUrl, payload){
  const base = String(baseUrl || '').replace(/[#?].*$/, '').replace(/\/+$/, '');
  return `${base}/#move=${payload}`;
}

/* ══════════════ incoming transfer ══════════════ */

let incoming = null;

/**
 * Read a payload out of the URL and remove it from the address bar, so a
 * refresh cannot replay it. Call this as early as possible during boot.
 */
export function captureIncoming(){
  const from = (src, key) => {
    const m = new RegExp('(?:^|[#&?])' + key + '=([^&]+)').exec(src || '');
    return m ? m[1] : null;
  };
  incoming = from(location.hash, 'move') || from(location.search, 'move');
  if (incoming){
    // strip it without adding a history entry
    history.replaceState(null, '', location.pathname + location.search.replace(/[?&]move=[^&]+/, ''));
  }
  return incoming;
}

export const hasIncoming = () => !!incoming;

/** Does this browser already hold real progress at this address? */
export function existingSaveLooksReal(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    return (s.level || 1) > 1
        || (s.counters?.orders || 0) > 0
        || (s.coins || 0) !== 500;
  } catch { return false; }
}

/**
 * Write an incoming save to this origin's storage.
 * @returns the imported object
 */
export async function applyIncoming(payload = incoming){
  const parsed = await decodeSave(payload);
  // the chosen language rides along in its own field, not in the save itself
  const lang = parsed.__lang;
  delete parsed.__lang;
  if (lang) { try { localStorage.setItem(LANG_KEY, lang); } catch {} }
  localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
  incoming = null;
  return parsed;
}

export function discardIncoming(){ incoming = null; }

/** A short human summary used in the "import this?" prompt. */
export async function describePayload(payload = incoming){
  try {
    const s = await decodeSave(payload);
    return {
      ok: true,
      level: s.level ?? 1,
      coins: s.coins ?? 0,
      shopName: s.shopName || '',
      decos: s.owned?.decos?.length ?? 0,
      orders: s.counters?.orders ?? 0,
    };
  } catch {
    return { ok: false };
  }
}

/* ══════════════ file backup ══════════════ */

export function downloadSaveFile(save){
  const blob = new Blob([JSON.stringify(save, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `liekes-candy-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Prompt for a .json backup and return the parsed save. */
export function pickSaveFile(){
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,.txt';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file){ reject(new Error('cancelled')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (typeof parsed.level !== 'number') throw new Error('not-a-save');
          resolve(parsed);
        } catch (e){ reject(e); }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
    input.click();
  });
}
