// ST-028: WAVE n banner + intermission countdown. DOM overlay, no assets.
// showWave/showCleared start a timed fade envelope; sync() advances it and,
// while idle, renders the intermission countdown from the wave director.
export function createWaveBanner(root) {
  const el = document.createElement('div');
  el.id = 'wave-banner';
  el.style.cssText = [
    'position:fixed', 'left:0', 'right:0', 'top:18%', 'z-index:10',
    'pointer-events:none', 'text-align:center',
    'font-family:"Segoe UI",system-ui,sans-serif', 'color:#9fd0ff',
    'text-shadow:0 2px 14px rgba(0,0,0,0.9)',
    'letter-spacing:8px', 'font-weight:800', 'font-size:40px',
    'opacity:0', 'user-select:none',
  ].join(';');
  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:15px;letter-spacing:3px;font-weight:600;margin-top:8px;opacity:0.85;color:#cfe4ff;';
  el.appendChild(document.createTextNode(''));
  el.appendChild(sub);
  root.appendChild(el);

  let anim = null; // { t, dur, text, subText }
  let lastCountdown = '';
  const MOD_LABELS = { fast: 'FAST ROCKS', small: 'SMALL ROCKS', inward: 'INWARD DRIFT' }; // ST-051

  function startWave(n, mod, endless) {
    const parts = []; // ST-058: ENDLESS tag, then the wave modifier label
    if (endless) parts.push('ENDLESS');
    if (mod && MOD_LABELS[mod]) parts.push(MOD_LABELS[mod]);
    anim = { t: 0, dur: 1.8, text: 'WAVE ' + n, subText: parts.join(' \u00b7 ') };
    el.style.fontSize = '40px';
  }
  function startCleared(n) { anim = { t: 0, dur: 1.2, text: '', subText: 'WAVE ' + n + ' CLEARED' }; el.style.fontSize = '0px'; }
  function startBoss(n, maxHp) { // ST-135: boss intro banner (bigger, purple-tinted)
    anim = { t: 0, dur: 2.2, text: 'THE MONOLITH', subText: 'WAVE ' + n + ' \u00b7 ' + maxHp + ' HP' };
    el.style.fontSize = '52px';
    el.style.color = '#c9a8ff';
  }

  function easeOut(x) { return 1 - Math.pow(1 - x, 3); } // ST-088
  function easeIn(x) { return x * x * x; }               // ST-088
  function envelope(t, dur) {
    if (t <= 0 || t >= dur) return 0;
    if (t < 0.25) return easeOut(t / 0.25);   // ST-088: eased in
    const out = dur - t;
    if (out < 0.6) return easeIn(out / 0.6);  // ST-088: eased out
    return 1;
  }

  // waves: WaveDirector state ({state, intermission}); dt for animation advance.
  function sync(waves, dt, motionOff) {
    if (anim) {
      anim.t += dt;
      const big = anim.text ? anim.text : '';
      const s = anim.subText ? anim.subText : '';
      el.firstChild.nodeValue = big;
      sub.textContent = s;
      const a = motionOff ? (anim.t < anim.dur ? 1 : 0) : envelope(anim.t, anim.dur);
      el.style.opacity = String(a);
      const inP = Math.min(1, anim.t / 0.4); // ST-088: entry slide-in over 0.4s
      el.style.transform = 'translateY(' + (motionOff ? 0 : (12 * (1 - easeOut(inP))).toFixed(1)) + 'px)'; // ST-088: slide up into place
      if (anim.t >= anim.dur) { anim = null; el.style.opacity = '0'; el.style.fontSize = '40px'; el.style.color = '#9fd0ff'; el.style.transform = 'translateY(0px)'; sub.textContent = ''; el.firstChild.nodeValue = ''; }
      return;
    }
    // idle: intermission countdown
    if (waves && waves.state === 'intermission') {
      const txt = 'NEXT WAVE IN ' + Math.max(0, waves.intermission).toFixed(1);
      if (lastCountdown !== txt) {
        lastCountdown = txt;
        el.firstChild.nodeValue = '';
        sub.textContent = txt;
        el.style.fontSize = '0px'; // hide the empty big line
      }
      el.style.opacity = '0.6';
    } else if (el.style.opacity !== '0') {
      lastCountdown = '';
      el.style.opacity = '0';
      el.style.fontSize = '40px';
      el.firstChild.nodeValue = '';
      sub.textContent = '';
    }
  }

  return { el, showWave: startWave, showCleared: startCleared, showBoss: startBoss, sync };
}
