// ChangePay MDS presentation: 1920x1080 stage, zoom transitions, an 8-minute talk timer (K) and a delivery
// rider who crosses the road in exactly one minute on every slide (a silent per-slide pacing cue).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDES } from './slides.jsx';
import { Hostel, Scooter } from './Scooter.jsx';

const TRANSITION_MS = 850;
const TALK_MS = 8 * 60 * 1000;
const RIDE_S = 60;

const readHash = () => {
  const n = parseInt(window.location.hash.replace('#', ''), 10);
  return Number.isFinite(n) && n >= 1 && n <= SLIDES.length ? n - 1 : 0;
};

const fmt = (ms) => {
  const s = Math.ceil(Math.abs(ms) / 1000);
  return `${ms < 0 ? '+' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Talk timer: K starts / pauses, Shift+K resets. Hidden until first started. */
function useTalkTimer() {
  const [state, setState] = useState({ started: false, running: false, elapsed: 0, since: 0 });
  const [, tick] = useState(0);
  useEffect(() => {
    if (!state.running) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [state.running]);
  const toggle = useCallback(() => {
    setState((s) =>
      s.running ? { ...s, running: false, elapsed: s.elapsed + (Date.now() - s.since) } : { ...s, started: true, running: true, since: Date.now() },
    );
  }, []);
  const reset = useCallback(() => setState({ started: false, running: false, elapsed: 0, since: 0 }), []);
  const elapsed = state.elapsed + (state.running ? Date.now() - state.since : 0);
  return { ...state, remaining: TALK_MS - elapsed, toggle, reset };
}

export default function Deck() {
  const [index, setIndex] = useState(readHash);
  const [leaving, setLeaving] = useState(null);
  const [dir, setDir] = useState('forward');
  const [entryKey, setEntryKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [idle, setIdle] = useState(false);
  const [arrived, setArrived] = useState(false);
  const timer = useTalkTimer();
  const leaveTimer = useRef(null);
  const idleTimer = useRef(null);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const goTo = useCallback(
    (next) => {
      if (next < 0 || next >= SLIDES.length || next === index) return;
      const d = next > index ? 'forward' : 'backward';
      clearTimeout(leaveTimer.current);
      setLeaving({ index, dir: d });
      setDir(d);
      setIndex(next);
      setEntryKey((k) => k + 1); // also restarts the rider's one-minute run
      setArrived(false);
      leaveTimer.current = setTimeout(() => setLeaving(null), TRANSITION_MS);
      window.history.replaceState(null, '', `#${next + 1}`);
    },
    [index],
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'f' || k === 'F' || k === 'F2') {
        e.preventDefault();
        toggleFullscreen();
      } else if (k === 'k' || k === 'K') {
        e.preventDefault();
        if (e.shiftKey) timer.reset();
        else timer.toggle();
      } else if (k === ' ' || k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === 'Enter') {
        e.preventDefault();
        next();
      } else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') {
        e.preventDefault();
        prev();
      } else if (k === 'Home') {
        goTo(0);
      } else if (k === 'End') {
        goTo(SLIDES.length - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, next, prev, toggleFullscreen, timer]);

  // Hide the cursor when the mouse is idle
  const wake = useCallback(() => {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2200);
  }, []);
  useEffect(() => {
    wake();
    window.addEventListener('mousemove', wake);
    return () => {
      window.removeEventListener('mousemove', wake);
      clearTimeout(idleTimer.current);
    };
  }, [wake]);

  const renderSlide = (i, cls, key) => {
    const S = SLIDES[i].Component;
    return (
      <div key={key} className={`slide ${cls}`} style={{ transformOrigin: SLIDES[i].origin ?? '50% 50%' }}>
        <S />
      </div>
    );
  };

  const timerClass = !timer.running ? 'paused' : timer.remaining <= 0 ? 'over' : timer.remaining <= 60000 ? 'warn' : 'running';

  return (
    <div className={`viewport ${idle ? 'hide-cursor' : ''}`} onClick={next}>
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        <div className="glow g1" />
        <div className="glow g2" />
        {leaving ? renderSlide(leaving.index, `exit-${leaving.dir}`, `leave-${entryKey}`) : null}
        {renderSlide(index, leaving ? `enter-${dir}` : '', `enter-${entryKey}`)}

        {/* The road stays put across slides; the rider restarts on every slide and arrives after 60 s */}
        <div className="road">
          <div className="curb" />
          <div className="asphalt" />
          <div className="lane" />
          <div className="hostel">
            <Hostel delivered={arrived} key={`h-${entryKey}`} />
          </div>
          <div
            key={`r-${entryKey}`}
            className={`rider ${arrived ? 'arrived' : ''}`}
            style={{ animationDuration: `${RIDE_S}s` }}
            onAnimationEnd={(e) => {
              if (e.animationName === 'ride') setArrived(true);
            }}
          >
            <Scooter />
          </div>
        </div>

        {timer.started ? (
          <div className={`timer ${timerClass}`}>
            <span className="dot" />
            {fmt(timer.remaining)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
