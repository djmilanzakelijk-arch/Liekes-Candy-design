// Instellingen en voortgang, bewaard in de browser (localStorage).
// Alle toegang staat in try/catch: in een privévenster kan opslag ontbreken,
// en dan werkt alles gewoon zonder te onthouden.

const KEY = 'na-de-storm:v1';

const DEFAULT_SETTINGS = {
  sensitivity: 1,
  invertY: false,
  headBob: true,
  reducedMotion: false,
  textSize: 'normaal',
  highContrast: false,
  volume: 0.6,
  muted: false,
  quality: 'normaal',
  fov: 65,
  dragLook: false
};

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* opslag niet beschikbaar */ }
}

export class Store {
  constructor() {
    const d = read();
    this.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
    this.viewed = new Set(d.viewed || []);
    this.visitedRooms = new Set(d.visitedRooms || []);
    this.reflection = d.reflection || { choice: null, text: '' };
    this.quizBest = d.quizBest ?? null;
    this.startedAt = Date.now();
  }

  save() {
    write({
      settings: this.settings,
      viewed: [...this.viewed],
      visitedRooms: [...this.visitedRooms],
      reflection: this.reflection,
      quizBest: this.quizBest
    });
  }

  set(key, value) { this.settings[key] = value; this.save(); }
  markViewed(id) { if (!this.viewed.has(id)) { this.viewed.add(id); this.save(); return true; } return false; }
  markRoom(id) { if (!this.visitedRooms.has(id)) { this.visitedRooms.add(id); this.save(); return true; } return false; }
  resetProgress() { this.viewed.clear(); this.visitedRooms.clear(); this.startedAt = Date.now(); this.save(); }
}
