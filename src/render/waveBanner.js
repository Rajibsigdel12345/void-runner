// ST-028: WAVE n banner + intermission countdown. DOM overlay, no assets.
// I154: polish - scale punch on entry, per-variant boss tint + glow (Monolith purple,
// Splicer cyan), gold "CLEARED" big line. API unchanged (showWave/showCleared/showBoss/sync).
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
    'letter-spacing:8px', 'font-weight:800', 'font-size:calc(40px * var(--vr-fs,1))', // I161: font-scale
    'opacity:0', 'user-select:none',
  ].join(';');
  const sub = document.createElement('div');
  sub.style.cssText = 'font-size:calc(15px * var(--vr-fs,1));letter-spacing:3px;font-weight:600;margin-top:8px;opacity:0.85;color:#cfe4ff;'; // I161: font-scale
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
    el.style.fontSize = 'calc(40px * var(--vr-fs,1))'; // I161: font-scale
  }
  function startCleared(n) { // I154: gold big "CLEARED" + wave sub
    anim = { t: 0, dur: 1.2, text: 'CLEARED', subText: 'WAVE ' + n, tint: '#ffe08a', glow: '0 0 22px rgba(255,224,138,0.35), 0 2px 14px rgba(0,0,0,0.9)' };
    el.style.fontSize = 'calc(40px * var(--vr-fs,1))'; // I161: font-scale
  }
  function startBoss(n, maxHp, name, kind) { // ST-135/143: boss intro (bigger, variant-tinted); I154: per-variant glow
    const splicer = kind === 'splicer';
    anim = { t: 0, dur: 2.2, text: name || 'THE MONOLITH', subText: 'WAVE ' + n + ' \u00b7 ' + maxHp + ' HP',
      tint: splicer ? '#7ff0e0' : '#c9a8ff',
      glow: splicer ? '0 0 26px rgba(127,240,224,0.5), 0 2px 14px rgba(0,0,0,0.9)' : '0 0 26px rgba(201,168,255,0.55), 0 2px 14px rgba(0,0,0,0.9)' };
    el.style.fontSize = 'calc(52px * var(--vr-fs,1))'; // I161: font-scale
    el.style.color = splicer ? '#7ff0e0' : '#c9a8ff';
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
      if (anim.tint) el.style.color = anim.tint; // I154: per-type tint
      el.style.textShadow = anim.glow || '0 2px 14px rgba(0,0,0,0.9)'; // I154: boss/cleared glow, base otherwise
      const inP = Math.min(1, anim.t / 0.4); // ST-088: entry slide-in over 0.4s
      const punch = motionOff ? 1 : 1 + 0.06 * (1 - easeOut(inP)); // I154: scale punch 1.06 -> 1.0
      el.style.transform = 'translateY(' + (motionOff ? 0 : (12 * (1 - easeOut(inP))).toFixed(1)) + 'px) scale(' + punch.toFixed(3) + ')'; // ST-088 + I154
      if (anim.t >= anim.dur) { anim = null; el.style.opacity = '0'; el.style.fontSize = 'calc(40px * var(--vr-fs,1))'; el.style.color = '#9fd0ff'; el.style.textShadow = '0 2px 14px rgba(0,0,0,0.9)'; el.style.transform = 'translateY(0px) scale(1)'; sub.textContent = ''; el.firstChild.nodeValue = ''; } // I154: reset glow + scale; I161: font-scale
      return;
    }
    // idle: intermission countdown
    if (waves && waves.state === 'intermission') {
      const txt = 'NEXT WAVE IN ' + Math.max(0, waves.intermission).toFixed(1);
      if (lastCountdown !== txt) {
        lastCountdown = txt;
        el.firstChild.nodeValue = '';
        sub.textContent = txt;
        el.style.fontSize = '0'; // hide the empty big line (I161: 0 stays 0 at any scale)
      }
      el.style.opacity = '0.6';
    } else if (el.style.opacity !== '0') {
      lastCountdown = '';
      el.style.opacity = '0';
      el.style.fontSize = 'calc(40px * var(--vr-fs,1))'; // I161: font-scale
      el.firstChild.nodeValue = '';
      sub.textContent = '';
    }
  }

  return { el, showWave: startWave, showCleared: startCleared, showBoss: startBoss, sync };
}
