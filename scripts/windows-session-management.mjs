import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';

const [profile, port, pid, version = '0.3.59'] = process.argv.slice(2);
const [major, minor, patch] = version.split('.').map(Number);
const supportsPatch = minimum => major > 0 || minor > 3 || (minor === 3 && patch >= minimum);
const debug = 'http://127.0.0.1:' + port;
async function until(read) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try { const value = await read(); if (value) return value; } catch {}
    await pause(120);
  }
  throw Error('Isolated session-management fixture did not become ready');
}

const connection = await until(async () => {
  const info = JSON.parse(await readFile(join(profile, 'connection.json'), 'utf8'));
  return info.pid === Number(pid) && new URL(info.endpoint).hostname === '127.0.0.1' && info;
});
async function send(sessionId, event) {
  const response = await fetch(connection.endpoint + '/v1/events', {
    method: 'POST',
    headers: {authorization:'Bearer ' + connection.token, 'content-type':'application/json'},
    body:JSON.stringify({sessionId, event, agent:'Windows QA', conversationName:sessionId, content:'Installer acceptance test'})
  });
  assert.equal(response.status, 202);
}
const first = 'windows-qa:remove', second = 'windows-qa:keep';
await send(first, 'task.start');
await send(first, 'task.complete');
await send(second, 'task.start');

const page = await until(async () => (await (await fetch(debug + '/json/list')).json())
  .find(p => p.type === 'page' && new URL(p.url).searchParams.get('window') === 'dashboard'));
const socket = new WebSocket(page.webSocketDebuggerUrl);
try {
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, {once:true});
    socket.addEventListener('error', reject, {once:true});
  });
  let sequence = 0;
  async function evaluate(expression) {
    const id = ++sequence;
    const response = new Promise((resolve, reject) => {
      const handler = ({data}) => {
        const message = JSON.parse(data);
        if (message.id !== id) return;
        socket.removeEventListener('message', handler);
        if (message.error || message.result?.exceptionDetails) reject(Error('Installed app failed session management evaluation: ' + JSON.stringify(message.error || message.result.exceptionDetails)));
        else resolve(message.result.result.value);
      };
      socket.addEventListener('message', handler);
    });
    socket.send(JSON.stringify({id, method:'Runtime.evaluate', params:{expression, awaitPromise:true, returnByValue:true}}));
    return response;
  }
  await until(() => evaluate("typeof window.island?.deleteSession === 'function'"));
  const result = await evaluate(`(async () => {
    const {getState, setIslandHidden, deleteSession, archive} = window.island;
    const first = 'windows-qa:remove', second = 'windows-qa:keep';
    const lookup = async id => (await getState()).sessions.find(s => s.id === id);
    await setIslandHidden(first, true);
    const hidden = (await lookup(first))?.islandHidden === true && !(await lookup(second))?.islandHidden;
    await setIslandHidden(first, false);
    const restored = (await lookup(first))?.islandHidden === false;
    await archive(first);
    const archived = (await lookup(first))?.archived === true;
    await setIslandHidden(first, false);
    const restoredArchived = archived && !(await lookup(first))?.archived && !(await lookup(first))?.islandHidden;
    let protectedActive = false;
    try { await deleteSession(second); } catch { protectedActive = true; }
    await deleteSession(first);
    return {hidden, restored, restoredArchived, protectedActive, removed:!(await lookup(first)), retained:!!(await lookup(second))};
  })()`);
  assert.deepEqual(result, {hidden:true, restored:true, restoredArchived:true, protectedActive:true, removed:true, retained:true});
  await send(first, 'task.complete');
  assert.equal(await evaluate("(async () => !(await window.island.getState()).sessions.some(s => s.id === 'windows-qa:remove'))()"), true);
  await until(async () => {
    const {sessions} = JSON.parse(await readFile(join(profile,'state.json'),'utf8'));
    return sessions.some(s => s.id === second) && !sessions.some(s => s.id === first);
  });
  console.log('PASS  Installed Windows dashboard IPC: hide, restore, guarded deletion, persisted deletion and late-event suppression');
  if (supportsPatch(58)) {
    await evaluate("window.island.dashboard('integrations')");
    await until(() => evaluate("!!document.querySelector('.more-agents .more-agent-trigger')"));
    const agents = await evaluate(`(() => {
      const list = document.querySelector('.more-agents');
      const rows = [...list.querySelectorAll('[data-integration]')];
      const setup = list.querySelector('.more-agent-setup');
      return {
        ids: rows.map(row => row.dataset.integration),
        collapsed: rows.every(row => row.querySelector('.more-agent-trigger').getAttribute('aria-expanded') === 'false'),
        hooksRow: setup?.closest('[data-integration]')?.dataset.integration,
        independentSetup: !!setup && !setup.closest('.more-agent-trigger')
      };
    })()`);
    assert.deepEqual(agents, {ids: ['qingyan', 'zhipu', 'doubao', 'grok'], collapsed:true, hooksRow:'zhipu', independentSetup:true});
    const row = ".more-agents [data-integration=grok]";
    const trigger = `document.querySelector('${row} .more-agent-trigger')`;
    const visible = `!document.querySelector('${row} .more-agent-detail').hidden`;
    await evaluate(`${trigger}.click()`);
    await until(() => evaluate(visible));
    await evaluate(`${trigger}.click()`);
    await until(() => evaluate(`!(${visible})`));
    console.log('PASS  Installed dashboard shows four compact agent rows, toggles details, and keeps hook setup independent');
  }
  if (supportsPatch(69)) {
    assert.equal(await evaluate("window.island.getState().then(state => Object.hasOwn(state.settings, 'shortcut'))"), false);
  } else if (supportsPatch(59)) {
    const rebound = await evaluate(`(async () => {
      const original = (await window.island.getState()).settings.shortcut;
      const updated = await window.island.settings({shortcut:'Control+Alt+Shift+U'});
      const saved = (await window.island.getState()).settings.shortcut;
      let rejected = false;
      try { await window.island.settings({shortcut:'CommandOrControl+C'}); } catch { rejected = true; }
      const unchanged = (await window.island.getState()).settings.shortcut === saved;
      const restored = await window.island.settings({shortcut:original});
      return {
        registered:updated.shortcutRegistered === true && saved.endsWith('+U'),
        protected:rejected && unchanged,
        restored:restored.shortcutRegistered === true && restored.settings.shortcut === original
      };
    })()`);
    assert.deepEqual(rebound, {registered:true, protected:true, restored:true});
    console.log('PASS  Installed settings register a custom shortcut, protect Copy, and restore the previous shortcut');
    const occupied = process.env.AISLAND_QA_OCCUPIED_SHORTCUT;
    if (occupied) {
      const retained = await evaluate(`(async () => {
        const original = (await window.island.getState()).settings.shortcut;
        try { await window.island.settings({shortcut:${JSON.stringify(occupied)}}); }
        catch {
          const {shortcutRegistered, settings} = await window.island.getState();
          return shortcutRegistered && settings.shortcut === original;
        }
        return false;
      })()`);
      assert.equal(retained, true);
      console.log('PASS  A shortcut held by another Win32 process was rejected and the prior binding was retained');
    }
    // Leave a non-default binding for the next launch of this same test profile.
    await evaluate("window.island.settings({shortcut:'Control+Alt+Shift+Y'})");
    await until(async () => {
      const state = JSON.parse(await readFile(join(profile, 'state.json'), 'utf8'));
      return state.settings.shortcut.endsWith('+Y');
    });
  }
} finally {
  socket.close();
}
