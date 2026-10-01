                              /* ═══════════════════════════════════════════════════════════════════════
   BandPlan — Music Group OS · v6.0 (editorial clay)
   Файл 3/3 · логика
   Расписание (месяц/неделя/день) · репертуар с динамикой партий по роли ·
   сет-листы (drag&drop) · сцена · оформление · офлайн · доступность
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ═══ 1. HELPERS ═══ */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const uid = p => (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = d => { const x = new Date(d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const today = () => iso(new Date());
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONF = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const WD = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const WDF = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const DOW = s => (new Date(s + 'T00:00:00').getDay() + 6) % 7;
function pdate(s) { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return d.getDate() + ' ' + MON[d.getMonth()]; }
function pdateFull(s) { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return WDF[DOW(s)] + ', ' + d.getDate() + ' ' + MONF[d.getMonth()] + ' ' + d.getFullYear(); }
function pdateShort(s) { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return WD[DOW(s)] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; }
function daysTo(s) { return Math.round((new Date(s + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000); }
function plural(n, a, b, c) { const m = n % 10, h = n % 100; if (m === 1 && h !== 11) return a; if (m >= 2 && m <= 4 && (h < 10 || h >= 20)) return b; return c; }
function countdown(s) { const n = daysTo(s); if (n === 0) return 'сегодня'; if (n === 1) return 'завтра'; if (n === -1) return 'вчера'; return n > 0 ? 'через ' + n + ' ' + plural(n, 'день', 'дня', 'дней') : Math.abs(n) + ' ' + plural(Math.abs(n), 'день', 'дня', 'дней') + ' назад'; }
function fmtDur(sec) { sec = Math.round(sec || 0); return Math.floor(sec / 60) + ':' + pad(sec % 60); }
function durParse(v) { const m = /^(\d+):(\d{1,2})$/.exec(String(v || '').trim()); if (m) return (+m[1]) * 60 + (+m[2]); const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
function mins(t) { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); return m ? (+m[1]) * 60 + (+m[2]) : 0; }
function debounce(fn, ms) { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms || 250); }; }

/* ═══ 2. ICONS (единая толщина линии 1.7) ═══ */
const ICONS = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 17 17"/>',
  filter: '<path d="M3.5 5.5h17l-6.6 7.6v5.6l-3.8 2v-7.6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  play: '<path d="M7.5 4.8v14.4L19 12z"/>', pause: '<path d="M8.5 5v14M15.5 5v14"/>',
  trash: '<path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M14.5 5.5 18.5 9.5"/>',
  star: '<path d="M12 3.6l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8z"/>',
  print: '<path d="M7 9V3.8h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="2"/><path d="M7 14h10v6.2H7z"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>', left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7v5.2l3.4 2"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.6 14.4A6.2 6.2 0 0 1 21.2 20"/>',
  monitor: '<rect x="2" y="4" width="20" height="13" rx="2.4"/><path d="M8.5 21h7M12 17v4"/>',
  dl: '<path d="M12 3v12M7.5 11 12 15.5 16.5 11M4 20.5h16"/>', ul: '<path d="M12 20V8M7.5 12 12 7.5 16.5 12M4 3.5h16"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 20 6.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16 9.6"/>',
  alert: '<path d="M12 3.5 22 20H2z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
  wifiOff: '<path d="M2 3l20 20M8.5 15.5a5 5 0 0 1 7 0M5 12a10 10 0 0 1 4-2.5M19 12a10 10 0 0 0-6.5-2.9M2.5 8.5A15 15 0 0 1 8 5.6M21.5 8.5a15 15 0 0 0-6.2-3"/>',
  grip: '<path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/>',
  mic: '<rect x="9" y="2.6" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.4M8.6 21.4h6.8"/>',
  repeat: '<path d="M17 2.5 21 6l-4 3.5"/><path d="M21 6H7.5A3.5 3.5 0 0 0 4 9.5V11"/><path d="M7 21.5 3 18l4-3.5"/><path d="M3 18h13.5a3.5 3.5 0 0 0 3.5-3.5V13"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 5.5h-9a2.5 2.5 0 0 0-2.5 2.5v9"/>',
  bolt: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
  fs: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  link: '<path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/>',
  wave: '<path d="M2 12h2.5l2-6 3 13 3-9 2 4H22"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  rows: '<rect x="3" y="4.5" width="18" height="5" rx="2"/><rect x="3" y="14.5" width="18" height="5" rx="2"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.4-1.2-1.7-1.2-2.9 0-.8.7-1.3 1.6-1.3H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7z"/><circle cx="7.8" cy="11" r="1.1" fill="currentColor"/><circle cx="11" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15.6" cy="8.4" r="1.1" fill="currentColor"/>',
  inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/>'
};
function ic(n, s) { s = s || 18; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; }

/* ═══ 3. CHORDS ═══ */
const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const CHORD_RE = /^[A-G](?:#|b)?(?:m(?:aj|in)?|sus[24]?|dim|aug|add\d+)?\d*(?:(?:b|#)\d+)?(?:\/[A-G](?:#|b)?)?$/;
const KEY_LIST = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B', 'Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'];
const isChord = t => CHORD_RE.test(String(t || '').trim());
function transposeChord(c, n) {
  n = n || 0;
  return String(c).split('/').map(function (p) {
    const m = /^([A-G])([#b]?)(.*)$/.exec(p); if (!m) return p;
    const base = m[1] + m[2]; if (NOTE_IDX[base] == null) return p;
    const mode = state.settings.notation;
    const tbl = (mode === 'flat' || (mode === 'auto' && m[2] === 'b')) ? FLAT : SHARP;
    return tbl[(NOTE_IDX[base] + n + 120) % 12] + m[3];
  }).join('/');
}
const transposeKey = (k, n) => !k ? k : String(k).split(/\s+/).map(t => isChord(t) ? transposeChord(t, n) : t).join(' ');
function isSection(l) { const m = /^\s*\[([^\]]+)\]\s*$/.exec(l); return !!(m && !isChord(m[1].trim())); }
function isChordLine(l) {
  const t = String(l || '').trim(); if (!t || t.charAt(0) === '[') return false;
  const a = t.split(/\s+/); for (let i = 0; i < a.length; i++) if (!isChord(a[i])) return false; return true;
}
function transposeLyrics(text, n) {
  if (!n) return text || '';
  return String(text || '').split('\n').map(function (l) {
    if (isSection(l)) return l;
    if (isChordLine(l)) return l.replace(/[^\s]+/g, t => isChord(t) ? transposeChord(t, n) : t);
    return l.replace(/\[([A-G][^\]\s]*)\]/g, (m, c) => isChord(c) ? '[' + transposeChord(c, n) + ']' : m);
  }).join('\n');
}
function renderLyrics(text, n) {
  const out = [];
  String(text || '').split('\n').forEach(function (line) {
    if (state.settings.showChords === false) line = line.replace(/\[([A-G][^\]\s]*)\]/g, (m, c) => isChord(c) ? '' : m);
    if (!line.trim()) { out.push('<span class="ln"> </span>'); return; }
    if (isSection(line)) { out.push('<span class="ln sec">' + esc(line.trim().slice(1, -1)) + '</span>'); return; }
    if (isChordLine(line)) {
      if (state.settings.showChords === false) return;
      out.push('<span class="ln">' + line.split(/(\s+)/).map(function (p) {
        if (/^\s+$/.test(p)) return p;
        return isChord(p) ? '<b class="ch">' + esc(transposeChord(p, n)) + '</b>' : esc(p);
      }).join('') + '</span>'); return;
    }
    out.push('<span class="ln">' + esc(line).replace(/\[([A-G][^\]\s]*)\]/g, (m, c) => isChord(c) ? '<b class="ch inl">' + esc(transposeChord(c, n)) + '</b>' : m) + '</span>');
  });
  return out.join('');
}
function extractChords(text) {
  const out = [], seen = {};
  String(text || '').split('\n').forEach(function (l) {
    if (isSection(l)) return;
    if (isChordLine(l)) { l.trim().split(/\s+/).forEach(t => { if (isChord(t) && !seen[t]) { seen[t] = 1; out.push(t); } }); return; }
    const re = /\[([A-G][^\]\s]*)\]/g; let m;
    while ((m = re.exec(l)) !== null) if (isChord(m[1]) && !seen[m[1]]) { seen[m[1]] = 1; out.push(m[1]); }
  });
  return out;
}
function extractSections(text) {
  const out = [];
  String(text || '').split('\n').forEach(function (l) {
    const m = /^\s*\[([^\]]+)\]\s*$/.exec(l);
    if (m && !isChord(m[1].trim()) && out.indexOf(m[1].trim()) < 0) out.push(m[1].trim());
  });
  return out;
}

/* ═══ 4. ROLES / DYNAMICS / TYPES ═══ */
const ROLES = [
  { k: 'vocal', label: 'Вокал', icon: 'mic' }, { k: 'guitar', label: 'Гитара', icon: 'music' },
  { k: 'bass', label: 'Бас-гитара', icon: 'music' }, { k: 'drums', label: 'Ударные', icon: 'bolt' },
  { k: 'keys', label: 'Клавиши', icon: 'monitor' }, { k: 'violin', label: 'Скрипка', icon: 'wave' },
  { k: 'sax', label: 'Саксофон', icon: 'mic' }, { k: 'backing', label: 'Бэк-вокал', icon: 'users' },
  { k: 'sound', label: 'Звукорежиссёр', icon: 'gear' }, { k: 'other', label: 'Другое', icon: 'target' }
];
const myRoles = () => { const p = state.profile; return Array.isArray(p.roles) && p.roles.length ? p.roles : (p.role ? [p.role] : []); };
const rolesOf = m => Array.isArray(m.roles) && m.roles.length ? m.roles : (m.role ? [m.role] : []);
const rolesLabel = list => { const a = (list || []).map(k => roleLabel(k)); return a.length ? a.join(', ') : '—'; };
let deferredInstall = null;
const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
function doInstall() { if (!deferredInstall) return; deferredInstall.prompt(); deferredInstall.userChoice.then(() => { deferredInstall = null; const b = $('#pwaBtn'); if (b) b.hidden = true; }, () => { }); }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = $('#pwaBtn'); if (b) b.hidden = false; });
window.addEventListener('appinstalled', () => { deferredInstall = null; });
function syncSceneChords() { const b = $('#scChords'); if (b) { const on = state.settings.showChords !== false; b.setAttribute('aria-pressed', on); b.classList.toggle('off', !on); } }
const roleLabel = k => (ROLES.find(r => r.k === k) || { label: k || '—' }).label;
const DYN_LEVELS = ['', 'pp', 'p', 'mp', 'mf', 'f', 'ff'];
const DYN_LABEL = { '': 'не задано', pp: 'очень тихо', p: 'тихо', mp: 'умеренно тихо', mf: 'умеренно громко', f: 'громко', ff: 'очень громко' };
const dynCls = v => ({ pp: 'd1', p: 'd2', mp: 'd3', mf: 'd4', f: 'd5', ff: 'd6' }[v] || 'd0');
const EV_TYPES = {
  gig: { label: 'Выступление', cls: 'b-info', ic: 'mic', color: 'var(--info)' },
  rehearsal: { label: 'Репетиция', cls: 'b-ok', ic: 'music', color: 'var(--ok)' },
  recording: { label: 'Запись', cls: 'b-brand', ic: 'monitor', color: 'var(--plum)' },
  meeting: { label: 'Встреча', cls: 'b-warn', ic: 'users', color: 'var(--warn)' }
};
const REPEATS = { none: 'Без повтора', weekly: 'Каждую неделю', biweekly: 'Каждые 2 недели', monthly: 'Каждый месяц' };
const PALETTE = ['#2547D0', '#1F7A5A', '#6E4483', '#8F6311', '#A93B32', '#2C6E80', '#4C525F', '#7A5230'];
const ACCENTS = ['#2547D0', '#1B3A6B', '#1F7A5A', '#6E4483', '#8F6311', '#A93B32', '#2C6E80', '#4C525F', '#7A5230'];

/* ═══ 5. STATE + CLOUD SYNC ═══ */
const KEY = 'bandplan.premium.v6';
const SUPABASE_URL = 'https://pqtbkywnklgygdludwpn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5VRpv6hE4OFaSDmlI_lhWA_64fXmehq';
const CLOUD_ID = 'bandplan-shared-workspace';
const CLIENT_ID = (() => {
  const k = 'bandplan.client.id';
  let v = localStorage.getItem(k);
  if (!v) { v = uid('client'); localStorage.setItem(k, v); }
  return v;
})();
const cloud = {
  client: null,
  ready: false,
  applying: false,
  timer: null,
  channel: null,
  initialized: false
};

function defaults() {
  return {
    profile: { name: '', role: '', bandName: 'Моя группа', bandDesc: '', defaultParticipation: 'yes', roles: [] },
    members: [], events: [], songs: [], setlists: [],
    settings: {
      theme: 'light', accent: '#2547D0', notation: 'auto', weekStart: 1,
      lyricsSize: 15, sceneSize: 26, sceneSpeed: 60, autoscroll: true, reduced: false, calView: 'month', toastMode: 'off', showChords: true
    },
    onboardingDone: false
  };
}
let state = defaults();
const ui = {
  month: new Date(), selDate: today(), calView: 'month',
  evQuery: '', evTypes: [], evMine: false, evRepeat: false,
  songQuery: '', songKey: '', songTag: '', songSort: 'title', songFav: false,
  libQuery: '', detailTrans: {}, searchQ: '', searchIdx: 0, searchFlat: [], skeleton: false
};

function normalizeState(d) {
  const base = defaults();
  const src = d && typeof d === 'object' ? d : {};
  state = Object.assign(base, src);
  state.profile = Object.assign(base.profile, src.profile || {});
  state.settings = Object.assign(base.settings, src.settings || {});
  state.members = Array.isArray(src.members) ? src.members : [];
  state.events = Array.isArray(src.events) ? src.events : [];
  state.songs = Array.isArray(src.songs) ? src.songs : [];
  state.setlists = Array.isArray(src.setlists) ? src.setlists : [];
  if (!state.settings.accent || ['#6c5ce7', '#2f55d4'].indexOf(String(state.settings.accent).toLowerCase()) >= 0) state.settings.accent = '#2547D0';
  return state;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem('bandplan.premium.v5') || localStorage.getItem('bandplan.premium.v4');
    if (!raw) return false;
    normalizeState(JSON.parse(raw));
    return true;
  } catch (e) { state = defaults(); return false; }
}

function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast('Не удалось сохранить локальные данные', 'err'); }
}

function save() {
  saveLocal();
  queueCloudSave();
}

function commit() { save(); render(); }

function setNetworkState(label) {
  const bar = $('#netBar');
  if (!bar) return;
  if (label === 'cloud') {
    bar.hidden = false;
    bar.innerHTML = ic('checkCircle', 16) + '<span>Синхронизировано с облаком</span>';
    clearTimeout(setNetworkState._t);
    setNetworkState._t = setTimeout(() => {
      if (navigator.onLine) bar.hidden = true;
    }, 1800);
  } else if (label === 'syncing') {
    bar.hidden = false;
    bar.innerHTML = ic('bolt', 16) + '<span>Синхронизация…</span>';
  } else if (label === 'error') {
    bar.hidden = false;
    bar.innerHTML = ic('alert', 16) + '<span>Облако недоступно — изменения сохранены на этом устройстве</span>';
  }
}

function queueCloudSave() {
  if (!cloud.ready || cloud.applying || !cloud.client) return;
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(pushCloudState, 260);
}

async function pushCloudState() {
  if (!cloud.ready || cloud.applying || !cloud.client || !navigator.onLine) return;
  setNetworkState('syncing');
  const payload = {
    id: CLOUD_ID,
    state: JSON.parse(JSON.stringify(state)),
    client_id: CLIENT_ID,
    updated_at: new Date().toISOString()
  };
  const { error } = await cloud.client.from('bandplan_state').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.warn('[BandPlan] Supabase save failed', error);
    setNetworkState('error');
  } else {
    setNetworkState('cloud');
  }
}

function applyCloudState(remote) {
  if (!remote || !remote.state || typeof remote.state !== 'object') return;
  cloud.applying = true;
  normalizeState(remote.state);
  saveLocal();
  applyTheme();
  applyAccentVars();
  cloud.applying = false;
  ui.skeleton = false;
  render();
}

async function initCloud() {
  if (cloud.initialized) return;
  cloud.initialized = true;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('[BandPlan] Supabase client is unavailable');
    return;
  }
  cloud.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  try {
    const { data, error } = await cloud.client.from('bandplan_state').select('id,state,updated_at').eq('id', CLOUD_ID).maybeSingle();
    if (error) throw error;
    cloud.ready = true;
    if (data && data.state) {
      applyCloudState(data);
    } else if (!data) {
      await pushCloudState();
    }

    cloud.channel = cloud.client.channel('bandplan-state-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bandplan_state', filter: 'id=eq.' + CLOUD_ID },
        payload => {
          if (payload.eventType === 'DELETE') return;
          const remote = payload.new;
          if (remote && remote.client_id !== CLIENT_ID) applyCloudState(remote);
        })
      .subscribe();
  } catch (e) {
    console.warn('[BandPlan] Supabase init failed', e);
    setNetworkState('error');
  }
}

const songById = id => state.songs.find(s => s.id === id);
const evById = id => state.events.find(e => e.id === id);
const slById = id => state.setlists.find(s => s.id === id);
const memById = id => state.members.find(m => m.id === id);

/* ═══ 5B. DEMO DATA TOOL (manual only) ═══ */
function seedDemo() {
  const now = today();
  const plus = d => { const x = new Date(now + 'T00:00:00'); x.setDate(x.getDate() + d); return iso(x); };
  state.profile = Object.assign(state.profile, { bandName: 'Neon Coast', bandDesc: 'Демонстрационный состав' });
  state.members = [
    { id: uid('mem'), name: 'Аня Соколова', role: 'vocal', roles: ['vocal'], status: 'active' },
    { id: uid('mem'), name: 'Марк Гринёв', role: 'guitar', roles: ['guitar'], status: 'active' },
    { id: uid('mem'), name: 'Тимур Валеев', role: 'drums', roles: ['drums'], status: 'active' },
    { id: uid('mem'), name: 'Лена Ким', role: 'keys', roles: ['keys'], status: 'active' }
  ];
  state.songs = [
    { id: uid('song'), title: 'Город не спит', artist: 'Neon Coast', key: 'Am', bpm: 96, duration: 238, tags: ['city','live'], favorite: true, lyrics: '[Intro]\nAm  F  C  G\n\n[Verse]\n[Am]Ночной город не спит\n[F]И музыка звучит', modified: new Date().toISOString() },
    { id: uid('song'), title: 'Северный ветер', artist: 'Neon Coast', key: 'Em', bpm: 82, duration: 264, tags: ['ballad'], favorite: false, lyrics: '[Verse]\nEm  C  G  D\n\n[Em]Северный ветер', modified: new Date().toISOString() },
    { id: uid('song'), title: 'Эхо', artist: 'Neon Coast', key: 'C', bpm: 118, duration: 202, tags: ['pop'], favorite: false, lyrics: '[Chorus]\nC  G  Am  F\n\n[C]Эхо в пустом городе', modified: new Date().toISOString() },
    { id: uid('song'), title: 'Тише воды', artist: 'Neon Coast', key: 'G', bpm: 74, duration: 251, tags: ['slow'], favorite: false, lyrics: '[Verse]\nG  D  Em  C\n\n[G]Тише воды', modified: new Date().toISOString() },
    { id: uid('song'), title: '220 вольт', artist: 'Neon Coast', key: 'D', bpm: 132, duration: 196, tags: ['rock'], favorite: false, lyrics: '[Chorus]\nD  A  Bm  G\n\n[D]Двести двадцать вольт', modified: new Date().toISOString() },
    { id: uid('song'), title: 'Маршрут построен', artist: 'Neon Coast', key: 'F#m', bpm: 108, duration: 225, tags: ['drive'], favorite: true, lyrics: '[Intro]\nF#m  D  A  E\n\n[F#m]Маршрут построен', modified: new Date().toISOString() }
  ];
  state.events = [
    { id: uid('ev'), title: 'Репетиция', date: plus(1), time: '19:00', end: '21:00', type: 'rehearsal', location: 'Студия', status: 'confirmed', participantIds: state.members.map(m => m.id), setlistId: null },
    { id: uid('ev'), title: 'Концерт', date: plus(5), time: '20:00', end: '22:30', type: 'gig', location: 'Клуб', status: 'confirmed', participantIds: state.members.map(m => m.id), setlistId: null }
  ];
  state.setlists = [{ id: uid('sl'), name: 'Демо-сет', eventId: state.events[1].id, items: state.songs.slice(0,4).map(s => ({ songId: s.id, note: '' })) }];
  state.onboardingDone = true;
  save(); render();
  toast('Демо-данные загружены вручную', 'info');
}

/* ═══ 6. EVENTS ENGINE ═══ */
function expand(from, to) {
  const out = [], f = typeof from === 'string' ? from : iso(from), t = typeof to === 'string' ? to : iso(to);
  state.events.forEach(function (ev) {
    if (ev.status === 'cancelled') return;
    const ex = ev.except || [];
    if (!ev.repeat || ev.repeat === 'none') { if (ev.date >= f && ev.date <= t) out.push({ ev: ev, date: ev.date }); return; }
    const d = new Date(ev.date + 'T00:00:00');
    const until = ev.repeatUntil ? new Date(ev.repeatUntil + 'T00:00:00') : new Date(t + 'T00:00:00');
    const stop = until < new Date(t + 'T00:00:00') ? until : new Date(t + 'T00:00:00');
    let guard = 0;
    while (d <= stop && guard++ < 400) {
      const k = iso(d);
      if (k >= f && ex.indexOf(k) < 0) out.push({ ev: ev, date: k });
      if (ev.repeat === 'weekly') d.setDate(d.getDate() + 7);
      else if (ev.repeat === 'biweekly') d.setDate(d.getDate() + 14);
      else if (ev.repeat === 'monthly') d.setMonth(d.getMonth() + 1);
      else break;
    }
  });
  out.sort((a, b) => (a.date + (a.ev.time || '')).localeCompare(b.date + (b.ev.time || '')));
  return out;
}
const upcoming = n => expand(today(), iso(new Date(Date.now() + 86400000 * 400))).filter(o => o.date >= today()).slice(0, n || 999);
const evType = t => EV_TYPES[t] || EV_TYPES.meeting;
const setlistDur = sl => (sl.items || []).reduce((a, it) => { const s = songById(it.songId); return a + (s ? s.duration || 0 : 0); }, 0);
const finalKey = (s, sh) => s && s.key ? transposeKey(s.key, sh || 0) : '—';

/* ═══ 8. TOASTS / MODAL / CONFIRM ═══ */
const TOAST_ICONS = { ok: 'checkCircle', err: 'alert', warn: 'alert', info: 'info' };
function toastAllowed(t) { const m = state.settings.toastMode || 'off'; return m === 'all' || (m === 'important' && (t === 'err' || t === 'warn')); }
function toast(msg, type, ms) {
  if (!msg || !toastAllowed(type)) return;
  const w = $('#toasts'); if (!w) return;
  const t = type || 'info', life = ms || 4200;
  const el = document.createElement('div');
  el.className = 'toast ' + t; el.setAttribute('role', t === 'err' ? 'alert' : 'status');
  el.innerHTML = '<span class="ti">' + ic(TOAST_ICONS[t] || 'info', 18) + '</span><span class="tt">' + esc(msg) + '</span>' +
    '<button class="tc" type="button" aria-label="Закрыть уведомление">' + ic('x', 15) + '</button>' +
    '<i class="tbar" style="animation-duration:' + life + 'ms"></i>';
  w.appendChild(el);
  while (w.children.length > 3) dismiss(w.firstElementChild);
  const kill = () => dismiss(el);
  $('.tc', el).addEventListener('click', kill);
  el.addEventListener('click', e => { if (!e.target.closest('.tc')) kill(); });
  const timer = setTimeout(kill, life);
  el.addEventListener('mouseenter', () => { clearTimeout(timer); el.classList.remove('run'); });
  requestAnimationFrame(() => el.classList.add('run'));
  function dismiss(node) {
    if (!node || node.dataset.closed) return;
    node.dataset.closed = '1'; clearTimeout(timer);
    node.classList.add('out'); setTimeout(() => node.remove(), 220);
  }
}
let modalRoot = null, confirmCb = null, lastFocus = null, modalDirty = false, trapHandler = null;
function closeModal(force) {
  if (!modalRoot) return;
  if (modalDirty && !force) {
    const keep = modalRoot; modalDirty = false;
    confirmBox('Закрыть без сохранения?', 'Внесённые изменения будут потеряны.', function () { modalDirty = false; hardClose(keep); }, 'Закрыть без сохранения', true);
    return;
  }
  hardClose(modalRoot);
}
function hardClose(node) {
  const ov = $('#modalOverlay');
  if (node && node.parentNode === ov) node.remove();
  if (!ov.children.length) { ov.classList.remove('on'); ov.innerHTML = ''; }
  modalRoot = ov.querySelector('.modal-card') || null;
  confirmCb = null; modalDirty = false;
  if (trapHandler) { document.removeEventListener('keydown', trapHandler); trapHandler = null; }
  if (!modalRoot && !$('#scene').classList.contains('on')) document.body.style.overflow = '';
  if (lastFocus && lastFocus.focus && !modalRoot) { try { lastFocus.focus(); } catch (e) { } lastFocus = null; }
  updateDirtyNote();
}
function updateDirtyNote() { const n = $('.dirty-note'); if (n) n.classList.toggle('on', modalDirty); }
function openModal(o) {
  if (modalRoot) hardClose(modalRoot);
  lastFocus = document.activeElement; modalDirty = false;
  const ov = $('#modalOverlay');
  ov.innerHTML = '<div class="modal-card ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-labelledby="mTitle">' +
    '<div class="modal-head"><div style="min-width:0"><h3 id="mTitle">' + esc(o.title || '') + '</h3>' +
    (o.sub ? '<div class="sub">' + esc(o.sub) + '</div>' : '') + '</div>' +
    '<button class="icon-btn" type="button" data-act="modal-close" aria-label="Закрыть окно">' + ic('x', 18) + '</button></div>' +
    '<div class="modal-body">' + (o.body || '') + '</div>' +
    (o.footer ? '<div class="modal-foot">' + (o.guard === false ? '' : '<span class="dirty-note">' + ic('info', 14) + 'Есть несохранённые изменения</span>') + o.footer + '</div>' : '') + '</div>';
  ov.classList.add('on');
  modalRoot = ov.firstElementChild;
  document.body.style.overflow = 'hidden';
  ov.onmousedown = e => { if (e.target === ov) closeModal(); };
  trapHandler = function (e) {
    if (e.key !== 'Tab' || !modalRoot) return;
    const f = $$('a[href],button:not([disabled]),input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])', modalRoot).filter(x => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', trapHandler);
  modalRoot.addEventListener('input', function (e) { if (e.target.closest('[data-no-dirty]')) return; modalDirty = true; updateDirtyNote(); });
  modalRoot.addEventListener('change', function () { modalDirty = true; updateDirtyNote(); });
  if (o.onMount) setTimeout(() => o.onMount(modalRoot), 20);
  setTimeout(() => { const f = $('input:not([type=hidden]),select,textarea', modalRoot); if (f && f.focus) f.focus(); }, 90);
  return modalRoot;
}
function confirmBox(title, text, onYes, yesLabel, danger) {
  confirmCb = onYes;
  openModal({
    title: title, body: '<p style="font-size:15px;line-height:1.65;color:var(--text-2)">' + esc(text) + '</p>', guard: false,
    footer: '<button class="btn btn-secondary" type="button" data-act="modal-close">Отмена</button><button class="btn ' + (danger ? 'btn-danger-solid' : 'btn-primary') + '" type="button" data-act="confirm-yes">' + esc(yesLabel || 'Подтвердить') + '</button>'
  });
  modalDirty = false;
}
const fv = id => { const e = $('#' + id, modalRoot || document); return e ? String(e.value).trim() : ''; };
function fieldError(inputId, msg) {
  const inp = $('#' + inputId, modalRoot);
  if (inp) {
    const f = inp.closest('.field');
    if (f) { f.classList.add('invalid'); const e = $('.err', f); if (e) e.innerHTML = ic('alert', 13) + '<span>' + esc(msg) + '</span>'; }
    inp.focus();
  }
  toast(msg, 'warn');
}

/* ═══ 9. ROUTER / NAV ═══ */
const TABS = [
  { k: 'calendar', t: 'Календарь', i: 'calendar', h: '#/calendar' },
  { k: 'songs', t: 'Песни', i: 'music', h: '#/songs' },
  { k: 'setlists', t: 'Сет-листы', i: 'list', h: '#/setlists' },
  { k: 'settings', t: 'Настройки', i: 'gear', h: '#/settings' }
];
const HEADERS = {
  calendar: ['Расписание', 'Выступления, репетиции и записи группы · месяц, неделя и день'],
  songs: ['Репертуар', 'Тексты с аккордами, тональности, темп и динамика партий по инструментам'],
  song: ['Песня', 'Текст с аккордами, транспонирование и динамика вашей партии'],
  setlists: ['Сет-листы', 'Программы выступлений: порядок песен, тональности, переходы и заметки'],
  setlist: ['Сет-лист', 'Перетащите песни в нужном порядке и задайте параметры каждого номера'],
  settings: ['Настройки', 'Профиль, состав группы, оформление интерфейса и данные']
};
function parseHash() {
  const h = (location.hash || '#/calendar').replace(/^#\/?/, '');
  const p = h.split('/').filter(Boolean);
  return { name: p[0] || 'calendar', id: p[1] || null };
}
function go(h) { if (location.hash === h) render(); else location.hash = h; }
const navKey = n => n === 'song' ? 'songs' : n === 'setlist' ? 'setlists' : n;

function buildChrome() {
  const up = upcoming().length, cur = navKey(parseHash().name);
  $('#sideNav').innerHTML = TABS.map(n =>
    '<a class="nav-item" href="' + n.h + '" data-nav="' + n.k + '"' + (cur === n.k ? ' aria-current="page"' : '') + '>' + ic(n.i, 19) +
    '<span>' + n.t + '</span>' + (n.k === 'calendar' && up ? '<span class="nb">' + up + '</span>' : '') + '</a>').join('');
  $('#botNav').innerHTML = TABS.map(n =>
    '<a href="' + n.h + '" data-nav="' + n.k + '"' + (cur === n.k ? ' aria-current="page"' : '') + '>' + ic(n.i, 21) +
    '<span>' + n.t + '</span>' + (n.k === 'calendar' && up ? '<span class="nb">' + up + '</span>' : '') + '</a>').join('');

  const p = state.profile;
  $('#brandBand').textContent = p.bandName || 'Моя группа';
  $('#sideProfile').innerHTML = '<div class="av" aria-hidden="true">' + esc(((p.name || 'B').charAt(0)).toUpperCase()) + '</div>' +
    '<div style="min-width:0"><div class="nm">' + esc(p.name || 'Профиль не заполнен') + '</div><div class="rl">' + esc(rolesLabel(myRoles())) + '</div></div>';
  $('#tbAvatar').textContent = ((p.name || 'B').charAt(0)).toUpperCase();

  const th = state.settings.theme;
  const thIco = ic(th === 'light' ? 'moon' : 'sun', 18);
  const thLbl = th === 'light' ? 'Тёмная тема' : th === 'dark' ? 'AMOLED-тема' : 'Светлая тема';
  $('#themeQuick').innerHTML = thIco + '<span>' + thLbl + '</span>';
  $('#tbTheme').innerHTML = thIco; $('#tbTheme').setAttribute('aria-label', thLbl);
  $('#sceneQuick').innerHTML = ic('monitor', 18) + '<span>Сценический режим</span>';
  $('#tbCust').innerHTML = ic('palette', 19);
  $('#searchIco').innerHTML = ic('search', 19);
  $('#searchClear').innerHTML = ic('x', 16);
  $('[data-act="scene-prev"]').innerHTML = ic('left', 20);
  $('[data-act="scene-close"]').innerHTML = ic('x', 20);
  $('[data-act="scene-next"]').innerHTML = ic('right', 20);
  $('[data-act="scene-fs"]').innerHTML = ic('fs', 19);
  $('[data-act="scene-auto"]').innerHTML = ic(scene.auto ? 'pause' : 'play', 19);
}
function updateNav(k) { $$('[data-nav]').forEach(a => a.classList.toggle('active', a.getAttribute('data-nav') === k)); }

/* ═══ 10. RENDER ROOT + STATES ═══ */
function stateHTML(kind, title, text, actions) {
  const icons = { empty: 'inbox', err: 'alert', ok: 'checkCircle', search: 'search', offline: 'wifiOff' };
  return '<div class="state' + (kind === 'err' ? ' state-err' : kind === 'ok' ? ' state-ok' : '') + '">' +
    '<div class="state-ic">' + ic(icons[kind] || 'inbox', 24) + '</div>' +
    '<h4>' + esc(title) + '</h4>' + (text ? '<p>' + esc(text) + '</p>' : '') +
    (actions ? '<div class="acts">' + actions + '</div>' : '') + '</div>';
}
function skeletonHTML(n) {
  let h = '<div class="grid g3">';
  for (let i = 0; i < (n || 6); i++) h += '<div class="skel-card"><div class="skel skel-title"></div><div class="skel skel-line" style="width:82%"></div><div class="row"><div class="skel skel-badge"></div><div class="skel skel-badge"></div></div></div>';
  return h + '</div>';
}
let actionBarHTML = '';
function render() {
  const r = parseHash(), hd = HEADERS[r.name] || HEADERS.calendar;
  document.body.setAttribute('data-route', r.name);
  buildChrome(); updateNav(navKey(r.name));
  const sw = $('#searchWrap');
  if (sw) {
    sw.style.display = r.name === 'calendar' ? '' : 'none';
    if (r.name !== 'calendar') { closeSearch(); sw.classList.remove('has-q'); }
    $('#globalSearch').setAttribute('aria-expanded', 'false');
  }
  let acts = '', crumb = '';
  actionBarHTML = '';
  if (r.name === 'calendar') acts = '<button class="btn btn-secondary" type="button" data-act="cal-today">' + ic('target', 17) + 'Сегодня</button><button class="btn btn-primary" type="button" data-act="new-event">' + ic('plus', 17) + 'Новое событие</button>';
  else if (r.name === 'songs') acts = '<button class="btn btn-secondary ph-only-desktop" type="button" data-act="song-filter-open">' + ic('filter', 17) + 'Фильтры</button><button class="btn btn-primary" type="button" data-act="new-song">' + ic('plus', 17) + 'Добавить песню</button>';
  else if (r.name === 'setlists') acts = '<button class="btn btn-primary" type="button" data-act="new-setlist">' + ic('plus', 17) + 'Создать сет-лист</button>';
  else if (r.name === 'song') {
    crumb = '<nav class="crumb" aria-label="Хлебные крошки"><a href="#/songs">Репертуар</a>' + ic('right', 12) + '<span class="nowrap">' + esc((songById(r.id) || {}).title || '') + '</span></nav>';
    acts = '<button class="btn btn-secondary" type="button" data-act="print-song" data-id="' + esc(r.id) + '">' + ic('print', 17) + 'Печать</button><button class="btn btn-primary" type="button" data-act="edit-song" data-id="' + esc(r.id) + '">' + ic('edit', 17) + 'Изменить песню</button>';
    actionBarHTML = '<div class="actionbar"><button class="btn btn-secondary btn-icon" type="button" data-act="edit-song" data-id="' + esc(r.id) + '" aria-label="Изменить песню">' + ic('edit', 18) + '</button><button class="btn btn-secondary btn-icon" type="button" data-act="print-song" data-id="' + esc(r.id) + '" aria-label="Печать песни">' + ic('print', 18) + '</button><button class="btn btn-primary" type="button" data-act="scene-song" data-id="' + esc(r.id) + '">' + ic('monitor', 17) + 'Открыть на сцене</button></div>';
  } else if (r.name === 'setlist') {
    crumb = '<nav class="crumb" aria-label="Хлебные крошки"><a href="#/setlists">Сет-листы</a>' + ic('right', 12) + '<span class="nowrap">' + esc((slById(r.id) || {}).name || '') + '</span></nav>';
    acts = '<button class="btn btn-secondary" type="button" data-act="print-setlist" data-id="' + esc(r.id) + '">' + ic('print', 17) + 'Печать</button><button class="btn btn-primary" type="button" data-act="scene-setlist" data-id="' + esc(r.id) + '">' + ic('monitor', 17) + 'Открыть на сцене</button>';
    actionBarHTML = '<div class="actionbar"><button class="btn btn-secondary btn-icon" type="button" data-act="print-setlist" data-id="' + esc(r.id) + '" aria-label="Печать сет-листа">' + ic('print', 18) + '</button><button class="btn btn-primary" type="button" data-act="scene-setlist" data-id="' + esc(r.id) + '">' + ic('monitor', 17) + 'Открыть на сцене</button></div>';
  } else if (r.name === 'settings') acts = '<button class="btn btn-secondary" type="button" data-act="export">' + ic('dl', 17) + 'Скачать копию</button>';
  $('#pageHead').innerHTML = '<div style="min-width:0;flex:1">' + crumb + '<h1>' + esc(hd[0]) + '</h1><p class="sub">' + esc(hd[1]) + '</p></div>' +
    (acts ? '<div class="ph-acts">' + acts + '</div>' : '');
  document.body.setAttribute('data-actionbar', actionBarHTML ? '1' : '0');

  const v = $('#view');
  if (ui.skeleton) {
    v.innerHTML = skeletonHTML(r.name === 'songs' ? 6 : 3);
    setTimeout(function () { ui.skeleton = false; render(); }, 170);
    return;
  }
  try {
    let html = '';
    if (r.name === 'calendar') html = vCalendar();
    else if (r.name === 'songs') html = vSongs();
    else if (r.name === 'song') html = vSong(r.id);
    else if (r.name === 'setlists') html = vSetlists();
    else if (r.name === 'setlist') html = vSetlist(r.id);
    else if (r.name === 'settings') html = vSettings();
    else html = '<div class="card">' + stateHTML('err', 'Раздел не найден', 'Проверьте адрес или вернитесь в расписание.', '<a class="btn btn-primary" href="#/calendar">Открыть расписание</a>') + '</div>';
    v.innerHTML = html + (actionBarHTML || '');
  } catch (err) {
    v.innerHTML = '<div class="card">' + stateHTML('err', 'Не удалось отобразить раздел', 'Данные сохранены локально. Облако временно недоступно — повторите попытку позже.', '<button class="btn btn-primary" type="button" data-act="reload-view">Повторить</button>') + '</div>';
  }
  afterRender(r);
}
function afterRender(r) {
  if (r.name === 'setlist' && r.id) bindDnD(r.id);
  if (r.name === 'settings') bindSettings();
  if (r.name === 'calendar') scrollTimeGrid();
}
function scrollTimeGrid() { const sc = $('#tgScroll'); if (sc) { const n = new Date(); sc.scrollTop = clamp((n.getHours() - 8) * 48, 0, 800); } }

/* ═══ 11. CALENDAR + HERO ═══ */
function heroHTML() {
  const up = upcoming(), next = up[0], p = state.profile;
  return '<section class="hero rise" aria-labelledby="heroH"><div class="hero-in"><div>' +
    '<span class="hero-eyebrow">' + ic('bolt', 12) + esc(p.bandName || 'Моя группа') + (p.role ? ' · ' + esc(rolesLabel(myRoles())) : '') + '</span>' +
    '<h1 id="heroH">' + esc(next ? 'Ближайшее: ' + next.ev.title : 'Расписание группы под контролем') + '</h1>' +
    '<p class="hero-sub">' + esc(next
      ? pdateFull(next.date) + (next.ev.time ? ', начало в ' + next.ev.time : '') + ' · ' + countdown(next.date) + (next.ev.location ? ' · ' + next.ev.location : '')
      : 'Соберите репертуар, запланируйте репетиции и выступления, отметьте участие и выходите на сцену с готовой программой.') + '</p>' +
    '<div class="hero-cta">' +
    (next ? '<button class="btn btn-primary btn-lg" type="button" data-act="event-edit" data-id="' + esc(next.ev.id) + '">' + ic('calendar', 18) + 'Открыть событие</button>'
      : '<button class="btn btn-primary btn-lg" type="button" data-act="new-event">' + ic('plus', 18) + 'Создать событие</button>') +
    '<button class="btn btn-tertiary btn-lg" type="button" data-act="scene-quick">' + ic('monitor', 18) + 'Сценический режим</button></div>' +
    '<div class="hero-metrics">' +
    heroMetric(up.length, 'предстоящих ' + plural(up.length, 'событие', 'события', 'событий')) +
    heroMetric(state.songs.length, 'песен в репертуаре') +
    heroMetric(state.setlists.length, plural(state.setlists.length, 'сет-лист', 'сет-листа', 'сет-листов')) +
    heroMetric(state.members.length, 'участников в составе') +
    '</div></div>' +
    '</div></section>';
}
function heroMetric(v, l) { return '<div class="hero-metric"><div class="v">' + v + '</div><div class="l">' + esc(l) + '</div></div>'; }
function vCalendar() {
  const m = ui.month, y = m.getFullYear(), mo = m.getMonth();
  let h = heroHTML();
  h += '<section class="card rise" style="animation-delay:.04s" aria-labelledby="calH"><div class="cal-head">' +
    '<div class="row-ns" style="gap:var(--s2)">' +
    '<button class="icon-btn lg" type="button" data-act="cal-nav" data-d="-1" aria-label="Предыдущий период">' + ic('left', 18) + '</button>' +
    '<h2 class="cal-title" id="calH" aria-live="polite">' + esc(calTitle()) + '</h2>' +
    '<button class="icon-btn lg" type="button" data-act="cal-nav" data-d="1" aria-label="Следующий период">' + ic('right', 18) + '</button>' +
    '<button class="btn btn-tertiary btn-sm" type="button" data-act="cal-today">Сегодня</button></div>' +
    '<div class="seg" role="tablist" aria-label="Вид расписания">' +
    [['month', 'Месяц', 'grid'], ['week', 'Неделя', 'rows'], ['day', 'День', 'target']].map(v =>
      '<button role="tab" aria-selected="' + (ui.calView === v[0]) + '" type="button" data-act="cal-view" data-v="' + v[0] + '" class="' + (ui.calView === v[0] ? 'on' : '') + '" data-accent="1">' + ic(v[2], 14) + v[1] + '</button>').join('') +
    '</div></div>';
  if (ui.calView === 'month') h += monthHTML(y, mo);
  else if (ui.calView === 'week') h += weekHTML(weekStart(ui.month));
  else h += dayHTML(ui.selDate || today());
  h += '</section>';

  const list = filteredUpcoming(), ac = evFilterActive();
  h += '<div class="toolbar mt">' +
    '<div class="tb-search grow">' + ic('search', 18) +
    '<label class="sr-only" for="evQ">Поиск участий</label>' +
    '<input id="evQ" type="search" placeholder="Поиск по названию, месту или заметке" value="' + esc(ui.evQuery) + '" style="border:none;background:none;outline:none;font-size:var(--fs-body-s);flex:1;min-width:0;box-shadow:none">' +
    (ui.evQuery ? '<button class="icon-btn" type="button" data-act="ev-clear" aria-label="Очистить поиск" style="width:34px;height:34px">' + ic('x', 15) + '</button>' : '') + '</div>' +
    '<button class="btn ' + (ac ? 'btn-primary' : 'btn-secondary') + '" type="button" data-act="ev-filter-open">' + ic('filter', 17) + 'Фильтры' + (ac ? ' · ' + evFilterCount() : '') + '</button></div>';
  if (ac || ui.evQuery) h += '<div class="active-chips"><span class="lbl">Активные фильтры:</span>' +
    (ui.evQuery ? '<button class="chip" type="button" data-act="ev-clear">' + ic('search', 13) + '«' + esc(ui.evQuery) + '»<span class="rm">×</span></button>' : '') +
    ui.evTypes.map(t => '<button class="chip" type="button" data-act="ev-type" data-v="' + t + '">' + esc(evType(t).label) + '<span class="rm">×</span></button>').join('') +
    (ui.evMine ? '<button class="chip" type="button" data-act="ev-mine">Только я участвую<span class="rm">×</span></button>' : '') +
    (ui.evRepeat ? '<button class="chip" type="button" data-act="ev-repeat">Повторяющиеся<span class="rm">×</span></button>' : '') +
    '<button class="btn btn-tertiary btn-sm" type="button" data-act="ev-reset">Сбросить</button></div>';

  h += '<section class="card rise" style="animation-delay:.07s" aria-labelledby="upH"><div class="card-h"><div><h2 id="upH">Ближайшие участия</h2>' +
    '<div class="sub">' + list.length + ' ' + plural(list.length, 'событие', 'события', 'событий') + ' · отметьте ваше участие</div></div>' +
    '<button class="btn btn-secondary btn-sm" type="button" data-act="new-event" aria-label="Добавить событие">' + ic('plus', 15) + '<span class="btn-lbl">Добавить событие</span></button></div>';
  if (!list.length) h += stateHTML(ui.evQuery || ac ? 'search' : 'empty',
    ui.evQuery || ac ? 'Ничего не найдено' : 'Событий пока нет',
    ui.evQuery || ac ? 'Попробуйте изменить запрос или сбросить фильтры — возможно, события запланированы на другие даты.' : 'Создайте первую репетицию или выступление: укажите дату, время, место и состав.',
    (ui.evQuery || ac ? '<button class="btn btn-secondary" type="button" data-act="ev-reset">Сбросить фильтры</button>' : '') +
    '<button class="btn btn-primary" type="button" data-act="new-event">Создать событие</button>');
  else list.slice(0, 12).forEach(o => { h += evRow(o, true); });
  return h + '</section>';
}
function calTitle() {
  const d = ui.month;
  if (ui.calView === 'month') return MONF[d.getMonth()] + ' ' + d.getFullYear();
  if (ui.calView === 'week') { const s = weekStart(d), e = new Date(s); e.setDate(s.getDate() + 6); return pdate(iso(s)) + ' — ' + pdate(iso(e)); }
  return pdateFull(ui.selDate || today());
}
function weekStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() + 7 - (state.settings.weekStart === 0 ? 7 : 1)) % 7); return x; }
function evFilterActive() { return !!(ui.evTypes.length || ui.evMine || ui.evRepeat); }
function evFilterCount() { return ui.evTypes.length + (ui.evMine ? 1 : 0) + (ui.evRepeat ? 1 : 0); }
function filteredUpcoming() {
  const q = ui.evQuery.toLowerCase().trim();
  return upcoming().filter(function (o) {
    const e = o.ev;
    if (ui.evTypes.length && ui.evTypes.indexOf(e.type) < 0) return false;
    if (ui.evMine && e.myStatus !== 'yes') return false;
    if (ui.evRepeat && (!e.repeat || e.repeat === 'none')) return false;
    if (q && ((e.title || '') + ' ' + (e.location || '') + ' ' + (e.notes || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
}
function openEventFilters() {
  openModal({
    title: 'Фильтры расписания', sub: 'Применяются сразу к списку ближайших участий', guard: false,
    body: '<div class="field"><span class="field-label">Тип события</span><div class="row" style="gap:6px">' +
      Object.keys(EV_TYPES).map(t => '<button class="chip' + (ui.evTypes.indexOf(t) >= 0 ? ' on' : '') + '" type="button" data-act="ev-type" data-v="' + t + '" data-no-dirty="1" aria-pressed="' + (ui.evTypes.indexOf(t) >= 0) + '">' + ic(EV_TYPES[t].ic, 14) + esc(EV_TYPES[t].label) + '</button>').join('') + '</div></div>' +
      '<div class="field"><span class="field-label">Показывать</span><div class="row" style="gap:6px">' +
      '<button class="chip' + (ui.evMine ? ' on' : '') + '" type="button" data-act="ev-mine" data-no-dirty="1" aria-pressed="' + ui.evMine + '">' + ic('target', 14) + 'Только я участвую</button>' +
      '<button class="chip' + (ui.evRepeat ? ' on' : '') + '" type="button" data-act="ev-repeat" data-no-dirty="1" aria-pressed="' + ui.evRepeat + '">' + ic('repeat', 14) + 'Повторяющиеся</button></div></div>' +
      '<div class="field"><span class="field-label">Первый день недели</span><div class="seg">' +
      '<button type="button" data-act="weekstart-set" data-v="1" class="' + (state.settings.weekStart !== 0 ? 'on' : '') + '" data-no-dirty="1" data-accent="1">Понедельник</button>' +
      '<button type="button" data-act="weekstart-set" data-v="0" class="' + (state.settings.weekStart === 0 ? 'on' : '') + '" data-no-dirty="1" data-accent="1">Воскресенье</button></div></div>',
    footer: '<button class="btn btn-secondary" type="button" data-act="ev-reset">Сбросить фильтры</button>' +
      '<button class="btn btn-primary" type="button" data-act="modal-close" id="evFilterDone">Показать ' + filteredUpcoming().length + '</button>',
    onMount: function (w) {
      const upd = () => { const b = $('#evFilterDone', w); if (b) b.textContent = 'Показать ' + filteredUpcoming().length; };
      w.addEventListener('click', e => { if (e.target.closest('[data-act^="ev-"],[data-act="weekstart-set"]')) setTimeout(upd, 0); });
    }
  });
}
function monthHTML(y, mo) {
  const occ = expand(iso(new Date(y, mo, 1)), iso(new Date(y, mo + 1, 0)));
  const byDay = {}; occ.forEach(o => { (byDay[o.date] = byDay[o.date] || []).push(o); });
  const ws = state.settings.weekStart === 0 ? 1 : 0;
  let h = '<div class="cal-grid" role="grid" aria-label="Календарь на месяц">';
  for (let i = 0; i < 7; i++) h += '<div class="cal-wd" role="columnheader">' + WD[(ws + i) % 7] + '</div>';
  const first = new Date(y, mo, 1);
  const off = (first.getDay() + 7 - (state.settings.weekStart === 0 ? 7 : 1)) % 7;
  const gs = new Date(y, mo, 1 - off);
  for (let i = 0; i < 42; i++) {
    const d = new Date(gs); d.setDate(gs.getDate() + i);
    const k = iso(d), list = byDay[k] || [];
    const cls = ['cal-cell'];
    if (d.getMonth() !== mo) cls.push('out');
    if (k === today()) cls.push('today');
    if (k === ui.selDate) cls.push('sel');
    h += '<div class="' + cls.join(' ') + '" role="gridcell" tabindex="0" aria-label="' + esc(d.getDate() + ' ' + MONF[d.getMonth()] + ', событий: ' + list.length) + '" data-act="cal-day" data-date="' + k + '">' +
      '<div class="cal-num">' + d.getDate() + (k === today() ? '<i class="cal-dot-today" aria-hidden="true"></i>' : '') + '</div>';
    list.slice(0, 3).forEach(o => { h += '<div class="cal-ev ce-' + o.ev.type + '" data-act="event-edit" data-id="' + o.ev.id + '" role="button" tabindex="-1">' + esc(o.ev.time || '') + ' ' + esc(o.ev.title) + '</div>'; });
    if (list.length > 3) h += '<div class="cal-more">ещё ' + (list.length - 3) + '</div>';
    h += '</div>';
  }
  h += '</div><div class="cal-legend">' + Object.keys(EV_TYPES).map(t =>
    '<span><i style="background:' + EV_TYPES[t].color + '" aria-hidden="true"></i>' + EV_TYPES[t].label + '</span>').join('') + '</div>';
  return h;
}
const H0 = 7, H1 = 24, HPH = 48;
function timeGrid(days) {
  const n = days.length;
  const from = new Date(days[0]); from.setHours(H0, 0, 0, 0);
  const to = new Date(days[n - 1]); to.setHours(H1, 0, 0, 0);
  const occ = expand(from, to), height = (H1 - H0) * HPH, todayK = today(), colMin = n > 2 ? 92 : 0;
  let h = '<div class="tg-wrap"><div class="tg-scroll" id="tgScroll"><div class="tg-grid" style="--cols:' + n + ';grid-template-columns:48px repeat(' + n + ',minmax(' + colMin + 'px,1fr))">';
  h += '<div class="tg-corner"></div>';
  days.forEach(function (d) {
    const k = iso(d);
    h += '<div class="tg-hc' + (k === todayK ? ' now' : '') + '" role="button" tabindex="0" data-act="tg-day" data-date="' + k + '" aria-label="Открыть день ' + esc(pdate(k)) + '">' + WD[(d.getDay() + 6) % 7] + '<b>' + d.getDate() + '</b></div>';
  });
  h += '<div class="tg-times" style="height:' + height + 'px" aria-hidden="true">';
  for (let i = H0; i < H1; i++) h += '<div class="tg-h">' + pad(i) + ':00</div>';
  h += '</div>';
  days.forEach(function (d) {
    const k = iso(d);
    h += '<div class="tg-col' + (k === todayK ? ' now' : '') + '" style="height:' + height + 'px" data-act="tg-col" data-date="' + k + '">';
    for (let i = H0; i < H1; i++) h += '<div class="tg-line"></div>';
    occ.filter(o => o.date === k).forEach(function (o) {
      const e = o.ev, t = evType(e.type);
      const sm = clamp(mins(e.time), H0 * 60, H1 * 60), em = clamp(mins(e.end) || sm + 90, sm + 30, H1 * 60);
      const top = (sm - H0 * 60) / 60 * HPH, hh = Math.max(24, (em - sm) / 60 * HPH - 3);
      h += '<div class="tg-ev" style="top:' + top + 'px;height:' + hh + 'px;border-left-color:' + t.color + '" data-act="event-edit" data-id="' + e.id + '" role="button" tabindex="0" aria-label="' + esc(e.title + ', ' + (e.time || '') + '–' + (e.end || '')) + '">' +
        '<b>' + esc(e.title) + '</b><span>' + esc(e.time || '') + (e.end ? '–' + esc(e.end) : '') + '</span></div>';
    });
    if (k === todayK) {
      const now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
      if (nm >= H0 * 60 && nm <= H1 * 60) h += '<div class="tg-nowline" style="top:' + ((nm - H0 * 60) / 60 * HPH) + 'px" aria-hidden="true"></div>';
    }
    h += '</div>';
  });
  return h + '</div></div></div>';
}
function weekHTML(start) {
  const days = []; for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  return timeGrid(days) + '<p class="t-sm t-muted mt-s">Нажмите на день в шапке, чтобы открыть расписание на день. Пустая ячейка создаёт событие в это время.</p>';
}
function dayHTML(k) {
  const occ = expand(k, k);
  let h = timeGrid([new Date(k + 'T00:00:00')]);
  h += '<div class="card-h mt"><div><h2 style="font-size:var(--fs-body)">' + esc(pdateFull(k)) + '</h2>' +
    '<div class="sub">' + occ.length + ' ' + plural(occ.length, 'событие', 'события', 'событий') + (k === today() ? ' · сегодня' : '') + '</div></div>' +
    '<button class="btn btn-primary btn-sm" type="button" data-act="new-event" data-date="' + k + '" aria-label="Добавить событие">' + ic('plus', 15) + '<span class="btn-lbl">Добавить событие</span></button></div>';
  if (!occ.length) h += stateHTML('empty', 'Свободный день', 'Событий на эту дату нет. Добавьте репетицию или выступление.', '<button class="btn btn-primary" type="button" data-act="new-event" data-date="' + k + '">Добавить событие</button>');
  else occ.forEach(o => { h += evRow(o, true); });
  return h;
}
function evRow(o, withPart) {
  const e = o.ev, t = evType(e.type), d = new Date(o.date + 'T00:00:00');
  const done = e.status === 'done', sl = e.setlistId ? slById(e.setlistId) : null;
  const mems = (e.memberIds || []).map(memById).filter(Boolean);
  return '<article class="ev-row' + (done ? ' ev-done' : '') + '" style="--ev-c:' + esc(t.color || 'var(--accent)') + '">' +
    '<div class="ev-date" aria-hidden="true"><div class="d">' + d.getDate() + '</div><div class="m">' + MON[d.getMonth()] + '</div></div>' +
    '<div class="ev-body">' +
    '<h3 class="ev-title">' + esc(e.title) + '<span class="badge ' + t.cls + '">' + ic(t.ic, 11) + esc(t.label) + '</span>' +
    (e.repeat && e.repeat !== 'none' ? '<span class="badge b-muted">' + ic('repeat', 11) + esc(REPEATS[e.repeat]) + '</span>' : '') +
    (done ? '<span class="badge b-ok">' + ic('check', 11) + 'Проведено</span>' : '') + '</h3>' +
    '<div class="ev-meta">' +
    (e.time ? '<span>' + ic('clock', 12) + esc(e.time) + (e.end ? '–' + esc(e.end) : '') + '</span>' : '') +
    (e.location ? '<span>' + ic('pin', 12) + esc(e.location) + '</span>' : '') +
    (!done && o.date >= today() ? '<span>' + ic('bolt', 12) + esc(countdown(o.date)) + '</span>' : '') +
    (sl ? '<span>' + ic('list', 12) + esc(sl.name) + '</span>' : '') + '</div>' +
    (mems.length ? '<div class="avatars" aria-label="Состав">' + mems.slice(0, 5).map(m => '<i style="background:' + esc(m.color || 'var(--accent)') + '" title="' + esc(m.name) + '">' + esc(m.name.charAt(0).toUpperCase()) + '</i>').join('') + (mems.length > 5 ? '<i class="more">+' + (mems.length - 5) + '</i>' : '') + '</div>' : '') +
    (withPart && !done ? '<div class="part-switch" role="group" aria-label="Ваше участие">' + [['yes', 'Участвую', 'check'], ['maybe', 'Под вопросом', 'info'], ['no', 'Не участвую', 'x']].map(p =>
      '<button class="part-btn' + (e.myStatus === p[0] ? ' on' : '') + '" type="button" data-v="' + p[0] + '" data-act="my-status" data-id="' + e.id + '" aria-pressed="' + (e.myStatus === p[0]) + '">' + ic(p[2], 12) + '<span>' + p[1] + '</span></button>').join('') + '</div>' : '') +
    '</div>' +
    '<div class="ev-acts">' +
    (sl ? '<button class="icon-btn" type="button" data-act="scene-setlist" data-id="' + sl.id + '" aria-label="Открыть сет-лист на сцене">' + ic('monitor', 16) + '<span class="ia-t">Сцена</span></button>' : '') +
    '<button class="icon-btn" type="button" data-act="event-edit" data-id="' + e.id + '" aria-label="Изменить событие">' + ic('edit', 16) + '<span class="ia-t">Изменить</span></button>' +
    (done ? '<button class="icon-btn" type="button" data-act="event-undone" data-id="' + e.id + '" aria-label="Вернуть в план">' + ic('repeat', 16) + '<span class="ia-t">В план</span></button>'
      : '<button class="icon-btn" type="button" data-act="event-done" data-id="' + e.id + '" aria-label="Отметить проведённым">' + ic('check', 16) + '<span class="ia-t">Готово</span></button>') +
    '<button class="icon-btn ia-danger" type="button" data-act="event-del" data-id="' + e.id + '" data-date="' + o.date + '" aria-label="Удалить событие">' + ic('trash', 16) + '<span class="ia-t">Удалить</span></button>' +
    '</div></article>';
}

/* ═══ 12. SONGS ═══ */
function allTags() { const s = {}; state.songs.forEach(x => (x.tags || []).forEach(t => { if (t) s[t] = 1; })); return Object.keys(s).sort(); }
function filteredSongs() {
  let l = state.songs.slice();
  const q = ui.songQuery.toLowerCase().trim();
  if (q) l = l.filter(s => ((s.title || '') + ' ' + (s.artist || '') + ' ' + (s.tags || []).join(' ') + ' ' + (s.lyrics || '')).toLowerCase().indexOf(q) >= 0);
  if (ui.songKey) l = l.filter(s => s.key === ui.songKey);
  if (ui.songTag) l = l.filter(s => (s.tags || []).indexOf(ui.songTag) >= 0);
  if (ui.songFav) l = l.filter(s => s.fav);
  const cmp = {
    title: (a, b) => a.title.localeCompare(b.title, 'ru'),
    artist: (a, b) => (a.artist || '').localeCompare(b.artist || '', 'ru'),
    key: (a, b) => String(a.key || 'z').localeCompare(String(b.key || 'z')),
    bpm: (a, b) => (b.bpm || 0) - (a.bpm || 0),
    added: (a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || ''))
  }[ui.songSort] || ((a, b) => a.title.localeCompare(b.title, 'ru'));
  return l.sort(cmp);
}
function songFilterActive() { return !!(ui.songKey || ui.songTag || ui.songFav || ui.songSort !== 'title'); }
function vSongs() {
  const list = filteredSongs(), tags = allTags();
  let h = '<div class="toolbar">' +
    '<div class="tb-search grow">' + ic('search', 18) + '<label class="sr-only" for="songQ">Поиск песен</label>' +
    '<input id="songQ" type="search" placeholder="Название, автор, текст, тег" value="' + esc(ui.songQuery) + '" style="border:none;background:none;outline:none;font-size:var(--fs-body-s);flex:1;min-width:0;box-shadow:none">' +
    (ui.songQuery ? '<button class="icon-btn" type="button" data-act="song-clear" aria-label="Очистить поиск" style="width:34px;height:34px">' + ic('x', 15) + '</button>' : '') + '</div>' +
    '<button class="btn ' + (songFilterActive() ? 'btn-primary' : 'btn-secondary') + '" type="button" data-act="song-filter-open" aria-label="Фильтры">' + ic('filter', 17) + '<span class="btn-lbl">Фильтры</span></button></div>';
  if (songFilterActive() || ui.songQuery) {
    h += '<div class="active-chips"><span class="lbl">Активные фильтры:</span>' +
      (ui.songQuery ? '<button class="chip" type="button" data-act="song-clear">' + ic('search', 13) + '«' + esc(ui.songQuery) + '»<span class="rm">×</span></button>' : '') +
      (ui.songKey ? '<button class="chip" type="button" data-act="song-key-clear">' + esc(ui.songKey) + '<span class="rm">×</span></button>' : '') +
      (ui.songTag ? '<button class="chip" type="button" data-act="tag" data-v="">' + esc(ui.songTag) + '<span class="rm">×</span></button>' : '') +
      (ui.songFav ? '<button class="chip" type="button" data-act="fav-filter">' + ic('star', 13) + 'Избранные<span class="rm">×</span></button>' : '') +
      (ui.songSort !== 'title' ? '<button class="chip" type="button" data-act="song-sort-reset">' + esc({ artist: 'по исполнителю', key: 'по тональности', bpm: 'по темпу', added: 'недавние' }[ui.songSort] || 'сортировка') + '<span class="rm">×</span></button>' : '') +
      '<button class="btn btn-tertiary btn-sm" type="button" data-act="song-reset">Сбросить</button></div>';
  }
  h += '<p class="t-sm t-muted mb">' + list.length + ' ' + plural(list.length, 'песня', 'песни', 'песен') + ' из ' + state.songs.length + '</p>';
  if (!list.length) {
    return h + '<div class="card">' + stateHTML(state.songs.length ? 'search' : 'empty',
      state.songs.length ? 'Ничего не найдено' : 'В репертуаре пока нет песен',
      state.songs.length ? 'Попробуйте короткий запрос, снимите часть фильтров или сбросьте их полностью.' : 'Добавьте первую песню: текст, аккорды отдельной строкой, тональность, темп и динамику партий по инструментам.',
      state.songs.length ? '<button class="btn btn-secondary" type="button" data-act="song-reset">Сбросить фильтры</button><button class="btn btn-primary" type="button" data-act="new-song">Добавить песню</button>'
        : '<button class="btn btn-primary" type="button" data-act="new-song">' + ic('plus', 17) + 'Добавить первую песню</button>') + '</div>';
  }
  h += '<div class="grid g3">';
  list.forEach(function (s, i) {
    const used = state.setlists.filter(sl => (sl.items || []).some(it => it.songId === s.id)).length;
    const dyn = (s.dynamics && s.dynamics.instruments || []).length;
    h += '<article class="song-card rise" style="animation-delay:' + Math.min(i * 22, 180) + 'ms" data-act="open-song" data-id="' + s.id + '" role="link" tabindex="0" aria-label="Открыть песню ' + esc(s.title) + '">' +
      '<button class="fav' + (s.fav ? ' on' : '') + '" type="button" data-act="fav" data-id="' + s.id + '" aria-pressed="' + !!s.fav + '" aria-label="' + (s.fav ? 'Убрать из избранного' : 'В избранное') + '">' + ic('star', 18) + '</button>' +
      '<div class="song-top"><div class="key-badge" aria-hidden="true">' + esc(s.key || '—') + '</div>' +
      '<div style="min-width:0"><h3 class="song-name">' + esc(s.title) + '</h3><div class="song-artist">' + esc(s.artist || 'Исполнитель не указан') + '</div></div></div>' +
      '<div class="song-meta">' +
      (s.bpm ? '<span class="badge b-muted num">' + s.bpm + ' BPM</span>' : '') +
      (s.duration ? '<span class="badge b-muted num">' + ic('clock', 11) + fmtDur(s.duration) + '</span>' : '') +
      (dyn ? '<span class="badge b-warn">' + ic('wave', 11) + dyn + ' парт.</span>' : '<span class="badge b-muted">' + ic('wave', 11) + 'без динамики</span>') +
      (s.tags || []).slice(0, 2).map(t => '<span class="badge b-muted">' + esc(t) + '</span>').join('') +
      (used ? '<span class="badge b-ok">' + ic('list', 11) + used + '</span>' : '') + '</div>' +
      '<div class="song-acts">' +
      '<button class="btn btn-secondary btn-sm" type="button" data-act="scene-song" data-id="' + s.id + '" aria-label="Открыть на сцене">' + ic('monitor', 15) + '</button>' +
      '<button class="btn btn-secondary btn-sm" type="button" data-act="to-setlist" data-id="' + s.id + '" aria-label="Добавить в сет-лист">' + ic('list', 15) + '</button>' +
      '<button class="btn btn-secondary btn-sm" type="button" data-act="print-song" data-id="' + s.id + '" aria-label="Печать">' + ic('print', 15) + '</button>' +
      '<button class="btn btn-primary btn-sm song-open" type="button" data-act="open-song" data-id="' + s.id + '"><span class="btn-txt">Открыть</span></button></div></article>';
  });
  return h + '</div>';
}
function openSongFilters() {
  const tags = allTags();
  openModal({
    title: 'Фильтры репертуара', sub: 'Сортировка, тональность, теги и избранное', guard: false,
    body: '<div class="field"><label class="field-label" for="fSort">Сортировка</label><select class="select" id="fSort" data-no-dirty="1">' +
      [['title', 'По названию (А–Я)'], ['artist', 'По исполнителю'], ['key', 'По тональности'], ['bpm', 'По темпу (быстрые сначала)'], ['added', 'Недавно добавленные']]
        .map(o => '<option value="' + o[0] + '"' + (ui.songSort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label class="field-label" for="fKey">Тональность</label><select class="select" id="fKey" data-no-dirty="1"><option value="">Все тональности</option>' +
      KEY_LIST.map(k => '<option value="' + k + '"' + (ui.songKey === k ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div>' +
      '<div class="field"><span class="field-label">Теги</span><div class="row" style="gap:6px">' +
      '<button class="chip' + (ui.songTag ? '' : ' on') + '" type="button" data-act="tag" data-v="" data-no-dirty="1">Все</button>' +
      tags.map(t => '<button class="chip' + (ui.songTag === t ? ' on' : '') + '" type="button" data-act="tag" data-v="' + esc(t) + '" data-no-dirty="1">' + esc(t) + '</button>').join('') +
      (tags.length ? '' : '<span class="t-sm t-muted">Тегов пока нет — добавьте их в карточке песни.</span>') + '</div></div>' +
      '<div class="field"><span class="field-label">Прочее</span><div class="row" style="gap:6px">' +
      '<button class="chip' + (ui.songFav ? ' on' : '') + '" type="button" data-act="fav-filter" data-no-dirty="1" aria-pressed="' + ui.songFav + '">' + ic('star', 14) + 'Только избранные</button></div></div>' +
      '<p class="t-sm t-muted">Найдено: <b class="num" id="fCount">' + filteredSongs().length + '</b> ' + plural(filteredSongs().length, 'песня', 'песни', 'песен') + '</p>',
    footer: '<button class="btn btn-secondary" type="button" data-act="song-reset">Сбросить фильтры</button><button class="btn btn-primary" type="button" data-act="modal-close">Показать результаты</button>',
    onMount: function (w) {
      const upd = () => { const c = $('#fCount', w); if (c) c.textContent = filteredSongs().length; };
      $('#fSort', w).addEventListener('change', e => { ui.songSort = e.target.value; save(); render(); upd(); });
      $('#fKey', w).addEventListener('change', e => { ui.songKey = e.target.value; render(); upd(); });
      w.addEventListener('click', e => {
        if (e.target.closest('[data-act="tag"],[data-act="fav-filter"]')) setTimeout(function () {
          $$('#modalOverlay .chip[data-act="tag"]').forEach(b => b.classList.toggle('on', b.getAttribute('data-v') === ui.songTag));
          const f = $('#modalOverlay .chip[data-act="fav-filter"]'); if (f) { f.classList.toggle('on', ui.songFav); f.setAttribute('aria-pressed', ui.songFav); }
          upd();
        }, 0);
      });
    }
  });
}
function dynStrip(song, role) {
  const d = song.dynamics; if (!d || !(d.sections || []).length) return '';
  const lv = (d.levels && d.levels[role]) || {};
  return '<div class="dyn-strip">' + d.sections.map(function (s) {
    const v = lv[s] || '';
    return '<div class="dyn-chip ' + dynCls(v) + '"><div class="s">' + esc(s) + '</div><div class="v">' + esc(v || '—') + '</div><div class="dmeter" aria-hidden="true"><i style="width:' + (Math.max(0, DYN_LEVELS.indexOf(v)) * 100 / 6) + '%"></i></div><div class="t-xs t-muted">' + esc(DYN_LABEL[v] || 'не задано') + '</div></div>';
  }).join('') + '</div>';
}
function dynMatrix(song) {
  const d = song.dynamics; if (!d || !(d.instruments || []).length || !(d.sections || []).length) return '';
  let h = '<div class="dyn-scroll"><table class="dyn-table"><caption class="sr-only">Динамика партий по секциям песни</caption><thead><tr><th scope="col">Инструмент</th>' +
    d.sections.map(s => '<th scope="col">' + esc(s) + '</th>').join('') + '</tr></thead><tbody>';
  d.instruments.forEach(function (ins) {
    const isMe = myRoles().indexOf(ins) >= 0;
    h += '<tr><th scope="row">' + (isMe ? '<span class="badge b-brand" style="margin-right:6px">вы</span>' : '') + esc(roleLabel(ins)) + '</th>' +
      d.sections.map(function (s) {
        const v = (d.levels && d.levels[ins] && d.levels[ins][s]) || '';
        return '<td><span class="lv ' + dynCls(v) + '" title="' + esc(DYN_LABEL[v] || 'не задано') + '">' + esc(v || '—') + '</span><div class="dmeter sm" aria-hidden="true"><i style="width:' + (Math.max(0, DYN_LEVELS.indexOf(v)) * 100 / 6) + '%"></i></div></td>';
      }).join('') + '</tr>';
  });
  let tf = '<tfoot><tr><th scope="row">Общая громкость</th>' + d.sections.map(function (sc) {
    let sum = 0, cnt = 0; d.instruments.forEach(i => { const k = DYN_LEVELS.indexOf((d.levels && d.levels[i] && d.levels[i][sc]) || ''); if (k > 0) { sum += k; cnt++; } });
    const avg = cnt ? sum / cnt : 0, v = DYN_LEVELS[Math.round(avg)] || '';
    return '<td><span class="lv ' + dynCls(v) + '">' + esc(v || '—') + '</span><div class="dmeter sm" aria-hidden="true"><i style="width:' + (avg * 100 / 6) + '%"></i></div></td>';
  }).join('') + '</tr></tfoot>';
  return h + '</tbody>' + tf + '</table></div>';
}
function vSong(id) {
  const s = songById(id);
  if (!s) return '<div class="card">' + stateHTML('err', 'Песня не найдена', 'Возможно, она была удалена или ссылка устарела.', '<a class="btn btn-primary" href="#/songs">Вернуться в репертуар</a>') + '</div>';
  const tr = ui.detailTrans[s.id] || 0;
  const chords = extractChords(s.lyrics).map(c => transposeChord(c, tr));
  const used = state.setlists.filter(sl => (sl.items || []).some(it => it.songId === s.id));
  const myRole = myRoles()[0] || '';
  const mine = s.dynamics ? myRoles().filter(r => (s.dynamics.instruments || []).indexOf(r) >= 0) : [];
  const hasMy = mine.length > 0;
  let h = '<div class="split"><div class="stack">';
  h += '<section class="card rise"><div class="card-h"><div style="min-width:0"><h2 style="font-size:var(--fs-h3);overflow-wrap:anywhere">' + esc(s.title) + '</h2>' +
    '<div class="sub">' + esc(s.artist || 'Исполнитель не указан') + '</div></div>' +
    '<div class="row"><button class="icon-btn" type="button" data-act="fav" data-id="' + s.id + '" aria-pressed="' + !!s.fav + '" aria-label="Избранное" style="' + (s.fav ? 'color:var(--warn);border-color:var(--warn)' : '') + '">' + ic('star', 17) + '</button>' +
    '<button class="icon-btn" type="button" data-act="print-song" data-id="' + s.id + '" aria-label="Печать песни">' + ic('print', 17) + '</button></div></div>' +
    '<div class="trans-box"><div><div class="cap" style="margin-bottom:6px">Транспонирование</div>' +
    '<div class="row" style="gap:var(--s2)"><button class="icon-btn" type="button" data-act="song-trans" data-id="' + s.id + '" data-d="-1" aria-label="Опустить на полутон">♭</button>' +
    '<div class="trans-val" aria-live="polite">' + (tr > 0 ? '+' : '') + tr + '</div>' +
    '<button class="icon-btn" type="button" data-act="song-trans" data-id="' + s.id + '" data-d="1" aria-label="Поднять на полутон">♯</button>' +
    '<button class="btn btn-tertiary btn-sm" type="button" data-act="song-trans-reset" data-id="' + s.id + '">Сбросить</button></div></div>' +
    '<div style="margin-left:auto;text-align:right"><div class="cap" style="margin-bottom:6px">Тональность сейчас</div>' +
    '<div style="font-size:var(--fs-h3);font-weight:700;letter-spacing:-.03em">' + esc(transposeKey(s.key || '—', tr)) + '</div>' +
    (s.key && tr ? '<div class="t-xs t-muted">оригинал: ' + esc(s.key) + '</div>' : '') + '</div></div>' +
    '<div class="row mt"><button class="chip' + (state.settings.showChords !== false ? ' on' : '') + '" type="button" data-act="toggle-chords" aria-pressed="' + (state.settings.showChords !== false) + '">' + ic('music', 14) + 'Аккорды в тексте</button></div><div class="lyrics mt" style="--lsize:' + state.settings.lyricsSize + 'px">' + renderLyrics(s.lyrics, tr) + '</div></section>';
  h += '</div><div class="stack">';
  h += '<section class="card rise" style="animation-delay:.04s"><div class="card-h"><div><h2>' + ic('wave', 17) + ' Ваша динамика</h2>' +
    '<div class="sub">Роль в профиле: ' + esc(rolesLabel(myRoles())) + '</div></div>' +
    '<button class="icon-btn" type="button" data-act="edit-song" data-id="' + s.id + '" aria-label="Изменить песню">' + ic('edit', 16) + '</button></div>';
  if (!myRole) h += stateHTML('empty', 'Роль не указана', 'Выберите вашу роль в настройках — и здесь появится динамика именно вашей партии.', '<button class="btn btn-primary btn-sm" type="button" data-act="nav" data-to="settings">Указать роль</button>');
  else if (!hasMy) h += stateHTML('empty', 'Динамика не расписана', 'Для роли «' + rolesLabel(myRoles()) + '» в этой песне нет уровней громкости. Откройте «Изменить песню» → «Динамика по инструментам».', '<button class="btn btn-primary btn-sm" type="button" data-act="edit-song" data-id="' + s.id + '">Расписать динамику</button>');
  else h += mine.map(r => (mine.length > 1 ? '<h3 class="mt-s">' + esc(roleLabel(r)) + '</h3>' : '') + dynStrip(s, r)).join('') + '<p class="t-xs t-muted mt-s">pp — очень тихо · p — тихо · mp — умеренно тихо · mf — умеренно громко · f — громко · ff — очень громко</p>';
  h += '</section>';
  const m = dynMatrix(s);
  if (m) h += '<section class="card rise" style="animation-delay:.07s"><div class="card-h"><div><h2>Динамика всех партий</h2><div class="sub">' + (s.dynamics.instruments || []).length + ' ' + plural((s.dynamics.instruments || []).length, 'инструмент', 'инструмента', 'инструментов') + ' · ' + (s.dynamics.sections || []).length + ' секц.</div></div></div>' + m + '</section>';
  h += '<section class="card rise" style="animation-delay:.1s"><div class="card-h"><div><h2>Параметры песни</h2></div></div>' +
    infoRow('Тональность', '<span class="num">' + esc(transposeKey(s.key || '—', tr)) + '</span>') +
    infoRow('Темп', s.bpm ? '<span class="num">' + s.bpm + ' BPM</span>' : '—') +
    infoRow('Длительность', s.duration ? '<span class="num">' + fmtDur(s.duration) + '</span>' : '—') +
    infoRow('Теги', (s.tags || []).length ? (s.tags || []).map(t => '<span class="badge b-muted" style="margin-left:4px">' + esc(t) + '</span>').join('') : '—') +
    '<div class="row mt"><button class="btn btn-primary btn-block" type="button" data-act="scene-song" data-id="' + s.id + '">' + ic('monitor', 16) + 'Открыть на сцене</button></div>' +
    '<div class="row mt-s"><button class="btn btn-secondary btn-block" type="button" data-act="to-setlist" data-id="' + s.id + '">' + ic('list', 16) + 'Добавить в сет-лист</button></div>' +
    '<div class="row mt-s"><button class="btn btn-danger btn-block" type="button" data-act="song-del" data-id="' + s.id + '">' + ic('trash', 16) + 'Удалить песню</button></div></section>';
  if (chords.length) h += '<section class="card rise" style="animation-delay:.13s"><div class="card-h"><div><h2>Используемые аккорды</h2><div class="sub">' + chords.length + ' уникальных</div></div></div>' +
    '<div class="row" style="gap:6px">' + chords.map(c => '<span class="badge b-muted num" style="font-size:var(--fs-body-s);padding:6px 12px">' + esc(c) + '</span>').join('') + '</div></section>';
  h += '<section class="card rise" style="animation-delay:.16s"><div class="card-h"><div><h2>Входит в сет-листы</h2><div class="sub">' + used.length + '</div></div></div>' +
    (used.length ? used.map(sl => '<a class="ev-row" href="#/setlist/' + sl.id + '"><div class="ev-date" style="width:48px"><div class="d" style="font-size:var(--fs-body)">' + (sl.items || []).length + '</div></div><div class="ev-body"><h3 class="ev-title">' + esc(sl.name) + '</h3><div class="ev-meta"><span>' + ic('clock', 12) + fmtDur(setlistDur(sl)) + '</span></div></div></a>').join('')
      : '<p class="t-sm t-muted">Песня пока не добавлена ни в один сет-лист.</p>') + '</section>';
  return h + '</div></div>';
}
const infoRow = (l, v) => '<div class="info-row"><span class="l">' + esc(l) + '</span><span class="v">' + (v || '—') + '</span></div>';

/* ═══ 13. SETLISTS ═══ */
function vSetlists() {
  if (!state.setlists.length) return '<div class="card">' + stateHTML('empty', 'Сет-листов пока нет',
    'Сет-лист — программа выступления: песни в нужном порядке, тональности, переходы и заметки для музыкантов.',
    '<button class="btn btn-primary" type="button" data-act="new-setlist">' + ic('plus', 17) + 'Создать первый сет-лист</button>') + '</div>';
  let h = '<div class="grid g2">';
  state.setlists.slice().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).forEach(function (sl, i) {
    const ev = sl.eventId ? evById(sl.eventId) : null, n = (sl.items || []).length;
    h += '<article class="song-card rise" style="animation-delay:' + Math.min(i * 30, 200) + 'ms" data-act="open-setlist" data-id="' + sl.id + '" role="link" tabindex="0" aria-label="Открыть сет-лист ' + esc(sl.name) + '">' +
      '<div class="song-top"><div class="key-badge" aria-hidden="true">' + n + '</div>' +
      '<div style="min-width:0"><h3 class="song-name">' + esc(sl.name) + '</h3><div class="song-artist num">' + fmtDur(setlistDur(sl)) + ' · ' + n + ' ' + plural(n, 'песня', 'песни', 'песен') + '</div></div></div>' +
      (sl.note ? '<p class="t-sm t-muted" style="line-height:1.55">' + esc(sl.note) + '</p>' : '') +
      '<div class="song-meta">' + (ev ? '<span class="badge b-info">' + ic('calendar', 11) + esc(pdate(ev.date)) + ' · ' + esc(ev.title) + '</span>' : '<span class="badge b-muted">Не привязан к событию</span>') + '</div>' +
      '<div class="song-acts">' +
      '<button class="btn btn-secondary btn-sm" type="button" data-act="print-setlist" data-id="' + sl.id + '" aria-label="Печать сет-листа">' + ic('print', 15) + '</button>' +
      '<button class="btn btn-secondary btn-sm" type="button" data-act="dup-setlist" data-id="' + sl.id + '" aria-label="Создать копию">' + ic('copy', 15) + '</button>' +
      '<button class="btn btn-danger btn-sm" type="button" data-act="sl-del" data-id="' + sl.id + '" aria-label="Удалить сет-лист">' + ic('trash', 15) + '</button>' +
      '<button class="btn btn-primary btn-sm" type="button" data-act="scene-setlist" data-id="' + sl.id + '">' + ic('monitor', 15) + 'Сцена</button></div></article>';
  });
  return h + '</div>';
}
function vSetlist(id) {
  const sl = slById(id);
  if (!sl) return '<div class="card">' + stateHTML('err', 'Сет-лист не найден', 'Возможно, он был удалён.', '<a class="btn btn-primary" href="#/setlists">Вернуться к сет-листам</a>') + '</div>';
  const up = expand(today(), iso(new Date(Date.now() + 86400000 * 365)));
  let h = '<div class="split"><div class="stack">';
  h += '<section class="card rise"><div class="card-h"><div style="min-width:0"><h2 style="overflow-wrap:anywhere">' + esc(sl.name) + '</h2>' +
    '<div class="sub">Перетащите песни из библиотеки или нажмите «+» рядом с песней</div></div>' +
    '<div class="row"><button class="icon-btn" type="button" data-act="sl-rename" data-id="' + sl.id + '" aria-label="Название и заметки">' + ic('edit', 16) + '</button>' +
    '<button class="icon-btn" type="button" data-act="print-setlist" data-id="' + sl.id + '" aria-label="Печать сет-листа">' + ic('print', 16) + '</button></div></div>' +
    '<div class="dropzone" id="dropZone">';
  if (!(sl.items || []).length) h += stateHTML('empty', 'Программа пуста', 'Перетащите сюда песни из библиотеки или добавьте их кнопкой «+».', '<button class="btn btn-primary btn-sm" type="button" data-act="sl-rename" data-id="' + sl.id + '">Настроить сет-лист</button>');
  else (sl.items || []).forEach(function (it, i) {
    const s = songById(it.songId);
    if (!s) { h += '<div class="sl-item"><div class="sl-num">' + (i + 1) + '</div><div class="sl-info"><div class="sl-name t-muted">Песня удалена из репертуара</div></div><button class="icon-btn" type="button" data-act="sl-item-del" data-sl="' + sl.id + '" data-item="' + it.id + '" aria-label="Убрать">' + ic('x', 16) + '</button></div>'; return; }
    h += '<div class="sl-item" draggable="true" data-item="' + it.id + '">' +
      '<span class="grip" title="Перетащить" aria-hidden="true">' + ic('grip', 18) + '</span>' +
      '<div class="sl-num" aria-hidden="true">' + (i + 1) + '</div>' +
      '<div class="sl-info" data-act="open-song" data-id="' + s.id + '" role="link" tabindex="0" style="cursor:pointer">' +
      '<div class="sl-name">' + esc(s.title) + '</div>' +
      '<div class="sl-sub"><span class="num">' + esc(finalKey(s, it.shift)) + (it.shift ? ' <i style="color:var(--warn);font-style:normal">(' + (it.shift > 0 ? '+' : '') + it.shift + ')</i>' : '') + '</span>' +
      (s.bpm ? '<span class="num">' + s.bpm + ' BPM</span>' : '') + (s.duration ? '<span class="num">' + fmtDur(s.duration) + '</span>' : '') +
      (it.note ? '<span>' + esc(it.note) + '</span>' : '') + '</div></div>' +
      '<div class="mini-stepper" role="group" aria-label="Транспонирование">' +
      '<button type="button" data-act="sl-shift" data-sl="' + sl.id + '" data-item="' + it.id + '" data-d="-1" aria-label="Опустить">♭</button>' +
      '<span aria-live="polite">' + (it.shift > 0 ? '+' : '') + (it.shift || 0) + '</span>' +
      '<button type="button" data-act="sl-shift" data-sl="' + sl.id + '" data-item="' + it.id + '" data-d="1" aria-label="Поднять">♯</button></div>' +
      '<button class="icon-btn" type="button" data-act="sl-item-move" data-sl="' + sl.id + '" data-item="' + it.id + '" data-d="-1" aria-label="Переместить выше"' + (i === 0 ? ' disabled' : '') + '>' + ic('up', 16) + '</button>' +
      '<button class="icon-btn" type="button" data-act="sl-item-move" data-sl="' + sl.id + '" data-item="' + it.id + '" data-d="1" aria-label="Переместить ниже"' + (i === sl.items.length - 1 ? ' disabled' : '') + '>' + ic('down', 16) + '</button>' +
      '<button class="icon-btn" type="button" data-act="sl-item-note" data-sl="' + sl.id + '" data-item="' + it.id + '" aria-label="Заметка к песне">' + ic('edit', 16) + '</button>' +
      '<button class="icon-btn" type="button" data-act="sl-item-del" data-sl="' + sl.id + '" data-item="' + it.id + '" aria-label="Убрать из программы">' + ic('x', 16) + '</button></div>';
  });
  h += '</div><div class="row mt" style="gap:var(--s3)"><span class="badge b-brand num">' + (sl.items || []).length + ' ' + plural((sl.items || []).length, 'песня', 'песни', 'песен') + '</span>' +
    '<span class="badge b-muted num">' + ic('clock', 11) + fmtDur(setlistDur(sl)) + '</span>' +
    '<button class="btn btn-danger btn-sm" type="button" data-act="sl-clear" data-id="' + sl.id + '">Очистить программу</button></div></section>';
  h += '</div><div class="stack">';
  h += '<section class="card rise" style="animation-delay:.05s"><div class="card-h"><div><h2>Привязка и заметки</h2><div class="sub">Сет-лист появится в карточке события</div></div></div>' +
    '<div class="field"><label class="field-label" for="slEventSel">Событие</label><select class="select" id="slEventSel"><option value="">— не привязан —</option>' +
    up.map(o => '<option value="' + o.ev.id + '"' + (sl.eventId === o.ev.id ? ' selected' : '') + '>' + esc(pdate(o.date) + ' · ' + o.ev.title) + '</option>').join('') +
    state.events.filter(e => e.status === 'done').slice(0, 10).map(e => '<option value="' + e.id + '"' + (sl.eventId === e.id ? ' selected' : '') + '>' + esc(pdate(e.date) + ' · ' + e.title + ' (проведено)') + '</option>').join('') + '</select></div>' +
    '<div class="field"><label class="field-label" for="slNoteInp">Заметки к сет-листу</label><textarea class="input" id="slNoteInp" rows="3" style="font-family:var(--font);min-height:84px" placeholder="Переходы, вступления, динамика программы">' + esc(sl.note || '') + '</textarea></div>' +
    '<button class="btn btn-primary btn-block" type="button" data-act="sl-meta-save" data-id="' + sl.id + '">' + ic('check', 16) + 'Сохранить изменения</button></section>';
  h += '<section class="card rise" style="animation-delay:.08s"><div class="card-h"><div><h2>Библиотека песен</h2><div class="sub">' + state.songs.length + ' ' + plural(state.songs.length, 'песня', 'песни', 'песен') + ' в репертуаре</div></div></div>' +
    '<div class="tb-search mb" style="height:44px">' + ic('search', 17) + '<label class="sr-only" for="libQ">Поиск песни</label>' +
    '<input id="libQ" type="search" placeholder="Поиск песни…" value="' + esc(ui.libQuery) + '" style="border:none;background:none;outline:none;font-size:13.5px;flex:1;min-width:0;box-shadow:none"></div>' +
    '<div class="lib-list" id="libList">';
  const q = ui.libQuery.toLowerCase().trim();
  const lib = state.songs.filter(s => !q || ((s.title || '') + ' ' + (s.artist || '')).toLowerCase().indexOf(q) >= 0).sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  if (!lib.length) h += stateHTML('search', 'Песня не найдена', 'Измените запрос или добавьте песню в репертуар.', '<button class="btn btn-secondary btn-sm" type="button" data-act="new-song">Добавить песню</button>');
  lib.forEach(function (s) {
    h += '<div class="lib-item" draggable="true" data-lib="' + s.id + '"><span class="lk">' + esc(s.key || '—') + '</span>' +
      '<span class="grow nowrap">' + esc(s.title) + '</span>' +
      '<button class="icon-btn" type="button" data-act="sl-add" data-sl="' + sl.id + '" data-song="' + s.id + '" aria-label="Добавить ' + esc(s.title) + ' в сет-лист" style="width:34px;height:34px">' + ic('plus', 15) + '</button></div>';
  });
  return h + '</div></section></div></div>';
}
function bindDnD(slId) {
  const zone = $('#dropZone'); if (!zone) return;
  let dragItem = null, dragSong = null;
  const idxOf = iid => { const sl = slById(slId); return sl ? (sl.items || []).findIndex(x => x.id === iid) : -1; };
  const dataOf = e => {
    let t = ''; try { t = e.dataTransfer.getData('text/plain'); } catch (err) { }
    if (t && t.indexOf('song:') === 0) return { song: t.slice(5) };
    if (t && t.indexOf('item:') === 0) return { item: t.slice(5) };
    if (dragSong) return { song: dragSong };
    if (dragItem) return { item: dragItem };
    return {};
  };
  $$('.sl-item[draggable]', zone).forEach(function (el) {
    el.addEventListener('dragstart', function (e) { dragItem = el.getAttribute('data-item'); el.classList.add('drag'); try { e.dataTransfer.setData('text/plain', 'item:' + dragItem); } catch (err) { } e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragend', function () { el.classList.remove('drag'); dragItem = null; $$('.sl-item', zone).forEach(x => x.classList.remove('over')); });
    el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('over'); });
    el.addEventListener('dragleave', function () { el.classList.remove('over'); });
    el.addEventListener('drop', function (e) {
      e.preventDefault(); el.classList.remove('over');
      const src = dataOf(e), at = idxOf(el.getAttribute('data-item'));
      if (src.song) addItem(slId, src.song, at);
      else if (src.item && src.item !== el.getAttribute('data-item')) moveItem(slId, src.item, at);
    });
  });
  $$('#libList .lib-item').forEach(function (el) {
    el.addEventListener('dragstart', function (e) { dragSong = el.getAttribute('data-lib'); try { e.dataTransfer.setData('text/plain', 'song:' + dragSong); } catch (err) { } e.dataTransfer.effectAllowed = 'copy'; });
    el.addEventListener('dragend', function () { dragSong = null; zone.classList.remove('hot'); });
  });
  zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('hot'); });
  zone.addEventListener('dragleave', function (e) { if (e.target === zone) zone.classList.remove('hot'); });
  zone.addEventListener('drop', function (e) {
    e.preventDefault(); zone.classList.remove('hot');
    const src = dataOf(e);
    if (src.song) addItem(slId, src.song, -1); else if (src.item) moveItem(slId, src.item, -1);
  });
}
function addItem(slId, songId, at) {
  const sl = slById(slId); if (!sl) return;
  sl.items = sl.items || [];
  const item = { id: uid('i'), songId: songId, shift: 0, note: '' };
  if (at >= 0 && at <= sl.items.length) sl.items.splice(at, 0, item); else sl.items.push(item);
  sl.updatedAt = new Date().toISOString(); save(); render();
}
function moveItem(slId, itemId, at) {
  const sl = slById(slId); if (!sl) return;
  const arr = sl.items || [], i = arr.findIndex(x => x.id === itemId);
  if (i < 0) return;
  const it = arr.splice(i, 1)[0];
  if (at < 0 || at > arr.length) arr.push(it); else arr.splice(at, 0, it);
  sl.updatedAt = new Date().toISOString(); save(); render();
}

/* ═══ 14. SETTINGS ═══ */
function vSettings() {
  const s = state.settings, p = state.profile;
  let h = '<div class="split2">';
  h += '<section class="card rise"><div class="card-h"><div><h2>Профиль и роль</h2><div class="sub">Роль определяет, какая динамика песни подсвечивается</div></div></div>' +
    '<div class="f2"><div class="field"><label class="field-label" for="setName">Ваше имя</label><input class="input" id="setName" maxlength="50" value="' + esc(p.name) + '" placeholder="Имя и фамилия"></div>' +
    '<div class="field"><label class="field-label" for="setBand">Название группы</label><input class="input" id="setBand" maxlength="50" value="' + esc(p.bandName || '') + '" placeholder="Neon Coast"></div></div>' +
    '<div class="field"><label class="field-label" for="setBandDesc">О группе</label><textarea class="input" id="setBandDesc" rows="2" style="font-family:var(--font);min-height:68px" placeholder="Направление, состав, задачи">' + esc(p.bandDesc || '') + '</textarea></div>' +
    '<div class="field"><span class="field-label">Ваши роли / инструменты (можно несколько)</span><div class="row" style="gap:6px">' +
    ROLES.map(r => '<button class="chip' + (myRoles().indexOf(r.k) >= 0 ? ' on' : '') + '" type="button" data-act="role-set" data-v="' + r.k + '" aria-pressed="' + (myRoles().indexOf(r.k) >= 0) + '">' + ic(r.icon, 14) + esc(r.label) + '</button>').join('') + '</div></div>' +
    '<div class="field"><span class="field-label">Участие по умолчанию</span><div class="seg">' +
    [['yes', 'Участвую'], ['maybe', 'Под вопросом'], ['no', 'Не участвую']].map(o => '<button type="button" data-act="part-def" data-v="' + o[0] + '" class="' + (p.defaultParticipation === o[0] ? 'on' : '') + '" data-accent="1">' + o[1] + '</button>').join('') + '</div></div>' +
    '<button class="btn btn-secondary btn-block" type="button" data-act="invite">' + ic('link', 16) + 'Скопировать ссылку-приглашение</button></section>';

  h += '<section class="card rise" style="animation-delay:.04s"><div class="card-h"><div><h2>Состав группы</h2><div class="sub">' + state.members.length + ' ' + plural(state.members.length, 'участник', 'участника', 'участников') + '</div></div>' +
    '<button class="btn btn-primary btn-sm" type="button" data-act="mem-add">' + ic('plus', 15) + 'Добавить</button></div>';
  if (!state.members.length) h += stateHTML('empty', 'Участники не добавлены', 'Добавьте музыкантов и их роли — роли используются для динамики партий и отметок участия.', '<button class="btn btn-primary btn-sm" type="button" data-act="mem-add">Добавить участника</button>');
  state.members.forEach(function (m) {
    h += '<div class="memb-row"><div class="avatar" style="background:' + esc(m.color || 'var(--accent)') + '" aria-hidden="true">' + esc((m.name || '?').charAt(0).toUpperCase()) + '</div>' +
      '<div class="grow"><div style="font-weight:600;font-size:var(--fs-body-s)">' + esc(m.name) + '</div>' +
      '<div class="t-xs t-muted">' + esc(rolesLabel(rolesOf(m))) + (m.note ? ' · ' + esc(m.note) : '') + '</div></div>' +
      '<button class="icon-btn" type="button" data-act="mem-edit" data-id="' + m.id + '" aria-label="Изменить участника">' + ic('edit', 15) + '</button>' +
      '<button class="icon-btn" type="button" data-act="mem-del" data-id="' + m.id + '" aria-label="Удалить участника">' + ic('trash', 15) + '</button></div>';
  });
  h += '</section>';

  h += '<section class="card rise" style="animation-delay:.07s;grid-column:1/-1"><div class="card-h"><div><h2>' + ic('palette', 18) + ' Оформление интерфейса</h2><div class="sub">Изменения применяются сразу и сохраняются на устройстве</div></div></div>' +
    '<div class="split2"><div>' +
    '<div class="field"><span class="field-label">Тема</span><div class="seg">' +
    [['light', 'Светлая', 'sun'], ['dark', 'Тёмная', 'moon'], ['amoled', 'AMOLED', 'bolt']].map(t => '<button type="button" data-act="theme-set" data-v="' + t[0] + '" class="' + (s.theme === t[0] ? 'on' : '') + '" aria-pressed="' + (s.theme === t[0]) + '" data-accent="1">' + ic(t[2], 14) + t[1] + '</button>').join('') + '</div></div>' +
    '<div class="field"><span class="field-label">Акцентный цвет</span><div class="swatches">' +
    ACCENTS.map(a => '<button class="sw' + (s.accent.toLowerCase() === a.toLowerCase() ? ' on' : '') + '" type="button" data-act="accent-set" data-v="' + a + '" style="background:' + a + '" aria-label="Акцент ' + a + '" aria-pressed="' + (s.accent.toLowerCase() === a.toLowerCase()) + '"></button>').join('') +
    '<label class="chip" style="gap:var(--s2)">Свой цвет<input type="color" id="accentCustom" value="' + esc(s.accent) + '" style="width:30px;height:26px;border:none;background:none;padding:0" aria-label="Выбрать свой цвет"></label></div>' +
    '<span class="hint">Акцент применяется только к главным действиям, активным состояниям и прогрессу.</span></div>' +
    '<div class="field"><span class="field-label">Запись аккордов</span><div class="seg">' +
    [['auto', 'Как в оригинале'], ['sharp', 'Диезы (C#)'], ['flat', 'Бемоли (Db)']].map(o => '<button type="button" data-act="notation-set" data-v="' + o[0] + '" class="' + (s.notation === o[0] ? 'on' : '') + '" data-accent="1">' + o[1] + '</button>').join('') + '</div></div>' +
    '<div class="f2"><div class="field"><label class="field-label" for="setWeekStart">Первый день недели</label><select class="select" id="setWeekStart"><option value="1"' + (s.weekStart !== 0 ? ' selected' : '') + '>Понедельник</option><option value="0"' + (s.weekStart === 0 ? ' selected' : '') + '>Воскресенье</option></select></div>' +
    '<div class="field"><label class="field-label" for="setDefView">Вид календаря</label><select class="select" id="setDefView">' + [['month', 'Месяц'], ['week', 'Неделя'], ['day', 'День']].map(o => '<option value="' + o[0] + '"' + (s.calView === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div></div>' +
    '</div><div>' +
    '<div class="field"><label class="field-label" for="lsRange">Шрифт текста песни: <b class="num" id="lsVal">' + s.lyricsSize + 'px</b></label><input class="range" id="lsRange" type="range" min="12" max="26" step="1" value="' + s.lyricsSize + '"></div>' +
    '<div class="field"><label class="field-label" for="scRange">Шрифт на сцене: <b class="num" id="scValS">' + s.sceneSize + 'px</b></label><input class="range" id="scRange" type="range" min="16" max="52" step="1" value="' + s.sceneSize + '"></div>' +
    '<div class="field"><label class="field-label" for="spRange">Скорость автопрокрутки: <b class="num" id="spValS">' + s.sceneSpeed + ' px/с</b></label><input class="range" id="spRange" type="range" min="10" max="200" step="5" value="' + s.sceneSpeed + '"></div>' +
    '<div class="field"><span class="field-label">Поведение</span><div class="row" style="gap:6px">' +
    '<button class="chip' + (s.autoscroll ? ' on' : '') + '" type="button" data-act="toggle-auto" aria-pressed="' + !!s.autoscroll + '">' + ic('bolt', 14) + 'Автопрокрутка на сцене</button>' +
    '<button class="chip' + (s.reduced ? ' on' : '') + '" type="button" data-act="toggle-reduced" aria-pressed="' + !!s.reduced + '">' + ic('wave', 14) + 'Меньше анимации</button>' +
    '<button class="chip' + (s.showChords !== false ? ' on' : '') + '" type="button" data-act="toggle-chords" aria-pressed="' + (s.showChords !== false) + '">' + ic('music', 14) + 'Показывать аккорды</button></div></div>' +
    '<div class="field"><span class="field-label">Уведомления о действиях</span><div class="seg">' + [['off', 'Выключены'], ['important', 'Только важные'], ['all', 'Все действия']].map(o => '<button type="button" data-act="toast-mode" data-v="' + o[0] + '" class="' + ((s.toastMode || 'off') === o[0] ? 'on' : '') + '" aria-pressed="' + ((s.toastMode || 'off') === o[0]) + '" data-accent="1">' + o[1] + '</button>').join('') + '</div><span class="hint">Сообщения вроде «Сохранено» можно полностью отключить или оставить только ошибки.</span></div></div></div></section>';

  h += '<section class="card rise"><div class="card-h"><div><h2>Установка на телефон</h2><div class="sub">' + (isStandalone() ? 'Приложение уже запущено отдельно от браузера' : 'Откроется на весь экран, без браузера, и будет работать офлайн') + '</div></div></div>' + (isStandalone() ? '' : '<button class="btn btn-primary btn-block" type="button" id="pwaBtn" data-act="pwa-install"' + (deferredInstall ? '' : ' hidden') + '>' + ic('dl', 16) + 'Установить приложение</button><p class="t-sm t-muted mt-s">Если кнопки нет: на iPhone — Safari → «Поделиться» → «На экран Домой»; на Android — меню браузера ⋮ → «Установить приложение». Нужен адрес https:// (GitHub Pages, Netlify) или localhost.</p>') + '</section>';
  h += '<section class="card rise" style="animation-delay:.1s"><div class="card-h"><div><h2>Данные</h2><div class="sub">Всё хранится локально в этом браузере</div></div></div>' +
    '<div class="grid g4 mb" style="gap:var(--s3)">' + mini(state.songs.length, 'Песен') + mini(state.events.length, 'Событий') + mini(state.setlists.length, 'Сет-листов') + mini(state.members.length, 'Участников') + '</div>' +
    '<div class="row"><button class="btn btn-secondary btn-sm" type="button" data-act="export">' + ic('dl', 16) + 'Скачать копию (JSON)</button>' +
    '<button class="btn btn-secondary btn-sm" type="button" data-act="import">' + ic('ul', 16) + 'Загрузить из файла</button></div>' +
    '<div class="row mt-s">' +
    '<button class="btn btn-danger btn-sm" type="button" data-act="wipe">' + ic('trash', 16) + 'Удалить все данные</button></div>' +
    '<p class="t-xs t-muted mt">Объём данных: <span class="num">' + kb() + ' КБ</span> · последняя копия: ' + esc(s.lastBackup ? pdate(s.lastBackup) : 'не создавалась') + '</p></section>';

  h += '<section class="card rise" style="animation-delay:.13s"><div class="card-h"><div><h2>О BandPlan</h2><div class="sub">Music Group OS</div></div></div>' +
    '<p class="t-sm t-2" style="line-height:var(--lh-loose)">Расписание (месяц / неделя / день), репертуар с аккордами и динамикой партий по инструментам, конструктор сет-листов с перетаскиванием, сценический режим с автопрокруткой, онбординг группы и роли, глобальный поиск на главной, оформление и печать в PDF.</p>' +
    '<div class="row mt" style="gap:6px;flex-wrap:wrap"><span class="badge b-muted">offline-first</span><span class="badge b-muted">localStorage</span><span class="badge b-muted">печать / PDF</span><span class="badge b-muted">wake lock</span><span class="badge b-muted">свайп-навигация</span></div>' +
    '<hr class="divider"><span class="field-label">Горячие клавиши</span>' +
    '<div class="row mt-s" style="gap:var(--s2)"><kbd class="badge b-muted mono">Ctrl K</kbd><span class="t-sm t-muted">поиск на главной</span></div>' +
    '<div class="row mt-s" style="gap:var(--s2)"><kbd class="badge b-muted mono">N</kbd><kbd class="badge b-muted mono">E</kbd><kbd class="badge b-muted mono">S</kbd><span class="t-sm t-muted">песня / событие / сет-лист</span></div>' +
    '<div class="row mt-s" style="gap:var(--s2)"><kbd class="badge b-muted mono">← →</kbd><span class="t-sm t-muted">сцена: песни · календарь: навигация</span></div>' +
    '<div class="row mt-s" style="gap:var(--s2)"><kbd class="badge b-muted mono">Space</kbd><span class="t-sm t-muted">автопрокрутка на сцене</span></div>' +
    '<div class="row mt-s" style="gap:var(--s2)"><kbd class="badge b-muted mono">Esc</kbd><span class="t-sm t-muted">закрыть окно или выйти со сцены</span></div></section>';
  return h + '</div>';
}
function mini(v, l) { return '<div class="stat-mini"><div class="v">' + v + '</div><div class="l">' + esc(l) + '</div></div>'; }
function kb() { try { return (new Blob([JSON.stringify(state)]).size / 1024).toFixed(1); } catch (e) { return '0'; } }
function bindSettings() {
  const on = (id, ev, fn) => { const e = $('#' + id); if (e) e.addEventListener(ev, fn); };
  on('setName', 'input', debounce(e => { state.profile.name = e.target.value; save(); buildChrome(); }));
  on('setBand', 'input', debounce(e => { state.profile.bandName = e.target.value || 'Моя группа'; save(); buildChrome(); }));
  on('setBandDesc', 'input', debounce(e => { state.profile.bandDesc = e.target.value; save(); }));
  on('lsRange', 'input', e => { state.settings.lyricsSize = +e.target.value; $('#lsVal').textContent = e.target.value + 'px'; document.documentElement.style.setProperty('--lsize', e.target.value + 'px'); save(); });
  on('scRange', 'input', e => { state.settings.sceneSize = +e.target.value; $('#scValS').textContent = e.target.value + 'px'; save(); });
  on('spRange', 'input', e => { state.settings.sceneSpeed = +e.target.value; $('#spValS').textContent = e.target.value + ' px/с'; scene.speed = +e.target.value; save(); });
  on('accentCustom', 'input', debounce(e => applyAccent(e.target.value)));
  on('setWeekStart', 'change', e => { state.settings.weekStart = +e.target.value; save(); render(); });
  on('setDefView', 'change', e => { state.settings.calView = e.target.value; ui.calView = e.target.value; save(); render(); });
}

/* ═══ 15. FORM MODALS ═══ */
function eventModal(evId, date) {
  const ev = evId ? evById(evId) : null;
  const d = ev || { type: 'gig', title: '', date: date || ui.selDate || today(), time: '19:00', end: '', location: '', notes: '', status: 'upcoming', repeat: 'none', repeatUntil: '', setlistId: '', myStatus: state.profile.defaultParticipation || 'yes', memberIds: state.members.map(m => m.id), except: [] };
  const body =
    '<div class="field"><span class="field-label">Тип события</span><div class="seg" id="evTypeSeg" style="flex-wrap:wrap">' +
    Object.keys(EV_TYPES).map(k => '<button type="button" data-t="' + k + '" class="' + (d.type === k ? 'on' : '') + '" data-accent="1">' + ic(EV_TYPES[k].ic, 14) + esc(EV_TYPES[k].label) + '</button>').join('') + '</div></div>' +
    '<div class="field"><label class="field-label" for="f_title">Название *</label><input class="input" id="f_title" maxlength="80" value="' + esc(d.title) + '" placeholder="Например: Концерт в «Портах»"><span class="err"></span></div>' +
    '<div class="f2"><div class="field"><label class="field-label" for="f_date">Дата *</label><input class="input" id="f_date" type="date" value="' + esc(d.date) + '"><span class="err"></span></div>' +
    '<div class="field"><label class="field-label" for="f_time">Начало</label><input class="input" id="f_time" type="time" value="' + esc(d.time || '') + '"></div></div>' +
    '<div class="f2"><div class="field"><label class="field-label" for="f_end">Окончание</label><input class="input" id="f_end" type="time" value="' + esc(d.end || '') + '"><span class="hint">Необязательно</span><span class="err"></span></div>' +
    '<div class="field"><label class="field-label" for="f_loc">Место</label><input class="input" id="f_loc" maxlength="120" value="' + esc(d.location || '') + '" placeholder="Клуб, студия, адрес"></div></div>' +
    '<div class="f2"><div class="field"><label class="field-label" for="f_sl">Сет-лист</label><select class="select" id="f_sl"><option value="">— не выбран —</option>' +
    state.setlists.map(s => '<option value="' + s.id + '"' + (d.setlistId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></div>' +
    '<div class="field"><label class="field-label" for="f_status">Статус</label><select class="select" id="f_status">' +
    [['upcoming', 'Запланировано'], ['done', 'Проведено'], ['cancelled', 'Отменено']].map(o => '<option value="' + o[0] + '"' + (d.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div></div>' +
    '<div class="f2"><div class="field"><label class="field-label" for="f_repeat">Повторение</label><select class="select" id="f_repeat">' +
    Object.keys(REPEATS).map(k => '<option value="' + k + '"' + (d.repeat === k ? ' selected' : '') + '>' + REPEATS[k] + '</option>').join('') + '</select></div>' +
    '<div class="field"><label class="field-label" for="f_until">Повторять до</label><input class="input" id="f_until" type="date" value="' + esc(d.repeatUntil || '') + '"><span class="err"></span></div></div>' +
    '<div class="field"><span class="field-label">Ваше участие</span><div class="seg" id="f_my">' +
    [['yes', 'Участвую'], ['maybe', 'Под вопросом'], ['no', 'Не участвую']].map(o => '<button type="button" data-v="' + o[0] + '" class="' + (d.myStatus === o[0] ? 'on' : '') + '" data-accent="1">' + o[1] + '</button>').join('') + '</div></div>' +
    '<div class="field"><span class="field-label">Состав</span><div class="row" id="f_members" style="gap:6px">' +
    (state.members.length ? state.members.map(m => '<button type="button" class="chip' + ((d.memberIds || []).indexOf(m.id) >= 0 ? ' on' : '') + '" data-m="' + m.id + '" aria-pressed="' + ((d.memberIds || []).indexOf(m.id) >= 0) + '">' + esc(m.name.split(' ')[0]) + ' · ' + esc(rolesLabel(rolesOf(m))) + '</button>').join('') : '<span class="t-sm t-muted">Участники не добавлены — сделайте это в настройках.</span>') + '</div></div>' +
    '<div class="field"><label class="field-label" for="f_notes">Заметки</label><textarea class="input" id="f_notes" rows="3" style="font-family:var(--font);min-height:80px" placeholder="Саундчек, райдер, договорённости">' + esc(d.notes || '') + '</textarea></div>';
  openModal({
    title: ev ? 'Изменить событие' : 'Новое событие', sub: ev ? pdateFull(ev.date) : 'Заполните название, дату и время', size: 'lg', body: body,
    footer: '<button class="btn btn-secondary" type="button" data-act="modal-close">Отмена</button><button class="btn btn-primary" type="button" id="evSaveBtn" data-act="event-save" data-id="' + (ev ? ev.id : '') + '">' + ic('check', 16) + (ev ? 'Сохранить изменения' : 'Создать событие') + '</button>',
    onMount: function (w) {
      $$('#evTypeSeg button', w).forEach(b => b.addEventListener('click', () => $$('#evTypeSeg button', w).forEach(x => x.classList.toggle('on', x === b))));
      $$('#f_my button', w).forEach(b => b.addEventListener('click', () => $$('#f_my button', w).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); })));
      $$('#f_members .chip', w).forEach(b => b.addEventListener('click', () => { b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); }));
    }
  });
}
function readEventForm(id) {
  const w = modalRoot; if (!w) return null;
  const t = $('#evTypeSeg button.on', w), my = $('#f_my button.on', w);
  const title = fv('f_title'); if (!title) { fieldError('f_title', 'Введите название события'); return null; }
  const date = fv('f_date'); if (!date) { fieldError('f_date', 'Укажите дату события'); return null; }
  const time = fv('f_time'), end = fv('f_end');
  if (time && end && mins(end) <= mins(time)) { fieldError('f_end', 'Окончание должно быть позже начала'); return null; }
  const until = fv('f_until');
  if ($('#f_repeat', w).value !== 'none' && until && until < date) { fieldError('f_until', 'Дата окончания повтора раньше начала события'); return null; }
  const old = id ? evById(id) : null;
  return {
    id: id || uid('e'), type: t ? t.getAttribute('data-t') : 'gig', title: title, date: date, time: time, end: end,
    location: fv('f_loc'), notes: fv('f_notes'), status: $('#f_status', w).value, repeat: $('#f_repeat', w).value, repeatUntil: until,
    setlistId: $('#f_sl', w).value, myStatus: my ? my.getAttribute('data-v') : '',
    memberIds: $$('#f_members .chip.on', w).map(b => b.getAttribute('data-m')), except: (old && old.except) || []
  };
}
let dynDraft = null;
function songModal(id) {
  const s = id ? songById(id) : null;
  const d = s || { title: '', artist: '', key: 'Am', bpm: '', duration: '', tags: [], lyrics: '', fav: false };
  dynDraft = s && s.dynamics ? JSON.parse(JSON.stringify(s.dynamics)) : { instruments: [], sections: [], levels: {} };
  const tpl = '[Куплет 1]\nAm      F       C       G\nСтрока текста песни\nAm      F       G\nВторая строка\n\n[Припев]\nF       G       Em      Am\nТекст припева';
  const body =
    '<div class="f2"><div class="field"><label class="field-label" for="f_stitle">Название *</label><input class="input" id="f_stitle" maxlength="90" value="' + esc(d.title) + '" placeholder="Название песни"><span class="err"></span></div>' +
    '<div class="field"><label class="field-label" for="f_sartist">Исполнитель / автор</label><input class="input" id="f_sartist" maxlength="70" value="' + esc(d.artist || '') + '" placeholder="Группа или автор"></div></div>' +
    '<div class="f3"><div class="field"><label class="field-label" for="f_skey">Тональность</label><select class="select" id="f_skey">' +
    KEY_LIST.map(k => '<option value="' + k + '"' + (d.key === k ? ' selected' : '') + '>' + k + '</option>').join('') + '</select></div>' +
    '<div class="field"><label class="field-label" for="f_sbpm">Темп (BPM)</label><input class="input" id="f_sbpm" type="number" min="20" max="400" inputmode="numeric" value="' + esc(d.bpm || '') + '" placeholder="100"><span class="err"></span></div>' +
    '<div class="field"><label class="field-label" for="f_sdur">Длительность</label><input class="input" id="f_sdur" inputmode="numeric" value="' + (d.duration ? fmtDur(d.duration) : '') + '" placeholder="3:45"><span class="hint">мм:сс</span></div></div>' +
    '<div class="field"><label class="field-label" for="f_stags">Теги через запятую</label><input class="input" id="f_stags" value="' + esc((d.tags || []).join(', ')) + '" placeholder="рок, баллада, сет"></div>' +
    '<div class="field"><label class="field-label" for="f_slyr">Текст и аккорды</label><textarea class="textarea" id="f_slyr" rows="11" spellcheck="false" placeholder="' + esc(tpl) + '">' + esc(d.lyrics || '') + '</textarea>' +
    '<span class="hint">Аккорды — отдельной строкой над текстом (<code class="mono">Am F C G</code>) или в скобках внутри строки (<code class="mono">[Am]текст</code>). Секции — <code class="mono">[Припев]</code>.</span></div>' +
    '<div class="field"><span class="field-label">' + ic('wave', 14) + ' Динамика по инструментам</span>' +
    '<span class="hint" style="margin-bottom:var(--s2)">Уровни pp–ff для каждой партии по секциям. Участник видит только свою партию — согласно роли из профиля.</span>' +
    '<div id="dynBlock"></div></div>';
  openModal({
    title: s ? 'Изменить песню' : 'Новая песня', size: 'lg', body: body,
    footer: '<button class="btn btn-secondary" type="button" data-act="modal-close">Отмена</button><button class="btn btn-primary" type="button" id="songSaveBtn" data-act="song-save" data-id="' + (s ? s.id : '') + '">' + ic('check', 16) + (s ? 'Сохранить изменения' : 'Добавить песню') + '</button>',
    onMount: function () { renderDynBlock(); }
  });
}
function dynRowTools(k) { const b = (d, t) => '<button class="btn btn-tertiary btn-sm" type="button" data-act="' + d[0] + '" data-ins="' + k + '"' + (d[1] ? ' data-d="' + d[1] + '"' : '') + ' data-no-dirty="1">' + t + '</button>'; return '<div class="dyn-tools">' + b(['dyn-ramp', 'up'], 'Нарастание') + b(['dyn-ramp', 'down'], 'Затухание') + b(['dyn-copy'], 'На все инструменты') + '</div>'; }
function renderDynBlock() {
  const box = $('#dynBlock'); if (!box || !dynDraft) return;
  const secs = dynDraft.sections || [], ins = dynDraft.instruments || [];
  let h = '<div class="dyn-editor">';
  h += '<div class="row" style="gap:6px">' +
    '<button class="btn btn-secondary btn-sm" type="button" data-act="dyn-from-lyrics" data-no-dirty="1">' + ic('bolt', 15) + 'Взять секции из текста</button>' +
    '<button class="btn btn-secondary btn-sm" type="button" data-act="dyn-add-section" data-no-dirty="1">' + ic('plus', 15) + 'Добавить секцию</button></div>';
  if (!secs.length) h += '<p class="t-sm t-muted">Секций пока нет — возьмите их из текста песни или добавьте вручную.</p>';
  if (secs.length) h += '<div class="row" style="gap:6px">' + secs.map(x => '<span class="chip">' + esc(x) + '<button type="button" class="dyn-x" data-act="dyn-del-section" data-sec="' + esc(x) + '" data-no-dirty="1" aria-label="Удалить секцию ' + esc(x) + '">×</button></span>').join('') + '</div>';
  h += '<div class="row" style="gap:6px"><label class="sr-only" for="dynInsPick">Инструмент</label><select class="select" id="dynInsPick" style="max-width:240px" data-no-dirty="1">' +
    ROLES.filter(r => ins.indexOf(r.k) < 0).map(r => '<option value="' + r.k + '">' + esc(r.label) + '</option>').join('') + '</select>' +
    '<button class="btn btn-primary btn-sm" type="button" data-act="dyn-add-ins" data-no-dirty="1"' + (ROLES.filter(r => ins.indexOf(r.k) < 0).length ? '' : ' disabled') + '>' + ic('plus', 15) + 'Добавить инструмент</button></div>';
  ins.forEach(function (insKey) {
    const lv = (dynDraft.levels && dynDraft.levels[insKey]) || {};
    h += '<div class="dyn-row"><div class="row-ns" style="gap:var(--s2)"><span class="badge b-brand">' + esc(roleLabel(insKey)) + '</span>' +
      (myRoles().indexOf(insKey) >= 0 ? '<span class="badge b-warn">вы</span>' : '') + '</div>' +
      '<div class="cells">' + (secs.length ? dynRowTools(insKey) + secs.map(function (s) {
        return '<div class="dyn-cell"><label for="dyn_' + insKey + '_' + esc(s) + '">' + esc(s) + '</label><select id="dyn_' + insKey + '_' + esc(s) + '" data-act="dyn-lv" data-ins="' + insKey + '" data-sec="' + esc(s) + '">' +
          DYN_LEVELS.map(v => '<option value="' + v + '"' + (lv[s] === v ? ' selected' : '') + '>' + (v ? v + ' — ' + DYN_LABEL[v] : 'не задано') + '</option>').join('') + '</select></div>';
      }).join('') : '<span class="t-sm t-muted">Сначала добавьте секции</span>') + '</div>' +
      '<button class="icon-btn" type="button" data-act="dyn-del-ins" data-ins="' + insKey + '" data-no-dirty="1" aria-label="Убрать ' + esc(roleLabel(insKey)) + '">' + ic('trash', 15) + '</button></div>';
  });
  if (ins.length && secs.length) h += '<div class="row" style="gap:6px"><button class="btn btn-secondary btn-sm" type="button" data-act="dyn-fill-all" data-no-dirty="1">' + ic('wave', 15) + 'Заполнить всё «mf»</button>' +
    '<button class="btn btn-danger btn-sm" type="button" data-act="dyn-clear" data-no-dirty="1">' + ic('trash', 15) + 'Очистить динамику</button></div>';
  box.innerHTML = h + '</div>';
}
function readSongForm(id) {
  const w = modalRoot; if (!w) return null;
  const title = fv('f_stitle'); if (!title) { fieldError('f_stitle', 'Введите название песни'); return null; }
  const bpmRaw = fv('f_sbpm'), bpm = bpmRaw ? parseInt(bpmRaw, 10) : null;
  if (bpm !== null && (isNaN(bpm) || bpm < 20 || bpm > 400)) { fieldError('f_sbpm', 'Темп должен быть в диапазоне 20–400 BPM'); return null; }
  const old = id ? songById(id) : null;
  return {
    id: id || uid('s'), title: title, artist: fv('f_sartist'), key: $('#f_skey', w).value,
    bpm: bpm, duration: durParse(fv('f_sdur')),
    tags: fv('f_stags').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).slice(0, 8),
    lyrics: $('#f_slyr', w).value, fav: old ? !!old.fav : false, addedAt: old ? old.addedAt : today(),
    dynamics: dynDraft ? JSON.parse(JSON.stringify(dynDraft)) : (old ? old.dynamics : null)
  };
}
function setlistModal(id) {
  const sl = id ? slById(id) : null;
  const body = '<div class="field"><label class="field-label" for="f_slname">Название *</label><input class="input" id="f_slname" maxlength="80" value="' + esc(sl ? sl.name : '') + '" placeholder="Например: Основной сет · 45 минут"><span class="err"></span></div>' +
    '<div class="field"><label class="field-label" for="f_slnote">Заметки к программе</label><textarea class="input" id="f_slnote" rows="3" style="font-family:var(--font);min-height:84px" placeholder="Динамика программы, переходы, финал">' + esc(sl ? sl.note || '' : '') + '</textarea></div>' +
    (!sl && state.songs.length ? '<div class="field"><span class="field-label">Добавить песни сразу</span><div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;-webkit-overflow-scrolling:touch">' +
      state.songs.slice().sort((a, b) => a.title.localeCompare(b.title, 'ru')).map(s => '<label class="check" style="padding:10px var(--s3);border:1px solid var(--border);border-radius:var(--r-10);background:var(--surf-1)"><input type="checkbox" class="f_slsong" value="' + s.id + '"><span class="grow nowrap">' + esc(s.title) + '</span><span class="badge b-muted mono">' + esc(s.key || '') + '</span></label>').join('') + '</div></div>'
      : (!state.songs.length ? '<p class="t-sm t-muted">В репертуаре пока нет песен — их можно добавить позже.</p>' : ''));
  openModal({
    title: sl ? 'Название и заметки' : 'Новый сет-лист', body: body,
    footer: '<button class="btn btn-secondary" type="button" data-act="modal-close">Отмена</button><button class="btn btn-primary" type="button" data-act="sl-save" data-id="' + (sl ? sl.id : '') + '">' + ic('check', 16) + (sl ? 'Сохранить изменения' : 'Создать сет-лист') + '</button>'
  });
}
function memberModal(id) {
  const m = id ? memById(id) : null;
  const d = m || { name: '', role: '', color: PALETTE[state.members.length % PALETTE.length], note: '' };
  openModal({
    title: m ? 'Участник' : 'Новый участник',
    body: '<div class="field"><label class="field-label" for="f_mname">Имя *</label><input class="input" id="f_mname" maxlength="50" value="' + esc(d.name) + '" placeholder="Имя и фамилия"><span class="err"></span></div>' +
      '<div class="field"><span class="field-label">Роль / инструмент</span><div class="row" style="gap:6px" id="f_mrole">' +
      ROLES.map(r => '<button type="button" class="chip' + (rolesOf(d).indexOf(r.k) >= 0 ? ' on' : '') + '" data-r="' + r.k + '" aria-pressed="' + (rolesOf(d).indexOf(r.k) >= 0) + '">' + ic(r.icon, 13) + esc(r.label) + '</button>').join('') + '</div></div>' +
      '<div class="field"><label class="field-label" for="f_mnote">Заметка</label><input class="input" id="f_mnote" maxlength="80" value="' + esc(d.note || '') + '" placeholder="Свой инструмент, бэк-вокал"></div>' +
      '<div class="field"><span class="field-label">Цвет аватара</span><div class="row" id="f_mcol" style="gap:var(--s2)">' +
      PALETTE.map(c => '<button type="button" data-c="' + c + '" style="width:36px;height:36px;border-radius:var(--r-10);border:2px solid ' + (d.color === c ? 'var(--text)' : 'transparent') + ';background:' + c + '" aria-label="Цвет ' + c + '" aria-pressed="' + (d.color === c) + '"></button>').join('') + '</div></div>',
    footer: '<button class="btn btn-secondary" type="button" data-act="modal-close">Отмена</button><button class="btn btn-primary" type="button" data-act="mem-save" data-id="' + (m ? m.id : '') + '">' + ic('check', 16) + (m ? 'Сохранить изменения' : 'Добавить участника') + '</button>',
    onMount: function (w) {
      $$('#f_mrole .chip', w).forEach(b => b.addEventListener('click', () => { const on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }));
      $$('#f_mcol button', w).forEach(b => b.addEventListener('click', () => { $$('#f_mcol button', w).forEach(x => { x.style.borderColor = 'transparent'; x.setAttribute('aria-pressed', 'false'); }); b.style.borderColor = 'var(--text)'; b.setAttribute('aria-pressed', 'true'); }));
    }
  });
}
function addToSetlistModal(songId) {
  const s = songById(songId);
  if (!state.setlists.length) { confirmBox('Сет-листов пока нет', 'Чтобы добавить песню в программу, сначала создайте сет-лист. Создать сейчас?', () => setlistModal(null), 'Создать сет-лист'); return; }
  openModal({
    title: 'Добавить в сет-лист', sub: s ? s.title : '', guard: false,
    body: '<div style="display:flex;flex-direction:column;gap:6px">' + state.setlists.map(sl => {
      const has = (sl.items || []).some(i => i.songId === songId);
      return '<button class="chip" style="justify-content:flex-start;border-radius:var(--r-14);padding:13px var(--s4);width:100%" type="button" data-act="sl-add-go" data-sl="' + sl.id + '" data-song="' + songId + '"' + (has ? ' disabled' : '') + '>' +
        ic('list', 16) + '<b class="grow nowrap" style="text-align:left;font-weight:600">' + esc(sl.name) + '</b><span class="badge b-muted num">' + (has ? 'уже добавлена' : (sl.items || []).length) + '</span></button>';
    }).join('') + '</div>',
    footer: '<button class="btn btn-secondary" type="button" data-act="modal-close">Закрыть</button><button class="btn btn-primary" type="button" data-act="new-setlist">' + ic('plus', 16) + 'Новый сет-лист</button>'
  });
}

/* ═══ 16. SCENE ═══ */
const scene = { list: [], i: 0, shift: 0, size: 26, speed: 60, auto: false, raf: null, last: 0, wake: null };
const buildList = sl => (sl.items || []).map(it => ({ songId: it.songId, shift: it.shift || 0, note: it.note || '' }));
function openScene(list, i, shift) {
  if (!list || !list.length) { toast('Нет песен для сценического режима', 'warn'); return; }
  scene.list = list; scene.i = clamp(i || 0, 0, list.length - 1); scene.shift = shift || 0;
  scene.size = state.settings.sceneSize || 26; scene.speed = state.settings.sceneSpeed || 60;
  $('#scene').classList.add('on'); $('#scene').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  drawScene();
  if (state.settings.autoscroll) setAuto(true);
  reqWake();
  const el = $('#scene'); if (el.requestFullscreen) el.requestFullscreen().catch(() => { });
  setTimeout(() => { const b = $('[data-act="scene-close"]'); if (b) b.focus(); }, 120);
}
function closeScene() {
  setAuto(false);
  $('#scene').classList.remove('on'); $('#scene').setAttribute('aria-hidden', 'true');
  if (!$('#modalOverlay').classList.contains('on')) document.body.style.overflow = '';
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { });
  relWake();
}
function drawScene() {
  const it = scene.list[scene.i]; if (!it) return;
  const s = songById(it.songId);
  if (!s) { scene.i++; if (scene.i >= scene.list.length) { closeScene(); return; } drawScene(); return; }
  const shift = (it.shift || 0) + scene.shift;
  $('#scTitle').textContent = s.title;
  $('#scMeta').textContent = [transposeKey(s.key || '—', shift), s.bpm ? s.bpm + ' BPM' : '', fmtDur(s.duration), (scene.i + 1) + ' / ' + scene.list.length].filter(Boolean).join(' · ');
  const d = s.dynamics;
  let dyn = '';
  if (d) myRoles().filter(r => (d.instruments || []).indexOf(r) >= 0).forEach(function (role) {
    const lv = (d.levels && d.levels[role]) || {};
    dyn += '<div class="dc"><em>' + esc(roleLabel(role)) + '</em></div>' + (d.sections || []).map(x => '<div class="dc"><em>' + esc(x) + '</em><b>' + esc(lv[x] || '—') + '</b></div>').join('');
  });
  $('#scDyn').innerHTML = dyn; $('#scDyn').style.display = dyn ? 'flex' : 'none';
  const body = $('#scBody');
  body.style.setProperty('--scsize', scene.size + 'px');
  body.innerHTML = renderLyrics(s.lyrics, shift) + (it.note ? '<span class="ln sec">Заметка</span><span class="ln" style="font-family:var(--font);font-size:.5em;opacity:.75">' + esc(it.note) + '</span>' : '');
  body.scrollTop = 0;
  syncSceneChords();
  $('#scFont').textContent = scene.size; $('#scSpeed').textContent = scene.speed;
  $('#scTrans').textContent = (scene.shift > 0 ? '+' : '') + scene.shift;
  updateBar();
}
function setAuto(v) {
  scene.auto = v;
  const b = $('[data-act="scene-auto"]');
  if (b) { b.innerHTML = ic(v ? 'pause' : 'play', 19); b.classList.toggle('act', v); b.setAttribute('aria-label', v ? 'Остановить автопрокрутку' : 'Запустить автопрокрутку'); }
  if (v) { scene.last = performance.now(); loop(); } else if (scene.raf) { cancelAnimationFrame(scene.raf); scene.raf = null; }
}
function loop() {
  if (!scene.auto) return;
  const now = performance.now(), dt = (now - scene.last) / 1000; scene.last = now;
  const el = $('#scBody');
  el.scrollTop += scene.speed * dt;
  updateBar();
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
    if (scene.i < scene.list.length - 1) { scene.i++; drawScene(); scene.last = performance.now(); }
    else { setAuto(false); return; }
  }
  scene.raf = requestAnimationFrame(loop);
}
function updateBar() {
  const el = $('#scBody'), max = el.scrollHeight - el.clientHeight;
  const p = max > 0 ? el.scrollTop / max : 0, total = scene.list.length || 1;
  $('#scBar').style.width = clamp(((scene.i + p) / total) * 100, 0, 100) + '%';
}
function reqWake() { if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(s => { scene.wake = s; }).catch(() => { }); }
function relWake() { if (scene.wake) { try { scene.wake.release(); } catch (e) { } scene.wake = null; } }

/* ═══ 17. PRINT ═══ */
function doPrint(html) { $('#printArea').innerHTML = '<div>' + html + '</div>'; setTimeout(() => window.print(), 80); }
function printSong(id, shift) {
  const s = songById(id); if (!s) return;
  let extra = ''; const d = s.dynamics;
  if (d && (d.instruments || []).length && (d.sections || []).length) {
    extra = '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:9.5pt"><tr><th style="border:1px solid #999;padding:5px;text-align:left">Инструмент</th>' +
      d.sections.map(x => '<th style="border:1px solid #999;padding:5px">' + esc(x) + '</th>').join('') + '</tr>' +
      d.instruments.map(function (ins) {
        const lv = (d.levels && d.levels[ins]) || {};
        return '<tr><td style="border:1px solid #999;padding:5px;font-weight:700">' + esc(roleLabel(ins)) + (myRoles().indexOf(ins) >= 0 ? ' (вы)' : '') + '</td>' +
          d.sections.map(x => '<td style="border:1px solid #999;padding:5px;text-align:center">' + esc(lv[x] || '—') + '</td>').join('') + '</tr>';
      }).join('') + '</table>';
  }
  doPrint('<div class="print-song"><h2>' + esc(s.title) + '</h2><div class="pk">' +
    esc([transposeKey(s.key || '', shift || 0), s.bpm ? s.bpm + ' BPM' : '', s.duration ? fmtDur(s.duration) : '', s.artist || ''].filter(Boolean).join(' · ')) +
    '</div><pre>' + esc(transposeLyrics(s.lyrics, shift || 0)) + '</pre>' + extra + '</div>');
}
function printSetlist(id) {
  const sl = slById(id); if (!sl) return;
  const ev = sl.eventId ? evById(sl.eventId) : null;
  let rows = '', total = 0;
  (sl.items || []).forEach(function (it, i) {
    const s = songById(it.songId); if (!s) return;
    total += s.duration || 0;
    rows += '<tr><td>' + (i + 1) + '</td><td>' + esc(s.title) + '</td><td>' + esc(finalKey(s, it.shift)) + '</td><td>' + (s.bpm || '—') + '</td><td>' + fmtDur(s.duration || 0) + '</td><td>' + esc(it.note || '') + '</td></tr>';
  });
  doPrint('<h1>' + esc(sl.name) + '</h1><div class="pmeta">' +
    esc([state.profile.bandName, ev ? pdate(ev.date) + ' · ' + ev.title : '', (sl.items || []).length + ' песен · ' + fmtDur(total)].filter(Boolean).join(' — ')) +
    (sl.note ? '<br>' + esc(sl.note) : '') + '</div>' +
    '<table><thead><tr><th>№</th><th>Песня</th><th>Тональность</th><th>BPM</th><th>Время</th><th>Заметка</th></tr></thead><tbody>' + rows + '</tbody></table>');
}

/* ═══ 18. GLOBAL SEARCH (только главная) ═══ */
function searchAll(q) {
  q = String(q || '').toLowerCase().trim();
  const out = [];
  const add = (group, icon, title, meta, key, act) => out.push({ group: group, icon: icon, title: title, meta: meta, key: key, act: act });
  if (!q) {
    add('Быстрые действия', 'plus', 'Новое событие', 'Календарь · клавиша E', 'E', () => eventModal(null));
    add('Быстрые действия', 'music', 'Новая песня', 'Репертуар · клавиша N', 'N', () => songModal(null));
    add('Быстрые действия', 'list', 'Новый сет-лист', 'Программы · клавиша S', 'S', () => setlistModal(null));
    add('Быстрые действия', 'monitor', 'Сценический режим', 'Полный экран с автопрокруткой', '', () => quickScene());
    add('Быстрые действия', 'palette', 'Оформление', 'Тема, акцент, шрифты', '', () => go('#/settings'));
    state.songs.slice(0, 4).forEach(s => add('Песни', 'music', s.title, [s.key, s.artist].filter(Boolean).join(' · ') || '—', s.key || '', () => go('#/song/' + s.id)));
    upcoming(4).forEach(o => add('Ближайшие события', 'calendar', o.ev.title, pdateShort(o.date) + ' · ' + (o.ev.time || '') + ' · ' + evType(o.ev.type).label, '', () => eventModal(o.ev.id)));
    return out;
  }
  state.songs.forEach(function (s) {
    if (((s.title || '') + ' ' + (s.artist || '') + ' ' + (s.tags || []).join(' ') + ' ' + (s.lyrics || '')).toLowerCase().indexOf(q) >= 0)
      add('Песни', 'music', s.title, [s.key, s.bpm ? s.bpm + ' BPM' : '', s.artist].filter(Boolean).join(' · ') || '—', s.key || '', () => go('#/song/' + s.id));
  });
  expand(iso(new Date(Date.now() - 86400000 * 365)), iso(new Date(Date.now() + 86400000 * 400))).forEach(function (o) {
    if (((o.ev.title || '') + ' ' + (o.ev.location || '') + ' ' + (o.ev.notes || '')).toLowerCase().indexOf(q) >= 0)
      add('События', 'calendar', o.ev.title, pdateShort(o.date) + ' · ' + (o.ev.time || '') + ' · ' + evType(o.ev.type).label, '', () => eventModal(o.ev.id));
  });
  state.setlists.forEach(function (sl) {
    if ((sl.name + ' ' + (sl.note || '')).toLowerCase().indexOf(q) >= 0)
      add('Сет-листы', 'list', sl.name, (sl.items || []).length + ' ' + plural((sl.items || []).length, 'песня', 'песни', 'песен') + ' · ' + fmtDur(setlistDur(sl)), '', () => go('#/setlist/' + sl.id));
  });
  state.members.forEach(function (m) {
    if ((m.name + ' ' + rolesLabel(rolesOf(m)) + ' ' + (m.note || '')).toLowerCase().indexOf(q) >= 0)
      add('Участники', 'users', m.name, rolesLabel(rolesOf(m)), '', () => memberModal(m.id));
  });
  [['Календарь', 'calendar', '#/calendar'], ['Репертуар', 'music', '#/songs'], ['Сет-листы', 'list', '#/setlists'], ['Настройки', 'gear', '#/settings']].forEach(function (t) {
    if (t[0].toLowerCase().indexOf(q) >= 0) add('Разделы', t[1], 'Перейти: ' + t[0], 'Навигация', '', () => go(t[2]));
  });
  const seen = {}, uniq = [];
  out.forEach(function (it) { const k = it.group + '|' + it.title + '|' + it.meta; if (!seen[k]) { seen[k] = 1; uniq.push(it); } });
  return uniq.slice(0, 40);
}
function drawSearch() {
  const dd = $('#searchDrop'), q = ui.searchQ, res = searchAll(q);
  ui.searchFlat = res; ui.searchIdx = 0;
  if (!res.length) dd.innerHTML = '<div class="sd-empty">' + ic('search', 22) + '<p style="margin-top:8px">Ничего не найдено по запросу «' + esc(q) + '».<br>Проверьте раскладку или попробуйте более короткий запрос.</p></div>';
  else {
    let h = '', lastG = '';
    res.forEach(function (r, i) {
      if (r.group !== lastG) { h += '<div class="sd-group">' + esc(r.group) + '</div>'; lastG = r.group; }
      h += '<div class="sd-item' + (i === 0 ? ' sel' : '') + '" data-sr="' + i + '" role="option" aria-selected="' + (i === 0) + '">' +
        '<span class="sd-ic">' + ic(r.icon, 17) + '</span>' +
        '<span class="sd-tx"><span class="sd-t">' + esc(r.title) + '</span><span class="sd-m">' + esc(r.meta || '') + '</span></span>' +
        (r.key ? '<span class="sd-k">' + esc(r.key) + '</span>' : '') + '</div>';
    });
    h += '<div class="sd-foot"><span><b>↑↓</b> навигация</span><span><b>Enter</b> открыть</span><span><b>Esc</b> закрыть</span></div>';
    dd.innerHTML = h;
  }
  dd.classList.add('open');
  $('#globalSearch').setAttribute('aria-expanded', 'true');
  $('#searchWrap').classList.toggle('has-q', !!q);
}
function closeSearch() { const d = $('#searchDrop'); if (d) { d.classList.remove('open'); $('#globalSearch').setAttribute('aria-expanded', 'false'); } }
function moveSearch(d) {
  const items = $$('#searchDrop .sd-item'); if (!items.length) return;
  items.forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-selected', 'false'); });
  ui.searchIdx = (ui.searchIdx + d + items.length) % items.length;
  items[ui.searchIdx].classList.add('sel'); items[ui.searchIdx].setAttribute('aria-selected', 'true');
  items[ui.searchIdx].scrollIntoView({ block: 'nearest' });
}
function runSearch(i) {
  const r = ui.searchFlat[i]; if (!r) return;
  closeSearch();
  const inp = $('#globalSearch'); inp.value = ''; ui.searchQ = ''; $('#searchWrap').classList.remove('has-q'); inp.blur();
  try { r.act(); } catch (e) { toast('Не удалось выполнить действие', 'err'); }
}
function quickScene() {
  const sl = state.setlists.find(x => (x.items || []).length);
  if (sl) return openScene(buildList(sl), 0, 0);
  if (state.songs.length) return openScene(state.songs.slice(0, 12).map(s => ({ songId: s.id, shift: 0, note: '' })), 0, 0);
  toast('Сначала добавьте песни или сет-лист', 'warn');
}

/* ═══ 19. THEME / ACCENT ═══ */
function applyTheme() {
  const s = state.settings;
  document.documentElement.setAttribute('data-theme', s.theme || 'light');
  document.documentElement.setAttribute('data-reduced', s.reduced ? 'true' : 'false');
  document.documentElement.style.setProperty('--lsize', (s.lyricsSize || 15) + 'px');
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', s.theme === 'light' ? '#F5F3EF' : s.theme === 'dark' ? '#14161C' : '#000000');
}
function cycleTheme() {
  const o = ['light', 'dark', 'amoled'];
  setTheme(o[(o.indexOf(state.settings.theme) + 1) % o.length]);
}
function setTheme(t) {
  state.settings.theme = t; applyTheme(); save(); render();
  toast('Тема: ' + ({ light: 'светлая', dark: 'тёмная', amoled: 'AMOLED' }[t]), 'info', 2000);
}
function applyAccent(hex) { if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return; state.settings.accent = hex; applyAccentVars(); save(); render(); }
function applyAccentVars() {
  const hex = state.settings.accent || '#2547D0', r = document.documentElement.style;
  const dark = shade(hex, -.16), press = shade(hex, -.3);
  r.setProperty('--accent', hex);
  r.setProperty('--accent-hover', dark);
  r.setProperty('--accent-press', press);
  r.setProperty('--accent-soft', hex + '14');
  r.setProperty('--accent-soft-2', hex + '24');
  r.setProperty('--accent-ring', hex + '5c');
  r.setProperty('--shadow-accent', '0 6px 16px ' + hex + '38,0 1px 3px ' + hex + '24');
  r.setProperty('--info', hex); r.setProperty('--info-bg', hex + '14');
  function shade(h, amt) {
    const n = parseInt(h.slice(1), 16);
    const f = v => clamp(Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt), 0, 255);
    return '#' + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map(v => pad(v.toString(16))).join('');
  }
}

/* ═══ 20. ONBOARDING ═══ */
let onbStep = 0, onbData = null;
function openOnboarding() {
  onbStep = 0;
  onbData = { name: '', role: '', roles: [], bandName: '', bandDesc: '', participation: 'yes', members: [{ name: '', role: 'vocal', color: PALETTE[0] }], theme: 'light', accent: '#2547D0', demo: false };
  drawOnb(); $('#onb').classList.add('on');
}
function drawOnb() {
  const el = $('#onb'), steps = ['Профиль', 'Группа', 'Состав', 'Старт'];
  let h = '<div class="onb-card"><div class="onb-steps" aria-hidden="true">' + steps.map((s, i) => '<i class="' + (i <= onbStep ? 'on' : '') + '"></i>').join('') + '</div>' +
    '<p class="cap" style="margin-bottom:var(--s2)">Шаг ' + (onbStep + 1) + ' из 4 — ' + steps[onbStep] + '</p>';
  if (onbStep === 0) {
    h += '<div class="onb-hero">' + ic('mic', 28) + '</div><h2>Расскажите о себе</h2>' +
      '<p class="lead">Роль нужна, чтобы в каждой песне подсвечивалась динамика именно вашей партии, а участие в событиях отмечалось одним нажатием.</p>' +
      '<div class="field"><label class="field-label" for="ob_name">Как вас зовут *</label><input class="input" id="ob_name" maxlength="50" value="' + esc(onbData.name) + '" placeholder="Имя и фамилия"><span class="err"></span></div>' +
      '<div class="field"><span class="field-label">Ваши роли в группе * (можно несколько)</span><div class="row" style="gap:6px" id="ob_roles">' +
      ROLES.map(r => '<button type="button" class="chip' + ((onbData.roles || []).indexOf(r.k) >= 0 ? ' on' : '') + '" data-r="' + r.k + '" aria-pressed="' + ((onbData.roles || []).indexOf(r.k) >= 0) + '">' + ic(r.icon, 13) + esc(r.label) + '</button>').join('') + '</div></div>' +
      '<div class="field"><span class="field-label">Участие в событиях по умолчанию</span><div class="seg" id="ob_part">' +
      [['yes', 'Участвую'], ['maybe', 'Под вопросом'], ['no', 'Не участвую']].map(o => '<button type="button" data-v="' + o[0] + '" class="' + (onbData.participation === o[0] ? 'on' : '') + '" data-accent="1">' + o[1] + '</button>').join('') + '</div></div>';
  } else if (onbStep === 1) {
    h += '<div class="onb-hero">' + ic('users', 28) + '</div><h2>Ваш коллектив</h2>' +
      '<p class="lead">Название появится в шапке, на главном экране и в печатных сет-листах.</p>' +
      '<div class="field"><label class="field-label" for="ob_band">Название группы *</label><input class="input" id="ob_band" maxlength="50" value="' + esc(onbData.bandName) + '" placeholder="Neon Coast"><span class="err"></span></div>' +
      '<div class="field"><label class="field-label" for="ob_banddesc">О группе</label><textarea class="input" id="ob_banddesc" rows="3" style="font-family:var(--font);min-height:84px" placeholder="Направление, состав, задачи">' + esc(onbData.bandDesc) + '</textarea></div>' +
      '<div class="field"><span class="field-label">Акцентный цвет интерфейса</span><div class="swatches">' +
      ACCENTS.map(a => '<button type="button" class="sw' + (onbData.accent === a ? ' on' : '') + '" data-a="' + a + '" style="background:' + a + '" aria-label="Акцент ' + a + '"></button>').join('') + '</div></div>';
  } else if (onbStep === 2) {
    h += '<div class="onb-hero">' + ic('wave', 28) + '</div><h2>Состав группы</h2>' +
      '<p class="lead">По этим ролям расписывается динамика партий в песнях: каждый участник увидит только свою строку.</p>' +
      '<div id="ob_members">' + onbData.members.map((m, i) => memberRowHTML(m, i)).join('') + '</div>' +
      '<button class="btn btn-secondary btn-sm mt-s" type="button" id="ob_add_mem">' + ic('plus', 15) + 'Добавить участника</button>';
  } else {
    h += '<div class="onb-hero">' + ic('check', 28) + '</div><h2>Всё готово</h2>' +
      '<p class="lead">Оформление, роли и данные можно изменить в любой момент в разделе «Настройки».</p>' +
      '<div class="field"><span class="field-label">Тема</span><div class="seg" id="ob_theme">' +
      [['light', 'Светлая'], ['dark', 'Тёмная'], ['amoled', 'AMOLED']].map(t => '<button type="button" data-v="' + t[0] + '" class="' + (onbData.theme === t[0] ? 'on' : '') + '" data-accent="1">' + t[1] + '</button>').join('') + '</div></div>' +
      '<div class="field"><span class="field-label">Стартовые данные</span><div class="row" style="gap:6px">' +
      '<button type="button" class="chip' + (onbData.demo ? ' on' : '') + '" id="ob_demo_yes">' + ic('bolt', 13) + 'Загрузить демо</button>' +
      '<button type="button" class="chip' + (!onbData.demo ? ' on' : '') + '" id="ob_demo_no">' + ic('plus', 13) + 'Начать с чистого листа</button></div></div>' +

  }
  h += '<div class="onb-foot">' + (onbStep > 0 ? '<button class="btn btn-secondary" type="button" id="ob_back">' + ic('left', 16) + 'Назад</button>' : '<span></span>') +
    (onbStep < 3 ? '<button class="btn btn-primary" type="button" id="ob_next">Продолжить' + ic('right', 16) + '</button>' : '<button class="btn btn-primary" type="button" id="ob_done">' + ic('check', 16) + 'Начать работу</button>') + '</div></div>';
  el.innerHTML = h; el.setAttribute('aria-hidden', 'false');
  const bind = (id, ev, fn) => { const e = $('#' + id, el); if (e) e.addEventListener(ev, fn); };
  if (onbStep === 0) {
    $$('#ob_roles .chip', el).forEach(b => b.addEventListener('click', () => { const k = b.getAttribute('data-r'), i = onbData.roles.indexOf(k); if (i >= 0) onbData.roles.splice(i, 1); else onbData.roles.push(k); onbData.role = onbData.roles[0] || ''; b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0); const rb = $('#ob_roles', el); if (rb) rb.classList.remove('invalid'); }));
    $$('#ob_part button', el).forEach(b => b.addEventListener('click', () => { onbData.participation = b.getAttribute('data-v'); $$('#ob_part button', el).forEach(x => x.classList.toggle('on', x === b)); }));
    bind('ob_name', 'input', e => { onbData.name = e.target.value; });
  }
  if (onbStep === 1) {
    bind('ob_band', 'input', e => { onbData.bandName = e.target.value; });
    bind('ob_banddesc', 'input', e => { onbData.bandDesc = e.target.value; });
    $$('.sw', el).forEach(b => b.addEventListener('click', () => { onbData.accent = b.getAttribute('data-a'); $$('.sw', el).forEach(x => x.classList.toggle('on', x === b)); }));
  }
  if (onbStep === 2) {
    bindMemberInputs(el);
    bind('ob_add_mem', 'click', () => { collectMembers(el); onbData.members.push({ name: '', role: ROLES[onbData.members.length % ROLES.length].k, color: PALETTE[onbData.members.length % PALETTE.length] }); drawOnb(); });
    $$('[data-ob-del]', el).forEach(b => b.addEventListener('click', function () {
      collectMembers(el);
      onbData.members.splice(+b.getAttribute('data-ob-del'), 1);
      if (!onbData.members.length) onbData.members.push({ name: '', role: 'vocal', color: PALETTE[0] });
      drawOnb();
    }));
  }
  if (onbStep === 3) {
    $('#ob_theme button', el).forEach(b => b.addEventListener('click', () => { onbData.theme = b.getAttribute('data-v'); $('#ob_theme button', el).forEach(x => x.classList.toggle('on', x === b); }));
    bind('ob_demo_yes', 'click', () => { onbData.demo = true; $('#ob_demo_yes').classList.add('on'); $('#ob_demo_no').classList.remove('on'); });
    bind('ob_demo_no', 'click', () => { onbData.demo = false; $('#ob_demo_no').classList.add('on'); $('#ob_demo_yes').classList.remove('on'); });
  }
  bind('ob_back', 'click', () => { collectStep(el); onbStep = Math.max(0, onbStep - 1); drawOnb(); });
  bind('ob_next', 'click', () => {
    collectStep(el);
    if (onbStep === 0) { if (!onbData.name.trim()) { onbErr(el, 'ob_name', 'Введите имя — оно используется в профиле и составе'); return; } if (!onbData.role) { const rb = $('#ob_roles', el); if (rb) rb.classList.add('invalid'); return; } }
    if (onbStep === 1 && !onbData.bandName.trim()) { onbErr(el, 'ob_band', 'Введите название группы'); return; }
    onbStep++; drawOnb();
  });
  bind('ob_done', 'click', () => { collectStep(el); finishOnboarding(); });
}
function onbErr(el, id, msg) {
  const inp = $('#' + id, el);
  if (inp) { const f = inp.closest('.field'); if (f) { f.classList.add('invalid'); const e = $('.err', f); if (e) e.innerHTML = ic('alert', 13) + '<span>' + esc(msg) + '</span>'; } inp.focus(); }
  toast(msg, 'warn');
}
function memberRowHTML(m, i) {
  return '<div class="ob-member" data-ob-row="' + i + '">' +
    '<div class="avatar" style="background:' + esc(m.color || 'var(--accent)') + '" aria-hidden="true">' + esc((m.name || '?').charAt(0).toUpperCase()) + '</div>' +
    '<div class="grow"><label class="sr-only" for="ob_mn_' + i + '">Имя участника</label><input class="input mb-s" id="ob_mn_' + i + '" data-ob-name="' + i + '" maxlength="50" value="' + esc(m.name) + '" placeholder="Имя участника">' +
    '<div class="row" style="gap:6px" data-ob-role="' + i + '">' +
    ROLES.map(r => '<button type="button" class="chip' + (m.role === r.k ? ' on' : '') + '" data-r="' + r.k + '" style="padding:7px 11px;font-size:11.5px;min-height:34px" aria-pressed="' + (m.role === r.k) + '">' + esc(r.label) + '</button>').join('') + '</div></div>' +
    (i > 0 ? '<button class="icon-btn" type="button" data-ob-del="' + i + '" aria-label="Удалить участника">' + ic('x', 15) + '</button>' : '') + '</div>';
}
function bindMemberInputs(el) {
  onbData.members.forEach(function (m, i) {
    const inp = $('[data-ob-name="' + i + '"]', el);
    if (inp) inp.addEventListener('input', e => { m.name = e.target.value; });
    $$('[data-ob-role="' + i + '"] .chip', el).forEach(b => b.addEventListener('click', function () {
      m.role = b.getAttribute('data-r');
      $$('[data-ob-role="' + i + '"] .chip', el).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    }));
  });
}
function collectMembers(el) { onbData.members.forEach(function (m, i) { const inp = $('[data-ob-name="' + i + '"]', el); if (inp) m.name = inp.value; }); }
function collectStep(el) {
  if (onbStep === 0) { const n = $('#ob_name', el); if (n) onbData.name = n.value; }
  if (onbStep === 1) { const b = $('#ob_band', el); if (b) onbData.bandName = b.value; const d = $('#ob_banddesc', el); if (d) onbData.bandDesc = d.value; }
  if (onbStep === 2) collectMembers(el);
}
function finishOnboarding() {
  state.profile.name = onbData.name.trim() || 'Участник';
  state.profile.roles = (onbData.roles || []).slice(); state.profile.role = state.profile.roles[0] || onbData.role;
  state.profile.bandName = onbData.bandName.trim() || 'Моя группа';
  state.profile.bandDesc = onbData.bandDesc;
  state.profile.defaultParticipation = onbData.participation;
  state.settings.theme = onbData.theme; state.settings.accent = onbData.accent;
  state.members = onbData.members.filter(m => m.name.trim()).map(function (m, i) { return { id: uid('m'), name: m.name.trim(), role: m.role, color: m.color || PALETTE[i % PALETTE.length], note: '' }; });
  if (!state.members.some(m => m.name === state.profile.name)) state.members.unshift({ id: uid('m'), name: state.profile.name, role: state.profile.role, roles: myRoles(), color: onbData.accent, note: 'это вы' });
  state.onboardingDone = true;
  if (onbData.demo) seedDemo();
  applyTheme(); applyAccentVars(); save();
  $('#onb').classList.remove('on'); $('#onb').setAttribute('aria-hidden', 'true');
  go('#/calendar'); render();
  toast('BandPlan готов · роль: ' + roleLabel(state.profile.role), 'ok');
}

/* ═══ 21. ACTIONS ═══ */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-act]');
  if (!el) { if (!e.target.closest('#searchWrap')) closeSearch(); return; }
  const a = el.getAttribute('data-act'), id = el.getAttribute('data-id');
  const stop = () => { e.preventDefault(); e.stopPropagation(); };
  const btnLoading = b => { if (b) { b.classList.add('loading'); setTimeout(() => b.classList.remove('loading'), 500); } };
  switch (a) {
    case 'modal-close': stop(); closeModal(); break;
    case 'confirm-yes': { stop(); const cb = confirmCb; hardClose(modalRoot); if (cb) cb(); break; }
    case 'reload-view': stop(); ui.skeleton = true; render(); break;
    case 'nav': stop(); ui.skeleton = true; go('#/' + el.getAttribute('data-to')); break;
    case 'theme-toggle': stop(); cycleTheme(); break;
    case 'theme-set': stop(); setTheme(el.getAttribute('data-v')); break;
    case 'accent-set': stop(); applyAccent(el.getAttribute('data-v')); break;
    case 'notation-set': stop(); state.settings.notation = el.getAttribute('data-v'); commit(); break;
    case 'weekstart-set': stop(); state.settings.weekStart = +el.getAttribute('data-v'); save(); render(); $$('#modalOverlay [data-act="weekstart-set"]').forEach(b => b.classList.toggle('on', +b.getAttribute('data-v') === state.settings.weekStart)); break;
    case 'toggle-auto': stop(); state.settings.autoscroll = !state.settings.autoscroll; commit(); break;
    case 'toggle-reduced': stop(); state.settings.reduced = !state.settings.reduced; applyTheme(); commit(); break;
    case 'toast-mode': stop(); state.settings.toastMode = el.getAttribute('data-v'); save(); render(); break;
    case 'toggle-chords': stop(); state.settings.showChords = state.settings.showChords === false; save(); render(); break;
    case 'scene-chords': stop(); state.settings.showChords = state.settings.showChords === false; save(); drawScene(); break;
    case 'pwa-install': stop(); doInstall(); break;
    case 'dyn-ramp': { stop(); const k = el.getAttribute('data-ins'), up = el.getAttribute('data-d') === 'up', ss = dynDraft.sections || []; dynDraft.levels[k] = dynDraft.levels[k] || {}; ss.forEach((x, i) => { const f = ss.length > 1 ? i / (ss.length - 1) : 1; dynDraft.levels[k][x] = DYN_LEVELS[1 + Math.round((up ? f : 1 - f) * 5)]; }); renderDynBlock(); break; }
    case 'dyn-copy': { stop(); const k = el.getAttribute('data-ins'); dynDraft.instruments.forEach(o => { if (o !== k) dynDraft.levels[o] = Object.assign({}, dynDraft.levels[k] || {}); }); renderDynBlock(); break; }
    case 'dyn-del-section': { stop(); const x = el.getAttribute('data-sec'); dynDraft.sections = (dynDraft.sections || []).filter(y => y !== x); Object.keys(dynDraft.levels || {}).forEach(k => { delete dynDraft.levels[k][x]; }); renderDynBlock(); break; }
    case 'role-set': { stop(); const k = el.getAttribute('data-v'), a2 = myRoles().slice(), i = a2.indexOf(k); if (i >= 0) a2.splice(i, 1); else a2.push(k); state.profile.roles = a2; state.profile.role = a2[0] || ''; commit(); break; }
    case 'part-def': stop(); state.profile.defaultParticipation = el.getAttribute('data-v'); commit(); break;
    case 'cal-nav': {
      stop();
      const d = +el.getAttribute('data-d');
      if (ui.calView === 'month') ui.month.setMonth(ui.month.getMonth() + d);
      else if (ui.calView === 'week') ui.month.setDate(ui.month.getDate() + d * 7);
      else { const x = new Date((ui.selDate || today()) + 'T00:00:00'); x.setDate(x.getDate() + d); ui.selDate = iso(x); ui.month = new Date(x); }
      render(); break;
    }
    case 'cal-today': stop(); ui.month = new Date(); ui.selDate = today(); if (parseHash().name !== 'calendar') go('#/calendar'); else render(); break;
    case 'cal-view': stop(); ui.calView = el.getAttribute('data-v'); state.settings.calView = ui.calView; save(); render(); break;
    case 'cal-day': { stop(); if (e.target.closest('[data-act="event-edit"]')) break; ui.selDate = el.getAttribute('data-date'); ui.month = new Date(ui.selDate + 'T00:00:00'); render(); break; }
    case 'tg-day': stop(); ui.selDate = el.getAttribute('data-date'); ui.calView = 'day'; render(); break;
    case 'tg-col': stop(); if (e.target.closest('.tg-ev')) break; ui.selDate = el.getAttribute('data-date'); eventModal(null, el.getAttribute('data-date')); break;
    case 'new-event': stop(); eventModal(null, el.getAttribute('data-date') || ui.selDate); break;
    case 'event-edit': stop(); eventModal(id); break;
    case 'event-save': {
      stop(); btnLoading(el);
      const data = readEventForm(id); if (!data) break;
      if (id) { const i = state.events.findIndex(x => x.id === id); if (i >= 0) state.events[i] = data; } else state.events.push(data);
      ui.selDate = data.date; ui.month = new Date(data.date + 'T00:00:00');
      modalDirty = false; hardClose(modalRoot); commit();
      toast(id ? 'Изменения события сохранены' : 'Событие добавлено в расписание', 'ok');
      break;
    }
    case 'event-del': {
      stop();
      const ev = evById(id); if (!ev) break;
      const occ = el.getAttribute('data-date');
      if (ev.repeat && ev.repeat !== 'none' && occ && occ !== ev.date) {
        confirmBox('Удалить одно вхождение?', 'Убрать только «' + ev.title + '» на ' + pdate(occ) + '? Остальные повторения серии останутся в расписании.', function () {
          ev.except = (ev.except || []).concat([occ]); commit(); toast('Дата ' + pdate(occ) + ' убрана из серии', 'ok');
        }, 'Удалить эту дату', true);
      } else {
        confirmBox('Удалить событие?', '«' + ev.title + '» будет удалено' + (ev.repeat && ev.repeat !== 'none' ? ' вместе со всеми повторениями серии' : '') + '. Отменить удаление можно будет только через резервную копию.', function () {
          state.events = state.events.filter(x => x.id !== id); commit(); toast('Событие удалено', 'ok');
        }, 'Удалить событие', true);
      }
      break;
    }
    case 'event-done': { stop(); const ev = evById(id); if (ev) { ev.status = 'done'; commit(); toast('Событие отмечено как проведённое', 'ok'); } break; }
    case 'event-undone': { stop(); const ev = evById(id); if (ev) { ev.status = 'upcoming'; commit(); toast('Событие возвращено в план', 'info'); } break; }
    case 'my-status': {
      stop();
      const ev = evById(id); if (!ev) break;
      const v = el.getAttribute('data-v');
      ev.myStatus = ev.myStatus === v ? '' : v;
      commit();
      if (ev.myStatus) toast('Ваше участие: ' + ({ yes: 'участвую', maybe: 'под вопросом', no: 'не участвую' }[ev.myStatus]), 'ok', 2400);
      break;
    }
    case 'ev-filter-open': stop(); openEventFilters(); break;
    case 'ev-type': {
      stop();
      const v = el.getAttribute('data-v'), i = ui.evTypes.indexOf(v);
      if (i >= 0) ui.evTypes.splice(i, 1); else ui.evTypes.push(v);
      render();
      if ($('#modalOverlay').classList.contains('on')) {
        $$('#modalOverlay [data-act="ev-type"]').forEach(b => { const on = ui.evTypes.indexOf(b.getAttribute('data-v')) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
        const c = $('#evFilterDone'); if (c) c.textContent = 'Показать ' + filteredUpcoming().length;
      }
      break;
    }
    case 'ev-mine': stop(); ui.evMine = !ui.evMine; render(); if ($('#modalOverlay').classList.contains('on')) { const b = $('#modalOverlay [data-act="ev-mine"]'); if (b) { b.classList.toggle('on', ui.evMine); b.setAttribute('aria-pressed', ui.evMine); } const c = $('#evFilterDone'); if (c) c.textContent = 'Показать ' + filteredUpcoming().length; } break;
    case 'ev-repeat': stop(); ui.evRepeat = !ui.evRepeat; render(); if ($('#modalOverlay').classList.contains('on')) { const b = $('#modalOverlay [data-act="ev-repeat"]'); if (b) { b.classList.toggle('on', ui.evRepeat); b.setAttribute('aria-pressed', ui.evRepeat); } const c = $('#evFilterDone'); if (c) c.textContent = 'Показать ' + filteredUpcoming().length; } break;
    case 'ev-clear': stop(); ui.evQuery = ''; render(); break;
    case 'ev-reset': stop(); ui.evTypes = []; ui.evMine = false; ui.evRepeat = false; ui.evQuery = ''; render(); if ($('#modalOverlay').classList.contains('on')) { const c = $('#evFilterDone'); if (c) c.textContent = 'Показать ' + filteredUpcoming().length; } break;
    case 'new-song': stop(); songModal(null); break;
    case 'edit-song': stop(); songModal(id); break;
    case 'song-save': {
      stop(); btnLoading(el);
      const data = readSongForm(id); if (!data) break;
      if (id) { const i = state.songs.findIndex(x => x.id === id); if (i >= 0) state.songs[i] = data; } else state.songs.push(data);
      modalDirty = false; hardClose(modalRoot); save(); go(id ? '#/song/' + id : '#/songs'); render();
      toast(id ? 'Изменения песни сохранены' : 'Песня добавлена в репертуар', 'ok');
      break;
    }
    case 'song-del': {
      stop();
      const s = songById(id); if (!s) break;
      confirmBox('Удалить песню?', '«' + s.title + '» будет удалена из репертуара и из всех сет-листов, где она используется.', function () {
        state.songs = state.songs.filter(x => x.id !== id);
        state.setlists.forEach(sl => { sl.items = (sl.items || []).filter(it => it.songId !== id); });
        save(); go('#/songs'); render(); toast('Песня удалена', 'ok');
      }, 'Удалить песню', true);
      break;
    }
    case 'open-song': stop(); go('#/song/' + id); break;
    case 'fav': { stop(); const s = songById(id); if (!s) break; s.fav = !s.fav; save(); render(); toast(s.fav ? 'Песня в избранном' : 'Песня убрана из избранного', 'info', 2000); break; }
    case 'fav-filter': stop(); ui.songFav = !ui.songFav; render(); break;
    case 'tag': stop(); ui.songTag = el.getAttribute('data-v'); render(); if ($('#modalOverlay').classList.contains('on')) $$('#modalOverlay [data-act="tag"]').forEach(b => b.classList.toggle('on', b.getAttribute('data-v') === ui.songTag)); break;
    case 'song-filter-open': stop(); openSongFilters(); break;
    case 'song-clear': stop(); ui.songQuery = ''; render(); break;
    case 'song-key-clear': stop(); ui.songKey = ''; render(); break;
    case 'song-sort-reset': stop(); ui.songSort = 'title'; render(); break;
    case 'song-reset': stop(); ui.songQuery = ''; ui.songKey = ''; ui.songTag = ''; ui.songFav = false; ui.songSort = 'title'; render(); if ($('#modalOverlay').classList.contains('on')) hardClose(modalRoot); break;
    case 'song-trans': { stop(); ui.detailTrans[id] = clamp((ui.detailTrans[id] || 0) + (+el.getAttribute('data-d')), -11, 11); render(); break; }
    case 'song-trans-reset': stop(); ui.detailTrans[id] = 0; render(); break;
    case 'print-song': stop(); printSong(id, ui.detailTrans[id] || 0); break;
    case 'scene-song': stop(); openScene([{ songId: id, shift: ui.detailTrans[id] || 0, note: '' }], 0, 0); break;
    case 'to-setlist': stop(); addToSetlistModal(id); break;
    case 'dyn-from-lyrics': {
      stop();
      const secs = extractSections($('#f_slyr', modalRoot).value);
      if (!secs.length) { toast('В тексте нет секций вида [Припев]', 'warn'); break; }
      dynDraft.sections = secs;
      dynDraft.instruments.forEach(function (ins) { dynDraft.levels[ins] = dynDraft.levels[ins] || {}; secs.forEach(s => { if (!(s in dynDraft.levels[ins])) dynDraft.levels[ins][s] = ''; }); });
      renderDynBlock(); break;
    }
    case 'dyn-add-section': {
      stop();
      const secs = dynDraft.sections || [];
      let n = secs.length + 1, name = 'Секция ' + n;
      while (secs.indexOf(name) >= 0) { n++; name = 'Секция ' + n; }
      secs.push(name);
      dynDraft.instruments.forEach(ins => { dynDraft.levels[ins] = dynDraft.levels[ins] || {}; dynDraft.levels[ins][name] = ''; });
      renderDynBlock(); break;
    }
    case 'dyn-add-ins': {
      stop();
      const pick = $('#dynInsPick', modalRoot); if (!pick || !pick.value) break;
      dynDraft.instruments.push(pick.value);
      dynDraft.levels[pick.value] = {};
      (dynDraft.sections || []).forEach(s => { dynDraft.levels[pick.value][s] = ''; });
      if (!(dynDraft.sections || []).length) {
        const secs = extractSections($('#f_slyr', modalRoot).value);
        if (secs.length) { dynDraft.sections = secs; secs.forEach(s => { dynDraft.levels[pick.value][s] = ''; }); }
      }
      renderDynBlock(); break;
    }
    case 'dyn-del-ins': { stop(); const k = el.getAttribute('data-ins'); dynDraft.instruments = dynDraft.instruments.filter(x => x !== k); delete dynDraft.levels[k]; renderDynBlock(); break; }
    case 'dyn-fill-all': {
      stop();
      dynDraft.instruments.forEach(function (ins) { dynDraft.levels[ins] = dynDraft.levels[ins] || {}; (dynDraft.sections || []).forEach(s => { if (!dynDraft.levels[ins][s]) dynDraft.levels[ins][s] = 'mf'; }); });
      renderDynBlock(); break;
    }
    case 'dyn-clear': { stop(); dynDraft = { instruments: [], sections: [], levels: {} }; renderDynBlock(); break; }
    case 'new-setlist': stop(); setlistModal(null); break;
    case 'open-setlist': stop(); go('#/setlist/' + id); break;
    case 'sl-rename': stop(); setlistModal(id); break;
    case 'sl-save': {
      stop(); btnLoading(el);
      const name = fv('f_slname'); if (!name) { fieldError('f_slname', 'Введите название сет-листа'); break; }
      let sl = id ? slById(id) : null;
      const picks = $$('.f_slsong:checked', modalRoot).map(c => c.value);
      if (sl) { sl.name = name; sl.note = fv('f_slnote'); }
      else { sl = { id: uid('sl'), name: name, note: fv('f_slnote'), eventId: '', items: picks.map(sid => ({ id: uid('i'), songId: sid, shift: 0, note: '' })) }; state.setlists.push(sl); }
      sl.updatedAt = new Date().toISOString();
      modalDirty = false; hardClose(modalRoot); save(); go('#/setlist/' + sl.id); render();
      toast(id ? 'Сет-лист обновлён' : 'Сет-лист создан', 'ok');
      break;
    }
    case 'sl-del': {
      stop();
      const sl = slById(id); if (!sl) break;
      confirmBox('Удалить сет-лист?', '«' + sl.name + '» будет удалён. Песни в репертуаре останутся, привязанное событие — без программы.', function () {
        state.setlists = state.setlists.filter(x => x.id !== id);
        state.events.forEach(ev => { if (ev.setlistId === id) ev.setlistId = ''; });
        save(); go('#/setlists'); render(); toast('Сет-лист удалён', 'ok');
      }, 'Удалить сет-лист', true);
      break;
    }
    case 'dup-setlist': {
      stop();
      const sl = slById(id); if (!sl) break;
      const c = JSON.parse(JSON.stringify(sl));
      c.id = uid('sl'); c.name = sl.name + ' (копия)'; c.eventId = ''; c.updatedAt = new Date().toISOString();
      (c.items || []).forEach(it => { it.id = uid('i'); });
      state.setlists.push(c); save(); go('#/setlist/' + c.id); render(); toast('Копия сет-листа создана', 'ok');
      break;
    }
    case 'sl-add': stop(); addItem(id, el.getAttribute('data-song'), -1); toast('Песня добавлена в программу', 'ok', 2000); break;
    case 'sl-add-go': { stop(); const slId = el.getAttribute('data-sl'); addItem(slId, el.getAttribute('data-song'), -1); hardClose(modalRoot); go('#/setlist/' + slId); toast('Песня добавлена в сет-лист', 'ok'); break; }
    case 'sl-item-del': { stop(); const sl = slById(el.getAttribute('data-sl')); if (!sl) break; sl.items = (sl.items || []).filter(x => x.id !== el.getAttribute('data-item')); sl.updatedAt = new Date().toISOString(); commit(); break; }
    case 'sl-item-move': {
      stop();
      const sl = slById(el.getAttribute('data-sl')); if (!sl) break;
      const arr = sl.items || [], i = arr.findIndex(x => x.id === el.getAttribute('data-item')), j = i + (+el.getAttribute('data-d'));
      if (i < 0 || j < 0 || j >= arr.length) break;
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      sl.updatedAt = new Date().toISOString(); save(); render(); break;
    }
    case 'sl-shift': {
      stop();
      const sl = slById(el.getAttribute('data-sl')); if (!sl) break;
      const it = (sl.items || []).find(x => x.id === el.getAttribute('data-item')); if (!it) break;
      it.shift = clamp((it.shift || 0) + (+el.getAttribute('data-d')), -11, 11);
      sl.updatedAt = new Date().toISOString(); save(); render(); break;
    }
    case 'sl-item-note': {
      stop();
      const sl = slById(el.getAttribute('data-sl')); if (!sl) break;
      const it = (sl.items || []).find(x => x.id === el.getAttribute('data-item')); if (!it) break;
      const s = songById(it.songId);
      openModal({
        title: 'Заметка к песне', sub: s ? s.title : '',
        body: '<div class="field"><label class="field-label" for="f_inote">Что важно помнить</label><input class="input" id="f_inote" maxlength="120" value="' + esc(it.note || '') + '" placeholder="Например: вступление 8 тактов, без паузы"><span class="hint">Заметка видна в программе, на сцене и в печати</span></div>',
        footer: '<button class="btn btn-secondary" type="button" data-act="modal-close">Отмена</button><button class="btn btn-primary" type="button" data-act="sl-note-save" data-sl="' + sl.id + '" data-item="' + it.id + '">Сохранить заметку</button>'
      });
      break;
    }
    case 'sl-note-save': {
      stop();
      const sl = slById(el.getAttribute('data-sl')); if (!sl) break;
      const it = (sl.items || []).find(x => x.id === el.getAttribute('data-item')); if (!it) break;
      it.note = fv('f_inote'); sl.updatedAt = new Date().toISOString();
      modalDirty = false; hardClose(modalRoot); commit(); toast('Заметка сохранена', 'ok', 2000);
      break;
    }
    case 'sl-clear': {
      stop();
      const sl = slById(id); if (!sl) break;
      confirmBox('Очистить программу?', 'Все песни будут убраны из сет-листа «' + sl.name + '». Сам сет-лист и его заметки останутся.', function () {
        sl.items = []; sl.updatedAt = new Date().toISOString(); commit(); toast('Программа очищена', 'ok');
      }, 'Очистить программу', true);
      break;
    }
    case 'sl-meta-save': {
      stop(); btnLoading(el);
      const sl = slById(id); if (!sl) break;
      const newEv = $('#slEventSel') ? $('#slEventSel').value : '';
      if (sl.eventId && sl.eventId !== newEv) { const old = evById(sl.eventId); if (old && old.setlistId === sl.id) old.setlistId = ''; }
      sl.eventId = newEv;
      if (newEv) { const ev = evById(newEv); if (ev) ev.setlistId = sl.id; }
      sl.note = $('#slNoteInp') ? $('#slNoteInp').value.trim() : sl.note;
      sl.updatedAt = new Date().toISOString(); commit(); toast('Изменения сет-листа сохранены', 'ok');
      break;
    }
    case 'print-setlist': stop(); printSetlist(id); break;
    case 'scene-setlist': { stop(); const sl = slById(id); if (!sl) break; if (!(sl.items || []).length) { toast('В сет-листе нет песен — добавьте их в программу', 'warn'); break; } openScene(buildList(sl), 0, 0); break; }
    case 'scene-quick': stop(); quickScene(); break;
    case 'mem-add': stop(); memberModal(null); break;
    case 'mem-edit': stop(); memberModal(id); break;
    case 'mem-save': {
      stop(); btnLoading(el);
      const name = fv('f_mname'); if (!name) { fieldError('f_mname', 'Введите имя участника'); break; }
      const roleEls = $$('#f_mrole .chip.on', modalRoot);
      let col = null;
      $$('#f_mcol button', modalRoot).forEach(b => { if (b.getAttribute('aria-pressed') === 'true' || (b.style.borderColor && b.style.borderColor.indexOf('transparent') < 0)) col = b; });
      const data = { id: id || uid('m'), name: name, roles: roleEls.length ? roleEls.map(x => x.getAttribute('data-r')) : ['other'], role: roleEls.length ? roleEls[0].getAttribute('data-r') : 'other', note: fv('f_mnote'), color: col ? col.getAttribute('data-c') : PALETTE[0] };
      if (id) { const i = state.members.findIndex(x => x.id === id); if (i >= 0) { data.color = state.members[i].color || data.color; state.members[i] = data; } }
      else state.members.push(data);
      modalDirty = false; hardClose(modalRoot); commit(); toast(id ? 'Данные участника обновлены' : 'Участник добавлен в состав', 'ok');
      break;
    }
    case 'mem-del': {
      stop();
      const m = memById(id); if (!m) break;
      confirmBox('Удалить участника?', '«' + m.name + '» будет удалён из состава группы и из отметок участия в событиях.', function () {
        state.members = state.members.filter(x => x.id !== id); commit(); toast('Участник удалён', 'ok');
      }, 'Удалить участника', true);
      break;
    }
    case 'invite': {
      stop();
      const txt = 'Присоединяйся к ' + (state.profile.bandName || 'группе') + ' в BandPlan: ' + location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Ссылка-приглашение скопирована', 'ok')).catch(() => toast('Не удалось скопировать: ' + txt, 'warn', 7000));
      else toast('Ссылка: ' + txt, 'info', 7000);
      break;
    }
    case 'export': stop(); exportData(); break;
    case 'import': stop(); $('#fileIn').click(); break;
    case 'demo': {
      seedDemo();
      break;
    }
    case 'wipe': {
      stop();
      confirmBox('Удалить все данные?', 'Будут удалены песни, события, сет-листы, участники и настройки. Действие необратимо — сначала скачайте резервную копию.', function () {
        state = defaults(); state.onboardingDone = true; save(); applyTheme(); applyAccentVars(); hardClose(modalRoot); go('#/calendar'); toast('Все данные удалены', 'ok');
      }, 'Удалить все данные', true);
      break;
    }
    case 'search-clear': stop(); { const i = $('#globalSearch'); i.value = ''; ui.searchQ = ''; closeSearch(); i.focus(); $('#searchWrap').classList.remove('has-q'); break; }
    case 'scene-close': stop(); closeScene(); break;
    case 'scene-prev': stop(); if (scene.i > 0) { scene.i--; drawScene(); setAuto(scene.auto); } break;
    case 'scene-next': stop(); if (scene.i < scene.list.length - 1) { scene.i++; drawScene(); setAuto(scene.auto); } else toast('Это последняя песня в программе', 'info', 2000); break;
    case 'scene-auto': stop(); setAuto(!scene.auto); break;
    case 'scene-speed': stop(); scene.speed = clamp(scene.speed + (+el.getAttribute('data-d')), 10, 240); $('#scSpeed').textContent = scene.speed; break;
    case 'scene-font': stop(); scene.size = clamp(scene.size + (+el.getAttribute('data-d')), 14, 64); $('#scBody').style.setProperty('--scsize', scene.size + 'px'); $('#scFont').textContent = scene.size; break;
    case 'scene-trans': stop(); scene.shift = clamp(scene.shift + (+el.getAttribute('data-d')), -11, 11); drawScene(); break;
    case 'scene-fs': {
      stop();
      const s2 = $('#scene');
      if (!document.fullscreenElement) { if (s2.requestFullscreen) s2.requestFullscreen().catch(() => toast('Полноэкранный режим недоступен в этом браузере', 'warn')); }
      else if (document.exitFullscreen) document.exitFullscreen();
      break;
    }
  }
});
document.addEventListener('change', function (e) {
  const t = e.target;
  if (t.getAttribute && t.getAttribute('data-act') === 'dyn-lv' && dynDraft) {
    const ins = t.getAttribute('data-ins'), sec = t.getAttribute('data-sec');
    dynDraft.levels[ins] = dynDraft.levels[ins] || {};
    dynDraft.levels[ins][sec] = t.value;
    save();
  }
});
document.addEventListener('input', function (e) {
  const t = e.target;
  const refocus = sel => { const n = $(sel); if (n) { n.focus(); try { n.setSelectionRange(n.value.length, n.value.length); } catch (err) { } } };
  const soft = (sel, fn) => {
    clearTimeout(t._d);
    t._d = setTimeout(function () { const sc = $('#view').scrollTop; fn(); render(); refocus(sel); $('#view').scrollTop = sc; }, 220);
  };
  if (t.id === 'evQ') { ui.evQuery = t.value; soft('#evQ', () => { }); }
  if (t.id === 'songQ') { ui.songQuery = t.value; soft('#songQ', () => { }); }
  if (t.id === 'libQ') { ui.libQuery = t.value; soft('#libQ', () => { }); }
});
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  const el = e.target.closest && e.target.closest('[role="link"][data-act]');
  if (el && el.getAttribute('tabindex') === '0') { e.preventDefault(); el.click(); }
});

/* ═══ 22. SEARCH WIRING ═══ */
function wireSearch() {
  const inp = $('#globalSearch'), dd = $('#searchDrop');
  if (!inp) return;
  inp.addEventListener('focus', function () { if (document.body.getAttribute('data-route') !== 'calendar') return; ui.searchQ = inp.value; drawSearch(); });
  inp.addEventListener('input', debounce(function () { ui.searchQ = inp.value; drawSearch(); }, 130));
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSearch(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSearch(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runSearch(ui.searchIdx); }
    else if (e.key === 'Escape') { e.preventDefault(); closeSearch(); inp.blur(); }
  });
  dd.addEventListener('click', function (e) { const it = e.target.closest('[data-sr]'); if (it) runSearch(+it.getAttribute('data-sr')); });
  dd.addEventListener('mousemove', function (e) {
    const it = e.target.closest('[data-sr]'); if (!it) return;
    const i = +it.getAttribute('data-sr');
    if (i !== ui.searchIdx) { ui.searchIdx = i; $$('#searchDrop .sd-item').forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-selected', 'false'); }); it.classList.add('sel'); it.setAttribute('aria-selected', 'true'); }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('#searchWrap')) closeSearch(); });
}

/* ═══ 23. SWIPE ═══ */
function wireSwipe() {
  const el = $('#view');
  let sx = 0, sy = 0, st = 0, tracking = false;
  const ok = () => !$('#scene').classList.contains('on') && !$('#modalOverlay').classList.contains('on') && !$('#onb').classList.contains('on') && window.innerWidth <= 900;
  el.addEventListener('touchstart', function (e) {
    if (!ok()) return;
    if (e.target.closest('input,textarea,select,.lib-list,.dropzone,.tg-scroll,.dyn-strip,.dyn-scroll,.lyrics,.search-drop,.actionbar')) return;
    const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); tracking = true;
  }, { passive: true });
  el.addEventListener('touchmove', function (e) {
    if (!tracking) return;
    const t = e.touches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 22 && Math.abs(dx) > Math.abs(dy) * 1.6) el.style.opacity = String(clamp(1 - Math.abs(dx) / 900, .65, 1));
  }, { passive: true });
  el.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false; el.style.opacity = '';
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 900) return;
    const order = TABS.map(x => x.k), cur = navKey(parseHash().name);
    let i = order.indexOf(cur); if (i < 0) i = 0;
    const next = dx < 0 ? order[Math.min(order.length - 1, i + 1)] : order[Math.max(0, i - 1)];
    if (next !== cur) { ui.skeleton = true; go('#/' + next); swipeHint(dx < 0 ? '→' : '←'); }
  }, { passive: true });
}
let hintT = null;
function swipeHint(dir) {
  let h = $('.swipe-hint');
  if (!h) { h = document.createElement('div'); h.className = 'swipe-hint'; h.setAttribute('aria-hidden', 'true'); document.body.appendChild(h); }
  const t = TABS.find(x => x.k === navKey(parseHash().name));
  h.innerHTML = ic(dir === '→' ? 'right' : 'left', 15) + '<span>' + esc(t ? t.t : '') + '</span>';
  h.classList.add('on'); clearTimeout(hintT);
  hintT = setTimeout(() => h.classList.remove('on'), 1000);
}

/* ═══ 24. KEYBOARD ═══ */
document.addEventListener('keydown', function (e) {
  const sceneOn = $('#scene').classList.contains('on');
  const modalOn = $('#modalOverlay').classList.contains('on');
  const typing = /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '');
  if ((e.ctrlKey || e.metaKey) && ['k', 'K', 'л', 'Л'].indexOf(e.key) >= 0) {
    if (document.body.getAttribute('data-route') !== 'calendar') return;
    e.preventDefault();
    const inp = $('#globalSearch');
    if ($('#searchDrop').classList.contains('open')) { closeSearch(); inp.blur(); }
    else { inp.focus(); inp.select(); ui.searchQ = inp.value; drawSearch(); }
    return;
  }
  if (sceneOn) {
    if (e.key === 'Escape') { e.preventDefault(); closeScene(); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); if (scene.i < scene.list.length - 1) { scene.i++; drawScene(); setAuto(scene.auto); } return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (scene.i > 0) { scene.i--; drawScene(); setAuto(scene.auto); } return; }
    if (e.key === ' ' && !typing) { e.preventDefault(); setAuto(!scene.auto); return; }
    if ((e.key === '+' || e.key === '=') && !typing) { e.preventDefault(); scene.size = clamp(scene.size + 2, 14, 64); $('#scBody').style.setProperty('--scsize', scene.size + 'px'); $('#scFont').textContent = scene.size; return; }
    if (e.key === '-' && !typing) { e.preventDefault(); scene.size = clamp(scene.size - 2, 14, 64); $('#scBody').style.setProperty('--scsize', scene.size + 'px'); $('#scFont').textContent = scene.size; return; }
    return;
  }
  if (e.key === 'Escape') {
    if (modalOn) { e.preventDefault(); closeModal(); return; }
    if ($('#searchDrop').classList.contains('open')) { closeSearch(); return; }
  }
  if (typing || modalOn) return;
  const r = parseHash();
  if (r.name === 'calendar') {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      if (ui.calView === 'month') ui.month.setMonth(ui.month.getMonth() + d);
      else if (ui.calView === 'week') ui.month.setDate(ui.month.getDate() + d * 7);
      else { const x = new Date((ui.selDate || today()) + 'T00:00:00'); x.setDate(x.getDate() + d); ui.selDate = iso(x); ui.month = new Date(x); }
      render(); return;
    }
    if (e.key === 't' || e.key === 'е' || e.key === 'T') { ui.month = new Date(); ui.selDate = today(); render(); e.preventDefault(); return; }
    if (e.key === 'e' || e.key === 'у' || e.key === 'E') { e.preventDefault(); eventModal(null); return; }
  }
  const k = e.key.toLowerCase();
  if (k === 'n' || k === 'т') { e.preventDefault(); songModal(null); }
  else if (k === 's' || k === 'ы') { e.preventDefault(); setlistModal(null); }
  else if (k === '/' || k === '?') { if (document.body.getAttribute('data-route') === 'calendar') { e.preventDefault(); $('#globalSearch').focus(); } }
});

/* ═══ 25. EXPORT / IMPORT / NET / STICKY ═══ */
function exportData() {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bandplan-' + today() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    state.settings.lastBackup = today(); save(); render();
    toast('Резервная копия сохранена в загрузки', 'ok');
  } catch (e) { toast('Не удалось создать файл копии', 'err'); }
}
function wireImport() {
  $('#fileIn').addEventListener('change', function (e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = function () {
      try {
        const d = JSON.parse(String(rd.result));
        if (!d || typeof d !== 'object' || !Array.isArray(d.songs)) throw new Error('bad');
        const prev = JSON.stringify(state);
        state = Object.assign(defaults(), d);
        state.profile = Object.assign(defaults().profile, d.profile || {});
        state.settings = Object.assign(defaults().settings, d.settings || {});
        state.members = d.members || []; state.events = d.events || [];
        state.songs = d.songs || []; state.setlists = d.setlists || [];
        state.onboardingDone = true;
        applyTheme(); applyAccentVars(); save(); ui.skeleton = true; go('#/calendar');
        toast('Импорт завершён: ' + state.songs.length + ' песен, ' + state.events.length + ' событий', 'ok');
        setTimeout(function () {
          if (confirm('Вернуть данные, которые были до импорта?')) {
            try { state = JSON.parse(prev); applyTheme(); applyAccentVars(); save(); render(); toast('Данные восстановлены до импорта', 'info'); } catch (err) { toast('Не удалось откатить импорт', 'err'); }
          }
        }, 1200);
      } catch (err) { toast('Файл повреждён или не является копией BandPlan', 'err'); }
      e.target.value = '';
    };
    rd.onerror = function () { toast('Не удалось прочитать файл', 'err'); e.target.value = ''; };
    rd.readAsText(f);
  });
}
function wireNet() {
  const bar = $('#netBar');
  const upd = () => {
    if (!bar) return;
    if (navigator.onLine) { bar.hidden = true; bar.innerHTML = ''; }
    else { bar.hidden = false; bar.innerHTML = ic('wifiOff', 16) + '<span>Нет сети. BandPlan работает офлайн — все изменения сохраняются на устройстве.</span>'; }
  };
  window.addEventListener('online', upd); window.addEventListener('offline', upd); upd();
}
function wireStickyHeader() {
  const c = $('#view'), tb = $('#topbar');
  if (!c || !tb) return;
  const mq = window.matchMedia('(max-width:900px)');
  let last = 0, up = 0;
  c.addEventListener('scroll', function () {
    const t = c.scrollTop;
    tb.classList.toggle('stuck', t > 6);
    /* на телефоне шапка уезжает при прокрутке вниз и возвращается при прокрутке вверх */
    if (!mq.matches) { document.body.classList.remove('hdr-hide'); last = t; return; }
    const hidden = document.body.classList.contains('hdr-hide'), d = t - last;
    if (!hidden && d > 0 && t > 90 && c.scrollHeight - c.clientHeight > 420) { document.body.classList.add('hdr-hide'); up = 0; }
    else if (hidden) {
      up = d < 0 ? up - d : 0;
      if (t < 8 || up > 40) { document.body.classList.remove('hdr-hide'); up = 0; }
    }
    last = t;
  }, { passive: true });
  window.addEventListener('hashchange', function () { document.body.classList.remove('hdr-hide'); });
}

/* ═══ 26. INIT ═══ */
async function init() {
  const had = load();
  applyTheme(); applyAccentVars();
  ui.calView = state.settings.calView || 'month';
  if (!location.hash) location.hash = '#/calendar';
  window.addEventListener('hashchange', function () { ui.skeleton = true; render(); });
  wireSearch(); wireSwipe(); wireImport(); wireNet(); wireStickyHeader();
  $('#scBody').addEventListener('scroll', updateBar, { passive: true });
  $('#scBody').addEventListener('wheel', () => { if (scene.auto) setAuto(false); }, { passive: true });
  $('#scBody').addEventListener('touchstart', () => { if (scene.auto) setAuto(false); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#scene').classList.contains('on') && !scene.wake) reqWake(); });
  window.addEventListener('beforeunload', () => { if (scene.raf) cancelAnimationFrame(scene.raf); relWake(); });
  window.addEventListener('online', () => { if (cloud.ready) pushCloudState(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { }); });
  ui.skeleton = true;
  render();
  await initCloud();
  if (!had && !state.onboardingDone && !state.songs.length && !state.events.length) openOnboarding();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


              
