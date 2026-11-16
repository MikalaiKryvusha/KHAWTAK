#!/usr/bin/env node
// test-hooks.mjs — hygiene suite of the four Claude Code hooks ported from KUMM (tools/hooks/): no-backslash-heredoc (A),
// stamp-gate (G), no-permission-question (H), scratch-sweep (L). Cases copied from KUMM tools/test-guards.mjs on 2026-11-16 (owner:
// «посмотри, какие там есть полезные хуки, и заведи себе такие»), plus KATAK cases for the hash-named scratch root; copied into KHAWTAK 2026-11-16.
// This is HYGIENE of the instruments (they can fail), not a functional run: the live hook calls are in testcases/reports/.
//
//   node tools/test-hooks.mjs          # from the project root; exit 0 — every case as expected, 1 — not
//
// Temp dirs live in .work/tmp of the project (HOUSE_RULES R1) and are removed file by file.
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync, copyFileSync, utimesSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = process.cwd();
const HOOK = resolve(ROOT, 'tools/hooks/no-backslash-heredoc.mjs');
const BS = String.fromCharCode(92), NL = String.fromCharCode(10), CRLF = String.fromCharCode(13, 10), TAB = String.fromCharCode(9);
const pad = (n) => String(n).padStart(2, '0');
const localStamp = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const offset = (() => { const m = -new Date().getTimezoneOffset(); const s = m >= 0 ? '+' : '-'; const a = Math.abs(m); return `${s}${pad(Math.floor(a / 60))}:${pad(a % 60)}`; })();
// Прошлое и будущее держатся внутри СЕГОДНЯШНИХ суток: «сейчас ± 10 минут» у полуночи уезжало во вчера / в завтра, и
// controls-loose-times краснел ни за что (прогон 2026-10-08 00:00 — 97 из 98, в 00:01 и 01:31 — 98 из 98). Остаётся окно
// в одну минуту (23:59 — будущее равно «сейчас»): GAP, а не ложь стража.
const DAY_START = new Date(); DAY_START.setHours(0, 0, 0, 0);
const DAY_LAST_MINUTE = DAY_START.getTime() + 86400000 - 60000;
const FUT = localStamp(Math.min(Date.now() + 10 * 60000, DAY_LAST_MINUTE));
const PAST = localStamp(Math.max(Date.now() - 10 * 60000, DAY_START.getTime()));
const TOMORROW = localStamp(Date.now() + 26 * 3600000);
// clamped to the local day like FUT: unclamped, «now + 10 min» after 23:50 lands TOMORROW and the today-only guard rightly ignores it — the case
// went red at 23:57 on 2026-11-14 (a midnight flake of the fixture, not of the guard)
const FUT_Z_FRAC = new Date(Math.min(Date.now() + 10 * 60000, DAY_LAST_MINUTE)).toISOString();   // 2026-…T…:…:….123Z

let bad = 0, total = 0;
const check = (name, got, want) => { total++; const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${got} (want ${want}) — ${name}`); };

const TMP_PREFIX = join(ROOT, '.work', 'tmp', 'katak-test-hooks-');
const tmps = [];
const newTmp = () => { const d = mkdtempSync(TMP_PREFIX); tmps.push(d); return d; };
function removeByEnumeration(dir) {
  if (!resolve(dir).startsWith(TMP_PREFIX)) throw new Error('refusing to clean outside the tool temp: ' + dir);
  const files = [], dirs = [];
  const walk = (p) => { for (const n of readdirSync(p)) { const q = join(p, n); if (statSync(q).isDirectory()) { dirs.push(q); walk(q); } else files.push(q); } };
  walk(dir);
  for (const f of files) unlinkSync(f);
  for (const d of dirs.sort((a, b) => b.split(sep).length - a.split(sep).length)) rmdirSync(d);
  rmdirSync(dir);
}


// ---------- A. the heredoc hook
console.log('A. no-backslash-heredoc');
const hookCase = (name, input, want) => check(name, spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8' }).status, want);
const ev = (command) => JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } });
hookCase("<<'EOF', slash in body", ev("cat > x <<'EOF'" + NL + "p = '." + BS + "Deploy-ModPack.ps1'" + NL + 'EOF'), 2);
hookCase('<<EOF, double slash in body', ev('cat > x <<EOF' + NL + 'a' + BS + BS + 'b' + NL + 'EOF'), 2);
hookCase('<<-END, tab-indented end', ev('cat <<-END' + NL + TAB + 'C:' + BS + 'x' + NL + TAB + 'END'), 2);
hookCase('<<' + BS + 'EOF (judge 2026-09-18)', ev('cat > x <<' + BS + 'EOF' + NL + 'C:' + BS + 'probe' + NL + 'EOF'), 2);
hookCase("<<'END.' (judge)", ev("cat > x <<'END.'" + NL + 'C:' + BS + 'probe' + NL + 'END.'), 2);
hookCase("<<'my-eof' (judge)", ev("cat > x <<'my-eof'" + NL + 'C:' + BS + 'probe' + NL + 'my-eof'), 2);
hookCase('<<"EOF"', ev('cat > x <<"EOF"' + NL + 'C:' + BS + 'probe' + NL + 'EOF'), 2);
hookCase('CRLF command', ev("cat > x <<'EOF'" + CRLF + 'C:' + BS + 'probe' + CRLF + 'EOF'), 2);
hookCase('two heredocs, slash only in the second', ev('cat <<A <<B' + NL + 'one' + NL + 'A' + NL + 'two' + BS + NL + 'B'), 2);
hookCase('control: heredoc without a slash', ev("cat > x <<'EOF'" + NL + 'plain' + NL + 'EOF'), 0);
hookCase('control: slash outside the body', ev("grep 'a" + BS + "|b' f && cat <<'EOF'" + NL + 'plain' + NL + 'EOF'), 0);
hookCase('control: here-string <<<', ev('cat <<< "a' + BS + 'b"'), 0);
hookCase('control: no heredoc, slash in args', ev('echo a' + BS + 'b'), 0);
hookCase('control: arithmetic shift, no slash anywhere', ev('echo $((1<<2))'), 0);
hookCase('control: another tool', JSON.stringify({ tool_name: 'Write', tool_input: { content: 'a' + BS + 'b' } }), 0);
hookCase('control: garbage on stdin (fail-open)', '{not json', 0);
// 2026-10-10 (EXP-0199): обратная кавычка в коде python -c "…" / node -e "…" — bash подставляет её раньше интерпретатора.
const BT = String.fromCharCode(96);
hookCase('python -c "…", backtick inside', ev('python -c "x=\'' + BT + 'a' + BT + '\'; print(x)"'), 2);
hookCase('node -e "…", backtick inside', ev('node -e "console.log(\'' + BT + 'x' + BT + '\')"'), 2);
hookCase('python by path with -I, backtick inside', ev('/d/t/python.exe -I -c "s=\'(' + BT + 'r.md' + BT + ')\'"'), 2);
hookCase('PYTHONIOENCODING=utf-8 python -c, backtick on line 2', ev('PYTHONIOENCODING=utf-8 python -c "' + NL + 'row=\'' + BT + 'cfg' + BT + '\'"'), 2);
hookCase('control: python -c without a backtick', ev('python -c "print(1)"'), 0);
hookCase('control: python -c in single quotes with a backtick', ev("python -c 'x=\"" + BT + "a" + BT + "\"'"), 0);
hookCase('control: backtick in another command, python -c clean', ev('echo ' + BT + 'date' + BT + '; python -c "print(2)"'), 0);
hookCase('control: escaped quote, no backtick inside', ev('python -c "print(' + BS + '"a' + BS + '")"'), 0);


// ---------- G. the stamp-gate hook: a today-dated stamp ahead of the clock is refused BEFORE it lands in a file
// (2026-10-07: «Created: 2026-10-07 09:45» при часах 09:34 и «09:51» при 09:49 — оба поймал сам агент после записи; страж коммита
// видит только KUMM, а код и случаи SvarogsDream — нет; EXP-0137 → EXP-0160 → сегодня дважды: урок без механизма не держит)
console.log('G. stamp-gate');
try {
  const SG = resolve(ROOT, 'tools/hooks/stamp-gate.mjs');
  const sg = (tool, input) => spawnSync(process.execPath, [SG], { input: JSON.stringify({ tool_name: tool, tool_input: input }), encoding: 'utf8' }).status;
  check('Write with a future stamp: refused', sg('Write', { file_path: 'x.md', content: '**Created:** ' + FUT + ' ' + offset }), 2);
  check('Edit with a future «≈» stamp: refused', sg('Edit', { file_path: 'x.cs', old_string: 'a', new_string: '// v2.2 — ' + FUT.slice(0, 10) + ' ≈' + FUT.slice(11) + ' ' + offset }), 2);
  check('Write with a past stamp: passes', sg('Write', { file_path: 'x.md', content: 'pass · ' + PAST }), 0);
  check('Write with a stamp tomorrow (a plan): passes', sg('Write', { file_path: 'x.md', content: 'plan ' + TOMORROW }), 0);
  check('future stamp with claim-ok on the line: passes', sg('Write', { file_path: 'x.md', content: 'meeting ' + FUT + ' claim-ok: назначенная встреча' }), 0);
  // Голое время в сегодняшнем документе испытаний (2026-10-10: «pass 10:08» при 10:07, «10:38–10:58» при 10:53). claim-ok: цитата ошибочных штампов, не штамп
  const tcToday = 'D:/w/KUMM/testcases/TC_x_' + FUT.slice(0, 10) + '.md';
  check('today test doc: verdict time ahead of the clock: refused', sg('Edit', { file_path: tcToday, old_string: 'a', new_string: '| C1 | шаг | ждём | кадр | pass ' + FUT.slice(11, 16) + ': ролик готов |' }), 2);
  check('today test doc: range ending ahead of the clock: refused', sg('Write', { file_path: tcToday, content: '- 00:00–' + FUT.slice(11, 16) + ' — монтаж' }), 2);
  check('today test doc: verdict time in the past: passes', sg('Edit', { file_path: tcToday, old_string: 'a', new_string: '| C1 | шаг | ждём | кадр | pass ' + PAST.slice(11, 16) + ': готово |' }), 0);
  check('today test doc: game clock with an arrow: passes', sg('Write', { file_path: tcToday, content: 'время мира 03:20 → 23:59, час стоял 23:59' }), 0);
  check('control: same verdict outside testcases/: passes', sg('Edit', { file_path: 'D:/w/KUMM/STATUS.md', old_string: 'a', new_string: 'pass ' + FUT.slice(11, 16) }), 0);
  // v2 (2026-10-10 15:4x): запись через Bash (`sed -i`, `printf >>`, heredoc) хук не видел — штамп наперёд ушёл в шапку сторожа
  // SvarogsDream (`sed -i 's|… 15:42 …|'` при часах 15:40). Прежний случай «Bash — не этот хук» закреплял ровно эту дыру.
  check('Bash command writing a future stamp: refused', sg('Bash', { command: "sed -i 's|^# PROVED: .*|# PROVED: " + FUT + "|' x.sh" }), 2);
  check('PowerShell command writing a future stamp: refused', sg('PowerShell', { command: "Add-Content x.md '" + FUT + "'" }), 2);
  check('control: Bash without a stamp passes', sg('Bash', { command: 'git status && date' }), 0);
  check('control: Bash with a past stamp passes', sg('Bash', { command: 'echo ' + PAST }), 0);
  check('control: garbage on stdin (fail-open)', spawnSync(process.execPath, [SG], { input: '{not json', encoding: 'utf8' }).status, 0);
  // v3 (2026-11-14): штамп в ИМЕНИ файла — голосовые файлы `voice/<ГГГГ-ММ-ДД_ЧЧ-ММ-СС>_<смысл>.txt` двух чатов подряд названы по ощущению
  // времени, до 77 минут впереди часов («13-00-00» записан в 11:43); содержимое без штампа, хук смотрел только текст
  const nameStamp = (s) => s.slice(0, 10) + '_' + s.slice(11, 13) + '-' + s.slice(14, 16) + '-00';
  check('Write to a file named with a future stamp: refused', sg('Write', { file_path: 'D:/w/KUMM/voice/' + nameStamp(FUT) + '_x.txt', content: 'фраза' }), 2);
  check('Write to a file named with a past stamp: passes', sg('Write', { file_path: 'D:/w/KUMM/voice/' + nameStamp(PAST) + '_x.txt', content: 'фраза' }), 0);
  check('control: a file named with a future stamp of TOMORROW (a plan): passes', sg('Write', { file_path: 'D:/w/KUMM/voice/' + TOMORROW.slice(0, 10) + '_23-59-00_x.txt', content: 'фраза' }), 0);
  check('Write to a Windows path (backslashes) named with a future stamp: refused', sg('Write', { file_path: 'D:\\w\\KUMM\\voice\\' + nameStamp(FUT) + '_x.txt', content: 'фраза' }), 2);
  check('control: Edit of an already named file with a future stamp passes (the name is fixed by a rename)', sg('Edit', { file_path: 'D:/w/KUMM/voice/' + nameStamp(FUT) + '_x.txt', old_string: 'a', new_string: 'b' }), 0);
  check('control: a name with impossible minutes is not a stamp', sg('Write', { file_path: 'D:/w/KUMM/voice/' + FUT.slice(0, 10) + '_23-99-00_x.txt', content: 'фраза' }), 0);
} catch (e) {
  check('part G ran to the end', 'crashed: ' + String(e && e.message).split(NL)[0].slice(0, 80), 'completed');
}

// ---------- H. the no-permission-question hook (Stop): the turn does not end with «shall I do my own next step?»
// (2026-10-08: «Запустить эту проверку сейчас?» — владелец: «продолжаешь задавать эти ненужные вопросы»; правило в памяти не держало)
console.log('H. no-permission-question');
try {
  const NPQ = resolve(ROOT, 'tools/hooks/no-permission-question.mjs');
  const dir = newTmp();
  const run = (text, extra = {}) => {
    const tp = join(dir, 't' + total + '.jsonl');
    const lines = [
      JSON.stringify({ type: 'user', message: { content: 'вопрос' } }),
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } }),
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash' }] } }),
    ];
    writeFileSync(tp, lines.join(NL) + NL);
    const r = spawnSync(process.execPath, [NPQ], { input: JSON.stringify({ hook_event_name: 'Stop', transcript_path: tp, stop_hook_active: false, ...extra }), encoding: 'utf8' });
    return /"decision":"block"/.test(r.stdout || '') ? 'block' : 'pass';
  };
  check('«Запустить эту проверку сейчас?» (verbatim 2026-10-08): blocked', run('Проверка в три шага.' + NL + NL + 'Запустить эту проверку сейчас?'), 'block');
  check('bold «**Сделать это сейчас?**»: blocked', run('Итог.' + NL + '**Сделать это сейчас?**'), 'block');
  check('«Хотите, чтобы я перезапустил игру?»: blocked', run('Готово. Хотите, чтобы я перезапустил игру?'), 'block');
  check('«Shall I run it now?»: blocked', run('Done. Shall I run it now?'), 'block');
  check('«Продолжаю?»: blocked', run('Шаг 1 готов.' + NL + 'Продолжаю?'), 'block');
  check('report ending with a full stop: passes', run('Руль работает. Отчёт в testcases/reports/.'), 'pass');
  check('question in the middle, statement last: passes', run('Нужен ли свет? Нет.' + NL + 'Делаю шаг 2.'), 'pass');
  check('a question about the owner\'s taste with the marker: passes', run('Какой вариант вам ближе — А или Б? <!-- owner-decision -->'), 'pass');
  check('stop_hook_active (already continued): passes', run('Запустить эту проверку сейчас?', { stop_hook_active: true }), 'pass');
  check('last_assistant_message field is honoured', (() => {
    const r = spawnSync(process.execPath, [NPQ], { input: JSON.stringify({ hook_event_name: 'Stop', last_assistant_message: 'Запустить?', stop_hook_active: false }), encoding: 'utf8' });
    return /"decision":"block"/.test(r.stdout || '') ? 'block' : 'pass';
  })(), 'block');
  check('control: garbage on stdin (fail-open)', spawnSync(process.execPath, [NPQ], { input: '{not json', encoding: 'utf8' }).status, 0);
} catch (e) {
  check('part H ran to the end', 'crashed: ' + String(e && e.message).split(NL)[0].slice(0, 80), 'completed');
}


// ---------- L. the scratch-sweep hook (SessionStart): scratchpads of past sessions idle > 24 h are removed, the current one never
// (2026-10-30: 168 ГБ черновиков закрытых сессий и 8 ГБ свободных на D: — владелец: «как-то нужно, чтобы ИИ агенты сами за собой прибирались»)
console.log('L. scratch-sweep');
try {
  const SW = resolve(ROOT, 'tools/hooks/scratch-sweep.mjs');
  const root = join(tmpdir(), 'claude', 'katak-test-scratch-sweep-' + process.pid);
  mkdirSync(root, { recursive: true });
  const old = Date.now() / 1000 - 3 * 86400;
  const mk = (id, age) => {
    const d = join(root, id, 'scratchpad', 'deep'); mkdirSync(d, { recursive: true });
    const f = join(d, 'work.bin'); writeFileSync(f, 'x'.repeat(1000));
    if (age === 'old') for (const p of [f, d, join(root, id, 'scratchpad'), join(root, id)]) utimesSync(p, old, old);
  };
  mk('old-session', 'old'); mk('fresh-session', 'fresh'); mk('current-session', 'old');
  const run = (...args) => spawnSync(process.execPath, [SW, '--root', root, '--session', 'current-session', ...args], { encoding: 'utf8' });
  const dry = run('--dry-run');
  check('dry run names the old session and deletes nothing', /ушло бы[^\n]*— 1 \(1 файлов/.test(dry.stdout) && existsSync(join(root, 'old-session')), true);
  const r = run();
  check('the old session is removed', existsSync(join(root, 'old-session')), false);
  check('the fresh session stays', existsSync(join(root, 'fresh-session', 'scratchpad', 'deep', 'work.bin')), true);
  check('the current session stays even when idle', existsSync(join(root, 'current-session', 'scratchpad', 'deep', 'work.bin')), true);
  check('the report reaches the agent', /убрано[^\n]*— 1 /.test(r.stdout), true);
  const outside = newTmp(); mkdirSync(join(outside, 'x'), { recursive: true }); utimesSync(join(outside, 'x'), old, old);
  const ref = spawnSync(process.execPath, [SW, '--root', outside, '--session', 's'], { encoding: 'utf8' });
  check('a root outside <TEMP>/claude is refused', /отказ/.test(ref.stdout) && existsSync(join(outside, 'x')), true);
  check('control: garbage on stdin (fail-open)', spawnSync(process.execPath, [SW], { input: '{not json', encoding: 'utf8' }).status, 0);
  // the fixture root lives under <TEMP>/claude, outside the suite's temp — removed here, file by file
  const wipe = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) wipe(p); else unlinkSync(p); } rmdirSync(d); };
  wipe(root);
} catch (e) {
  check('part L ran to the end', 'crashed: ' + String(e && e.message).split(NL)[0].slice(0, 80), 'completed');
}


// ---------- L2 (KATAK, 2026-11-16). The scratch root is named by a HASH on this machine (F:\Temp\claude\58b92a294c75b47e\<session>\):
// the hook finds it by the project's session ids (the *.jsonl names next to transcript_path) and removes ONLY those sessions' dirs.
console.log('L2. scratch-sweep: hash-named root');
try {
  const SW = resolve(ROOT, 'tools/hooks/scratch-sweep.mjs');
  const hashRoot = join(tmpdir(), 'claude', 'katak-test-hash-' + process.pid);
  const proj = newTmp();                                   // stands for ~/.claude/projects/<project>/
  for (const id of ['cur-' + process.pid, 'own-' + process.pid]) writeFileSync(join(proj, id + '.jsonl'), '');
  const old = Date.now() / 1000 - 3 * 86400;
  const mk = (id) => { const d = join(hashRoot, id, 'scratchpad'); mkdirSync(d, { recursive: true }); const f = join(d, 'w.bin');
    writeFileSync(f, 'x'); for (const p of [f, d, join(hashRoot, id)]) utimesSync(p, old, old); };
  mk('cur-' + process.pid); mk('own-' + process.pid); mk('foreign-' + process.pid);
  const event = { hook_event_name: 'SessionStart', source: 'startup', session_id: 'cur-' + process.pid, transcript_path: join(proj, 'cur-' + process.pid + '.jsonl') };
  const r = spawnSync(process.execPath, [SW], { input: JSON.stringify(event), encoding: 'utf8' });
  check('the hash-named root is found by the session ids; one own idle session removed', /убрано[^\n]*— 1 /.test(r.stdout), true);
  check('the own idle session dir is gone', existsSync(join(hashRoot, 'own-' + process.pid)), false);
  check('a dir that is not a session of this project stays', existsSync(join(hashRoot, 'foreign-' + process.pid, 'scratchpad', 'w.bin')), true);
  check('the current session stays even when idle', existsSync(join(hashRoot, 'cur-' + process.pid, 'scratchpad', 'w.bin')), true);
  const wipe = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) wipe(p); else unlinkSync(p); } rmdirSync(d); };
  wipe(hashRoot);
} catch (e) {
  check('part L2 ran to the end', 'crashed: ' + String(e && e.message).split(NL)[0].slice(0, 80), 'completed');
}

for (const d of tmps) { try { removeByEnumeration(d); } catch (e) { console.log(`note: temp left at ${d} (${e.code || e.message})`); } }
console.log(`-- ${total - bad} of ${total} as expected`);
process.exit(bad ? 1 : 0);

