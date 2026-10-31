/* BandPlan Cloud — Supabase Auth and multi-workspace data access.
 * WHY: keep credentials and remote persistence outside the legacy app state engine;
 * only the publishable key is shipped to the browser, while RLS protects every row.
 */
(function () {
  'use strict';
  const URL = 'https://oczcjphvzoadfqntoqlc.supabase.co';
  const KEY = 'sb_publishable_EOBM5JQZQvtXcph4JNFA4w_LjfOjkiY';
  const sb = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  let authMode = 'login';
  let recoveryRequested = location.hash.indexOf('type=recovery') >= 0;

  const $ = (s) => document.querySelector(s);
  const authMessage = (message, error) => {
    const el = $('#authMessage');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('is-error', !!error);
    el.hidden = !message;
  };
  const showAuth = () => {
    const gate = $('#authGate');
    if (gate) { gate.hidden = false; gate.setAttribute('aria-hidden', 'false'); }
    document.body.classList.add('auth-required');
  };
  const hideAuth = () => {
    const gate = $('#authGate');
    if (gate) { gate.hidden = true; gate.setAttribute('aria-hidden', 'true'); }
    document.body.classList.remove('auth-required');
  };
  const setMode = (mode) => {
    authMode = mode;
    const title = $('#authTitle'), submit = $('#authSubmit'), toggle = $('#authToggle'), hint = $('#authHint');
    if (title) title.textContent = mode === 'signup' ? 'Создать аккаунт' : (mode === 'reset' ? 'Новый пароль' : 'С возвращением');
    if (submit) submit.textContent = mode === 'signup' ? 'Зарегистрироваться' : (mode === 'reset' ? 'Сохранить пароль' : 'Войти');
    if (toggle) toggle.textContent = mode === 'signup' ? 'У меня уже есть аккаунт' : 'Создать аккаунт';
    if (hint) hint.textContent = mode === 'signup' ? 'После регистрации подтвердите адрес электронной почты.' : (mode === 'reset' ? 'Укажите новый пароль для своего аккаунта.' : 'Войдите, чтобы открыть свои группы и данные BandPlan.');
    if (toggle) toggle.hidden = mode === 'reset';
    const reset = $('#authReset'); if (reset) reset.hidden = mode === 'reset';
    const password = $('#authPassword'); if (password) { password.autocomplete = mode === 'reset' ? 'new-password' : 'current-password'; password.placeholder = mode === 'reset' ? 'Новый пароль' : 'Не менее 8 символов'; }
    authMessage('');
  };

  async function start() {
    if (!window.supabase || !window.supabase.createClient) throw new Error('Библиотека Supabase не загрузилась.');
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    if (!data.session) { showAuth(); return { user: null, groups: [], userState: {} }; }
    if (recoveryRequested || location.hash.indexOf('type=recovery') >= 0) { showAuth(); setMode('reset'); return { user: null, groups: [], userState: {}, recovery: true }; }
    hideAuth();
    const user = data.session.user;
    const [userStateRes, groupsRes] = await Promise.all([
      sb.from('bandplan_user_state').select('state').eq('user_id', user.id).maybeSingle(),
      sb.rpc('bandplan_get_my_groups')
    ]);
    if (userStateRes.error) throw userStateRes.error;
    if (groupsRes.error) throw groupsRes.error;
    return { user, userState: userStateRes.data && userStateRes.data.state || {}, groups: groupsRes.data || [] };
  }

  async function loadGroup(groupId, userId) {
    const [stateRes, groupRes, accountRes] = await Promise.all([
      sb.from('bandplan_group_state').select('state').eq('group_id', groupId).maybeSingle(),
      sb.from('bandplan_groups').select('id,name,owner_id').eq('id', groupId).single(),
      sb.from('bandplan_accounts').select('display_name,roles,personal_settings').eq('user_id', userId).maybeSingle()
    ]);
    if (stateRes.error) throw stateRes.error;
    if (groupRes.error) throw groupRes.error;
    if (accountRes.error) throw accountRes.error;
    return {
      group: groupRes.data,
      state: stateRes.data && stateRes.data.state || {},
      account: accountRes.data || {}
    };
  }

  async function persistGroup(groupId, appState, previous, userId) {
    const events = (appState.events || []).map(event => {
      const copy = Object.assign({}, event);
      const participation = Object.assign({}, copy.participation || {});
      if (userId) participation[userId] = copy.myStatus || '';
      delete copy.myStatus;
      copy.participation = participation;
      return copy;
    });
    const snapshot = {
      songs: appState.songs || [], events,
      setlists: appState.setlists || [], members: appState.members || []
    };
    const before = previous || { songs: [], events: [], setlists: [], members: [] };
    const removed = (key) => (before[key] || []).map(x => x.id).filter(id => !(snapshot[key] || []).some(x => x.id === id));
    const deleted = {
      songs: removed('songs'), events: removed('events'),
      setlists: removed('setlists'), members: removed('members')
    };
    const { error: rpcError } = await sb.rpc('bandplan_sync_group', {
      p_songs: snapshot.songs, p_events: snapshot.events, p_setlists: snapshot.setlists,
      p_roster: snapshot.members, p_display_name: appState.profile && appState.profile.name || '',
      p_roles: appState.profile && appState.profile.roles || [],
      p_personal_settings: appState.settings || {},
      p_delete_songs: deleted.songs, p_delete_events: deleted.events,
      p_delete_setlists: deleted.setlists, p_group_id: groupId
    });
    if (rpcError) throw rpcError;

    // WHY: merge non-conflicting edits from other musicians instead of replacing their
    // recently added songs/events/setlists with this device's older local snapshot.
    const currentState = await sb.from('bandplan_group_state').select('state').eq('group_id', groupId).maybeSingle();
    if (currentState.error) throw currentState.error;
    const remote = currentState.data && currentState.data.state || {};
    const normalize = (key, item) => {
      if (key !== 'events') return item;
      const copy = Object.assign({}, item);
      delete copy.myStatus;
      return copy;
    };
    const mergeCollection = (key) => {
      const localItems = snapshot[key] || [];
      const remoteItems = remote[key] || [];
      const previousItems = before[key] || [];
      const localMap = new Map(localItems.map(item => [item.id, item]));
      const remoteMap = new Map(remoteItems.map(item => [item.id, item]));
      const previousMap = new Map(previousItems.map(item => [item.id, item]));
      const merged = [];
      for (const item of localItems) {
        const prior = previousMap.get(item.id);
        const remoteItem = remoteMap.get(item.id);
        if (prior && !remoteItem) continue; // a remote deletion wins over a stale local copy
        let chosen = prior && remoteItem && JSON.stringify(normalize(key, item)) === JSON.stringify(normalize(key, prior))
          ? remoteItem : item;
        if (key === 'events') {
          chosen = Object.assign({}, chosen, {
            participation: Object.assign({}, remoteItem && remoteItem.participation || {}, item.participation || {})
          });
        }
        merged.push(chosen);
      }
      for (const item of remoteItems) {
        if (localMap.has(item.id) || deleted[key].includes(item.id)) continue;
        merged.push(item);
      }
      return merged;
    };
    snapshot.songs = mergeCollection('songs');
    snapshot.events = mergeCollection('events');
    snapshot.setlists = mergeCollection('setlists');
    snapshot.members = mergeCollection('members');

    const { error } = await sb.from('bandplan_group_state').upsert({
      group_id: groupId, state: snapshot, updated_at: new Date().toISOString()
    }, { onConflict: 'group_id' });
    if (error) throw error;

    // Keep this device aligned with the merged workspace so the next save does not
    // mistake another member's additions for local deletions.
    appState.songs = snapshot.songs;
    appState.events = snapshot.events.map(event => Object.assign({}, event, {
      myStatus: event.participation && event.participation[userId] || ''
    }));
    appState.setlists = snapshot.setlists;
    appState.members = snapshot.members;
    return snapshot;
  }

  async function saveUserState(userId, state) {
    const { data: current, error: readError } = await sb.from('bandplan_user_state')
      .select('state').eq('user_id', userId).maybeSingle();
    if (readError) throw readError;
    const merged = Object.assign({}, current && current.state || {}, state || {});
    const { error } = await sb.from('bandplan_user_state').upsert({
      user_id: userId, state: merged, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw error;
    return merged;
  }

  async function createGroup(name, displayName, roles) {
    // WHY: create_group_and_invite may reuse an existing membership; create_group
    // always creates a distinct workspace, including when the account already has groups.
    const { data, error } = await sb.rpc('bandplan_create_group', {
      p_name: name, p_display_name: displayName || '', p_roles: roles || []
    });
    if (error) throw error;
    const created = Array.isArray(data) ? data[0] : data;
    if (!created || !created.group_id) return created;
    return { group_id: created.group_id, group_name: name, invite_code: created.invite_code };
  }
  async function joinGroup(code, displayName, roles) {
    const { data, error } = await sb.rpc('bandplan_join_group', {
      p_code: code, p_display_name: displayName || '', p_roles: roles || []
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  async function setActiveGroup(groupId) {
    const { error } = await sb.rpc('bandplan_set_active_group', { p_group_id: groupId });
    if (error) throw error;
    return true;
  }
  async function leaveGroup(groupId) {
    const { data, error } = await sb.rpc('bandplan_leave_group', { p_group_id: groupId });
    if (error) throw error;
    return data;
  }
  async function inviteCode() {
    const { data, error } = await sb.rpc('bandplan_get_invite_code');
    if (error) throw error;
    return typeof data === 'string' ? data : (Array.isArray(data) ? data[0] : data);
  }
  async function subscribeGroup(groupId, callback) {
    const channel = sb.channel('bandplan-group-' + groupId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bandplan_group_state', filter: 'group_id=eq.' + groupId }, callback)
      .subscribe();
    return () => sb.removeChannel(channel);
  }

  async function authSubmit(event) {
    event.preventDefault();
    const email = ($('#authEmail').value || '').trim();
    const password = $('#authPassword').value || '';
    const submit = $('#authSubmit');
    if (!email || !password) { authMessage('Введите email и пароль.', true); return; }
    submit.disabled = true;
    try {
      if (authMode === 'reset') {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        authMessage('Пароль обновлён. Выполняется вход…');
        history.replaceState({}, document.title, location.origin + location.pathname);
        location.reload();
      } else if (authMode === 'signup') {
        const { data, error } = await sb.auth.signUp({
          email, password, options: { emailRedirectTo: location.origin + location.pathname }
        });
        if (error) throw error;
        if (data.session) location.reload();
        else authMessage('Письмо для подтверждения отправлено на ' + email + '. Подтвердите адрес и затем войдите.');
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        location.reload();
      }
    } catch (error) {
      authMessage(error && error.message ? error.message : 'Не удалось выполнить вход.', true);
    } finally {
      submit.disabled = false;
    }
  }

  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') { recoveryRequested = true; showAuth(); setMode('reset'); }
  });

  document.addEventListener('DOMContentLoaded', function () {
    const form = $('#authForm');
    if (form) form.addEventListener('submit', authSubmit);
    const toggle = $('#authToggle');
    if (toggle) toggle.addEventListener('click', () => setMode(authMode === 'login' ? 'signup' : 'login'));
    const reset = $('#authReset');
    if (reset) reset.addEventListener('click', async () => {
      const email = ($('#authEmail').value || '').trim();
      if (!email) { authMessage('Сначала укажите email.', true); return; }
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      authMessage(error ? error.message : 'Ссылка для смены пароля отправлена на почту.', !!error);
    });
    setMode('login');
  });

  window.BandPlanCloud = {
    client: sb, start, loadGroup, persistGroup, saveUserState, createGroup, joinGroup,
    setActiveGroup, leaveGroup, inviteCode, subscribeGroup,
    signOut: () => sb.auth.signOut()
  };
})();
