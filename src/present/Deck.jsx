// WellNest presentation: a 1920x1080 stage scaled to the window, zoom transitions between slides,
// keyboard/clicker navigation, fullscreen, and the demo video played in-deck with the spacebar.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDES } from './slides.jsx';

const TRANSITION_MS = 900;

const readHash = () => {
  const n = parseInt(window.location.hash.replace('#', ''), 10);
  return Number.isFinite(n) && n >= 1 && n <= SLIDES.length ? n - 1 : 0;
};

export default function Deck() {
  const [index, setIndex] = useState(readHash);
  const [leaving, setLeaving] = useState(null); // { index, dir }
  const [dir, setDir] = useState('forward');
  const [entryKey, setEntryKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [idle, setIdle] = useState(false);
  const [video, setVideo] = useState({ playing: false, started: false, ended: false });
  const videoRef = useRef(null);
  const leaveTimer = useRef(null);
  const idleTimer = useRef(null);

  // Fit the stage to the window
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
      // Leaving the video slide pauses it and brings its cover back
      if (SLIDES[index].id === 'video') {
        videoRef.current?.pause();
        setVideo({ playing: false, started: false, ended: false });
      }
      clearTimeout(leaveTimer.current);
      setLeaving({ index, dir: d });
      setDir(d);
      setIndex(next);
      setEntryKey((k) => k + 1);
      leaveTimer.current = setTimeout(() => setLeaving(null), TRANSITION_MS);
      window.history.replaceState(null, '', `#${next + 1}`);
    },
    [index],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const toggleVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.ended) {
      next();
      return;
    }
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [next]);

  const onVideoSlide = SLIDES[index].id === 'video';

  // Keyboard + presentation clickers (they send PageDown / PageUp / arrows)
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'f' || k === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (k === ' ' || k === 'Spacebar') {
        e.preventDefault();
        if (onVideoSlide) toggleVideo();
        else next();
      } else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === 'Enter') {
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
  }, [goTo, next, prev, onVideoSlide, toggleVideo, toggleFullscreen]);

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

  const videoState = {
    ref: videoRef,
    ...video,
    onPlay: () => setVideo((s) => ({ ...s, playing: true, started: true, ended: false })),
    onPause: () => setVideo((s) => ({ ...s, playing: false })),
    onEnded: () => setVideo((s) => ({ ...s, playing: false, ended: true })),
  };

  const renderSlide = (i, cls, key) => {
    const S = SLIDES[i].Component;
    return (
      <div key={key} className={`slide ${cls}`} style={{ transformOrigin: SLIDES[i].origin ?? '50% 50%' }}>
        <S active={i === index} video={SLIDES[i].id === 'video' ? videoState : undefined} />
      </div>
    );
  };

  const hideCursor = idle || (onVideoSlide && video.playing);

  return (
    <div
      className={`viewport ${hideCursor ? 'hide-cursor' : ''}`}
      onClick={() => {
        if (onVideoSlide) toggleVideo();
        else next();
      }}
    >
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        {leaving ? renderSlide(leaving.index, `exit-${leaving.dir}`, `leave-${entryKey}`) : null}
        {renderSlide(index, leaving ? `enter-${dir}` : '', `enter-${entryKey}`)}
      </div>
    </div>
  );
}
