const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'PASS ':'FAIL ')+n+(d?'  — '+d:'')); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const U = f => 'http://localhost:8801/' + f;
(async () => {
  const b = await chromium.launch();
  async function open(f, vp, extra){ const ctx = await b.newContext(Object.assign({ timezoneId:'Africa/Cairo', serviceWorkers:'block', viewport:vp||{width:412,height:915} }, extra||{}));
    const p = await ctx.newPage(); p._e=[]; p.on('pageerror', e=>p._e.push(e.message)); p.on('dialog', d => d.accept()); await p.goto(U(f)); await p.waitForTimeout(800); return p; }
  const cloud = (p, k) => p.evaluate(kk => JSON.parse(JSON.stringify(window.__STUB__.store[kk] || null)), k);

  // ── every account loads clean ──
  for (const [f, want] of [['test.html',/T\.B\./],['test_plant.html',/day/],['test_petreco.html',/PETRECO/],['test_pf.html',/PETRECO/],
                           ['test_tb.html',/T\.B\. day/],['zz_tb101.html',/T\.B\. day/],['test_empty.html',/no readings yet/],['test_viewer.html',/no access/i],
                           ['test_hist.html',/119/],['test_hist_rg.html',/119/],['test_stray.html',/T\.B\./]]) {
    const p = await open(f);
    const r = await p.evaluate(() => ({ f: document.getElementById('cloud-sync-status').textContent.trim(), d: window.__IO__.denied.length }));
    check(f + ' loads, nothing refused, no errors', want.test(r.f) && r.d === 0 && !p._e.length, r.f + ' / denied ' + r.d + ' ' + p._e.join('|'));
    await p.context().close();
  }

  // ── a Belayim battery (6/2): readings tab, station status tab ──
  { const p = await open('test_tb.html');
    await p.evaluate(() => window.__TB__.setDate('2026-08-20')); await sleep(200);
    const t = await p.evaluate(() => ({ tabs:[...document.querySelectorAll('.ptabs button')].map(x => x.childNodes[0].textContent.trim()).join('|'),
      head:[...document.querySelectorAll('.ptab-read thead th')].map(x => x.childNodes[0].textContent.trim()).join('|') }));
    check('6/2: two tabs, القراءات and وضع المحطة', t.tabs === 'القراءات|وضع المحطة', t.tabs);
    check('6/2 readings: no pump columns any more', t.head === 'Time|Scanner|Production|Line pressure|Temp|Chem. inj.', t.head);
    await p.fill('input[data-tb="tb6_2"][data-k="s"][data-i="5"]', '84830');
    await p.fill('input[data-tb="tb6_2"][data-k="c"][data-i="15"]', '41');
    await p.fill('input[data-tb="tb6_2"][data-k="x"][data-i="18"]', '6.2');
    await p.fill('#tbArea textarea[data-k="r"]', 'Test remark'); await sleep(1500);
    let d = await cloud(p, 'tbReadings/2026-08-20__tb6_2');
    check('6/2: scanner, temperature, chemical and remark still save', d.rows['5'].s === 84830 && d.temp['15'] === 41 && d.chem['18'] === 6.2 && d.remarks === 'Test remark');
    const hd = await p.evaluate(() => ({ today:getComputedStyle(document.querySelector('.hd .tot .v')).color, yest:getComputedStyle(document.querySelector('.hd .ytot .v')).color,
      lt:document.querySelector('.hd .tot .lb').textContent, ly:document.querySelector('.hd .ytot .lb').textContent }));
    check('Header: TODAY green, YESTERDAY grey', hd.lt === 'Today' && hd.ly === 'Yesterday' && hd.today !== hd.yest && /^rgb\(29, 107, 63\)$/.test(hd.today), JSON.stringify(hd));
    await p.evaluate(() => window.__TB__.setDate('2026-08-21')); await sleep(200);
    await p.click('.ptabs button[data-ptab="pumps"]'); await sleep(200);
    const s = await p.evaluate(() => ({ groups:[...document.querySelectorAll('.pd-g')].map(x => x.textContent).join('|'),
      names:[...document.querySelectorAll('.pd-row .nm')].map(x => x.textContent).join('|'),
      comp:[...document.querySelector('.pd-row select[data-i="4"]').options].map(o => o.textContent).join('/'),
      hint:(document.querySelector('.pd-y')||{}).textContent, ar:(document.querySelector('.ms-wa-ar')||{}).textContent,
      btn:(document.querySelector('[data-pdcp]')||{}).textContent }));
    check('6/2 station: boosters, Borets, compressors, fire fighting', s.groups === 'BOOSTER PUMPS|BORETS PUMPS|COMPRESSORS|FIRE FIGHTING', s.groups);
    check('6/2 compressors: Vertical, Horizontal, Diesel; fire: 2 jockey, 2 diesel',
          /Vertical Compressor\|Horizontal Compressor\|Diesel Compressor\|Jockey Pump 1\|Jockey Pump 2\|Diesel Pump 1\|Diesel Pump 2$/.test(s.names), s.names);
    check('Compressors read تشغيل / إيقاف / خارج الخدمة', s.comp === '—/تشغيل/إيقاف/خارج الخدمة', s.comp);
    check('First daily day: yesterday from the last three-hour reading', /أمس/.test(s.hint || ''), s.hint);
    check('WhatsApp box: the Arabic instruction and the button', /انسخ الرسالة وابعتها على جروب الشغل/.test(s.ar || '') && s.btn === 'نسخ الرسالة للجروب', s.ar + ' / ' + s.btn);
    await p.click('.pd-copy'); await sleep(300);
    await p.selectOption('.pd-card select[data-i="5"]', 'out'); await sleep(300);
    check('Out of service: reason opens with the cursor in it', await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('pd-why')));
    await p.keyboard.type('Starter fault'); await sleep(200);
    await p.selectOption('.pd-card select[data-i="7"]', 'sb'); await sleep(1500);
    d = await cloud(p, 'tbReadings/2026-08-21__tb6_2');
    check('Saved for the day', d.pumpsDaily['0'] === 'in' && d.pumpsDaily['3'] === 'out' && d.pumpsDaily['5'] === 'out' && d.pumpsDailyWhy['5'] === 'Starter fault' && d.pumpsDaily['7'] === 'sb',
          JSON.stringify(d.pumpsDaily));
    const m = await p.evaluate(() => document.querySelector('.pd-wa .ms-msg').textContent);
    check('Message headed Tank Battery 6/02, groups and reasons', /^\*`Tank Battery 6\/02`\*/.test(m) && /`COMPRESSORS`[\s\S]*\*Horizontal Compressor : Out of service — Starter fault\*/.test(m) &&
          /\*Borets B : Out of service since 14\/08/.test(m) && /\*Jockey Pump 1 : Standby\*/.test(m), m.split('\n').slice(0,4).join(' / '));
    check('Tab badge counts what is out', await p.evaluate(() => (document.querySelector('.ptabs .pdot')||{}).textContent) === '2');
    check('No page errors (6/2)', !p._e.length, p._e.join('|'));
    await p.context().close(); }

  // ── 10/1: three tabs, measurements, station status ──
  { const p = await open('zz_tb101.html', null, { permissions:['clipboard-read','clipboard-write'] });
    await p.evaluate(() => window.__TB__.setDate('2026-08-19')); await sleep(200);
    check('10/1: three tabs', await p.evaluate(() => [...document.querySelectorAll('.ptabs button')].map(x => x.childNodes[0].textContent.trim()).join('|')) === 'القراءات|مقاسات المحطة|وضع المحطة');
    await p.click('.ptabs button[data-ptab="meas"]'); await sleep(200); await p.click('.ms-t[data-mslot="2"]'); await sleep(200);
    const mm = await p.evaluate(() => ({ msg:document.querySelector('.ptab-meas .ms-msg').textContent, ar:document.querySelector('.ptab-meas .ms-wa-ar').textContent }));
    check('Measurements message intact, with the Arabic instruction', /\*`Tank Battery 10\/01`\*/.test(mm.msg) && /\*TK_7 : 1\.10 m\*/.test(mm.msg) && /`SIGMA HEATERS`/.test(mm.msg) && /جروب الشغل/.test(mm.ar));
    await p.click('.ptabs button[data-ptab="pumps"]'); await sleep(200);
    const sm = await p.evaluate(() => document.querySelector('.pd-wa .ms-msg').textContent);
    const g101 = await p.evaluate(() => [...document.querySelectorAll('.pd-g')].map(x => x.textContent).join('|'));
    check('10/1: waste water and oil room pumps after high pressure', g101 === 'TRANSFER PUMPS|HIGH PRESSURE PUMPS|WASTE WATER PUMPS|OIL ROOM PUMPS|HEATERS|COMPRESSORS|FIRE FIGHTING', g101);
    check('10/1: Waste Water Pump A–C and Oil Room Pump A–B listed', await p.evaluate(() => ['Waste Water Pump A','Waste Water Pump B','Waste Water Pump C','Oil Room Pump A','Oil Room Pump B']
      .every(n => [...document.querySelectorAll('.pd-row .nm')].some(x => x.textContent === n))));
    check('10/1 station message headed 10/01', /^\*`Tank Battery 10\/01`\*/.test(sm) && /`HEATERS`/.test(sm));
    await p.click('button[data-pdcp]'); await sleep(300);
    check('Copy puts it on the clipboard', /Station Status/.test(await p.evaluate(() => navigator.clipboard.readText())));
    check('No page errors (10/1)', !p._e.length, p._e.join('|'));
    await p.context().close(); }

  // ── admin ──
  { const p = await open('test.html', { width:1100, height:900 });
    await p.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-20'); }); await sleep(300);
    const tabs = await p.evaluate(() => [...document.querySelectorAll('#tbArea .tb-panel')].map(pn => pn.querySelectorAll('.ptabs button').length).join(','));
    check('Admin Entry: tabs on every battery (2,2,2,2,3)', tabs === '2,2,2,2,3', tabs);
    await p.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="pumps"]').click()); await sleep(700);
    const r = await p.evaluate(() => ({ rows: document.querySelectorAll('#tbPumpRegister tbody tr').length, cards: document.querySelectorAll('.pm-card').length,
      b62: [...document.querySelectorAll('#tbPumpRegister tbody tr')].map(t => t.innerText.replace(/\s+/g,' ')).filter(x => /6\/2/.test(x)),
      oos: [...document.querySelectorAll('#tbPumpOOS tbody tr')].map(t => t.innerText.replace(/\s+/g,' ')) }));
    check('Report: every item on every battery (64)', r.rows === 64, r.rows + ' rows');
    check('Pumps tab no longer holds PM', r.cards === 0, r.cards + ' PM cards');
    // PM is its own tab, one battery at a time
    await p.evaluate(() => document.querySelector('#tbSubTabs button[data-sub="pm"]').click()); await sleep(700);
    await p.click('#tbPMBats button[data-pmbat="tb6_1"]'); await sleep(300);
    const pmr = await p.evaluate(() => ({ bats:[...document.querySelectorAll('#tbPMBats button')].length, cards:document.querySelectorAll('.pm-card').length,
      groups:[...document.querySelectorAll('.pm-gh')].map(x => x.textContent).join('|') }));
    check('PM tab: a chip per battery, 6/1 shows its 9 items by group', pmr.bats === 5 && pmr.cards === 9 && pmr.groups === 'BOOSTER PUMPS|COMPRESSORS|FIRE FIGHTING', JSON.stringify(pmr));
    await p.click('#tbPMBats button[data-pmbat="tb10_1"]'); await sleep(300);
    check('PM tab: 10/1 shows its 24 items', await p.evaluate(() => document.querySelectorAll('.pm-card').length) === 24);
    await p.click('#tbPMBats button[data-pmbat="tb6_1"]'); await sleep(300);
    check('Report: Belayim pumps keep their three-hourly history', r.b62.some(x => /Booster A In service 327 /.test(x)) && r.b62.some(x => /Borets B Out of service 174 0 153/.test(x)), r.b62.slice(0,4).join(' | '));
    check('Report: earlier stoppages and reasons still there', r.oos.some(x => /Borets B/.test(x) && /Motor tripped/.test(x)) && r.oos.some(x => /Pump B/.test(x) && /seal/i.test(x)), r.oos.length + ' rows');
    // PM: interval, record, remove
    await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText)); c.querySelector('[data-pmopen$="|every"]').click(); }); await sleep(200);
    await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText)); c.querySelector('[data-pme]').value = '100'; c.querySelector('[data-pmesave]').click(); }); await sleep(700);
    check('PM: a short interval makes it overdue', /Booster A[\s\S]*Overdue/.test(await p.evaluate(() => document.querySelector('.pm-card').innerText)));
    check('PM: the battery chip shows the count', await p.evaluate(() => document.querySelector('#tbPMBats button[data-pmbat="tb6_1"] .pdot').textContent) === '1');
    await p.evaluate(() => document.querySelector('.pm-card [data-pmopen$="|rec"]').click()); await sleep(200);
    await p.evaluate(() => { const c = document.querySelector('.pm-card'); c.querySelector('[data-pmd]').value = '2026-08-20'; c.querySelector('[data-pmn]').value = 'Greased'; c.querySelector('[data-pmsave]').click(); }); await sleep(700);
    check('PM recorded: count restarts', await p.evaluate(() => { const c = [...document.querySelectorAll('.pm-card')].find(x => /Booster A/.test(x.innerText)); return /last PM 20 Aug/.test(c.innerText) && !/Overdue/.test(c.innerText); }));
    // report card fits; PDFs build
    const pdf = await p.evaluate(async () => { window.__TB__.setDate('2026-08-19');
      return [(await window.__RG.makePdfBlob()).size, (await window.__REPORT__.pdfFromHTML(window.__TB__.reportHTML(window.__TB__.getDay('2026-08-19')))).size,
              (await window.__REPORT__.pdfFromHTML(window.__TB__.oldDoc())).size]; });
    check('All three PDFs build', pdf.every(x => x > 100000), pdf.join(' / '));
    check('No page errors (admin)', !p._e.length, p._e.join('|'));
    await p.context().close(); }
  { const p = await open('test.html', { width:412, height:915 });
    await p.evaluate(() => { document.querySelector('#appTabs button[data-tab="tb"]').click(); window.__TB__.setDate('2026-08-19'); document.querySelector('#tbSubTabs button[data-sub="old"]').click(); }); await sleep(900);
    const m = await p.evaluate(() => { const r = document.getElementById('tbOldCardFit').getBoundingClientRect(); return { top:r.top, bottom:r.bottom, win:innerHeight }; });
    check('Report card still fits a phone screen', m.top >= 0 && m.bottom <= m.win + 2, JSON.stringify(m));
    await p.context().close(); }

  // ── PETRECO drains, R/G ──
  { const p = await open('test_pf.html');
    await p.evaluate(() => { document.querySelector('#appTabs button[data-tab="pf"]').click(); window.__PF__.setDate('2026-08-20'); });
    const prev = await p.evaluate(() => window.__PF__.getDay('2026-08-20').meters.pgb1.r[5]);
    await p.fill('input[data-pf="pgb1"][data-kind="r"][data-k="6"]', String(prev + 333)); await sleep(200);
    check('PETRECO drains: difference worked out from the readings', await p.evaluate(() => document.querySelector('#pfArea tr[data-pfrow="r6"] td:nth-child(3) .pf-dq').textContent) === '+333');
    await p.context().close(); }
  { const p = await open('test_petreco.html');
    await p.evaluate(() => window.__RG.setDate('2026-08-20'));
    await p.fill('#rgTableArea input[data-rg="p"][data-i="5"]', '9.5'); await sleep(1500);
    check('R/G: a reading saves', (await cloud(p,'rasGara/2026-08-20')).rows['5'].p === 9.5);
    await p.context().close(); }

  // ── night mode ──
  { const p = await open('test.html');
    const t0 = await p.evaluate(() => ({ mode: window.__THEME__.mode(), light: document.body.classList.contains('light-mode') }));
    check('Theme starts in Day', t0.mode === 'light' && t0.light, JSON.stringify(t0));
    await p.click('#themeToggleBtn'); await sleep(100);
    const t1 = await p.evaluate(() => ({ mode: window.__THEME__.mode(), light: document.body.classList.contains('light-mode'), icon: document.querySelector('#themeToggleBtn use').getAttribute('href') }));
    check('Tap 1: Night', t1.mode === 'dark' && !t1.light && t1.icon === '#i-moon', JSON.stringify(t1));
    await p.click('#themeToggleBtn'); await sleep(100);
    const t2 = await p.evaluate(() => { const h = new Date().getHours(); return { mode: window.__THEME__.mode(), light: document.body.classList.contains('light-mode'),
      icon: document.querySelector('#themeToggleBtn use').getAttribute('href'), night: h >= 18 || h < 6 }; });
    check('Tap 2: Auto — dark at night, light in the day, by the clock', t2.mode === 'auto' && t2.icon === '#i-auto' && t2.light === !t2.night, JSON.stringify(t2));
    await p.click('#themeToggleBtn'); await sleep(100);
    check('Tap 3: back to Day', await p.evaluate(() => window.__THEME__.mode() === 'light' && document.body.classList.contains('light-mode')));
    await p.click('#themeToggleBtn'); await sleep(100); await p.click('#themeToggleBtn'); await sleep(100);
    await p.reload(); await p.waitForTimeout(800);
    check('The choice is remembered on the device', await p.evaluate(() => window.__THEME__.mode()) === 'auto');
    await p.context().close(); }

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  await b.close(); process.exit(fail ? 1 : 0);
})();
