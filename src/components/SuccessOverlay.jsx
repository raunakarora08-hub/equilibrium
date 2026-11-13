// src/components/SuccessOverlay.jsx
import React, { useEffect, useRef, useState } from 'react';

// Timeline (ms): check draws in, "Response submitted" rises in, then crossfades to
// "Have a nice day", then the whole overlay fades away. Clicking anywhere skips ahead.
const NICE_DAY_AT = 2000;
const LEAVE_AT = 3700;
const LEAVE_DURATION = 450;

export default function SuccessOverlay({ onDone }) {
  const [showNiceDay, setShowNiceDay] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  // Read onDone through a ref so parent re-renders don't restart the timeline
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  const dismissTimer = useRef(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowNiceDay(true), NICE_DAY_AT),
      setTimeout(() => setIsLeaving(true), LEAVE_AT),
      setTimeout(() => onDoneRef.current(), LEAVE_AT + LEAVE_DURATION)
    ];
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(dismissTimer.current);
    };
  }, []);

  const dismiss = () => {
    if (isLeaving) return;
    setIsLeaving(true);
    dismissTimer.current = setTimeout(() => onDoneRef.current(), LEAVE_DURATION);
  };

  return (
    <div
      className={`success-overlay ${isLeaving ? 'is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      onClick={dismiss}
    >
      <div className="success-stack">
        <div className="success-check">
          <svg viewBox="0 0 112 112" aria-hidden="true">
            <circle className="success-check-ring" cx="56" cy="56" r="48" />
            <path className="success-check-mark" d="M36 57 L50 71 L77 43" />
          </svg>
        </div>
        <div className={`success-text ${showNiceDay ? 'show-niceday' : ''}`}>
          <span className="msg-submitted">Response submitted</span>
          <span className="msg-niceday" aria-hidden={!showNiceDay}>Have a nice day</span>
        </div>
      </div>
    </div>
  );
}
