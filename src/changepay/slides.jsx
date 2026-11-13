// ChangePay MDS deck slides (each drawn on the 1920x960 area above the road). Figures from the project report.
import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bike,
  CircleCheck,
  Clock,
  IndianRupee,
  Package,
  PhoneCall,
  Star,
  Users,
} from 'lucide-react';

// ── Shared ─────────────────────────────────────────────────────────────
/** Number counting up from 0 when the slide mounts. */
const CountUp = ({ to, decimals = 0, duration = 1400, delay = 300, suffix = '' }) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now() + delay;
    const step = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / duration));
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, delay]);
  return (
    <>
      {v.toFixed(decimals)}
      {suffix}
    </>
  );
};

const Head = ({ eyebrow, title }) => (
  <div className="head build" style={{ '--d': '0.05s' }}>
    <div className="eyebrow">
      <i /> {eyebrow}
    </div>
    <div className="title">{title}</div>
  </div>
);

// ── 1. Title ───────────────────────────────────────────────────────────
const NAMES = ['Rishiraj Guha', 'Stuti Mishra', 'Raunak Arora', 'Pratishtha Vishwakarma', 'Mihi Mathur', 'Aarav Kamble'];

const PromiseClock = () => {
  const c = 260;
  return (
    <svg width={520} height={520} viewBox="0 0 520 520" style={{ overflow: 'visible' }}>
      <circle cx={c} cy={c} r={250} fill="#FFFFFF" stroke="rgba(27,42,78,0.08)" strokeWidth={2} />
      {/* 45-minute promise (green), then the overrun (red) */}
      <path d="M 260 40 A 220 220 0 1 1 40 260" fill="none" stroke="#1C9C6B" strokeWidth={22} strokeLinecap="round" opacity={0.9} />
      <path d="M 40 260 A 220 220 0 0 1 260 40" fill="none" stroke="#E0474C" strokeWidth={22} strokeLinecap="round" strokeDasharray="4 30" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const r1 = i % 5 === 0 ? 182 : 192;
        return <line key={i} x1={c + r1 * Math.sin(a)} y1={c - r1 * Math.cos(a)} x2={c + 200 * Math.sin(a)} y2={c - 200 * Math.cos(a)} stroke={i % 5 === 0 ? '#1B2A4E' : '#C9D2E2'} strokeWidth={i % 5 === 0 ? 4 : 2} />;
      })}
      {[12, 3, 6, 9].map((h, i) => (
        <text key={h} x={c + 152 * Math.sin((i * Math.PI) / 2)} y={c - 152 * Math.cos((i * Math.PI) / 2) + 12} textAnchor="middle" fontFamily="Manrope" fontWeight={800} fontSize={34} fill="#1B2A4E">
          {h}
        </text>
      ))}
      {/* Hour hand drifts through the late-night peak; minute hand sweeps and turns red past 45 min */}
      <g transform={`rotate(300 ${c} ${c})`}>
        <g className="clock-hand clock-hr">
          <line x1={c} y1={c} x2={c} y2={c - 105} stroke="#1B2A4E" strokeWidth={12} strokeLinecap="round" />
        </g>
      </g>
      <g className="clock-hand clock-min">
        <line x1={c} y1={c + 24} x2={c} y2={c - 170} stroke="#1B2A4E" strokeWidth={7} strokeLinecap="round" />
      </g>
      <circle cx={c} cy={c} r={14} fill="#F2B33D" stroke="#1B2A4E" strokeWidth={4} />
    </svg>
  );
};

const TitleSlide = () => (
  <>
    <div className="build" style={{ position: 'absolute', left: 110, top: 112, width: 1080, '--d': '0.05s' }}>
      <div className="eyebrow">
        <i /> Management Decision Sciences Project
      </div>
      <div className="title" style={{ fontSize: 92, marginTop: 26 }}>
        Reducing Late-Night Delivery Delays at <span style={{ color: 'var(--blue)' }}>ChangePay</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--muted)', marginTop: 28, lineHeight: 1.35 }}>
        A root-cause and queueing analysis of hostel food delivery
      </div>
    </div>
    <div className="build" style={{ position: 'absolute', left: 110, top: 600, width: 1080, display: 'flex', flexWrap: 'wrap', gap: 14, '--d': '0.35s' }}>
      {NAMES.map((n) => (
        <span key={n} className="chip" style={{ fontSize: 22, padding: '12px 22px', background: '#FFFFFF', border: '1px solid var(--border)', color: 'var(--navy)' }}>
          {n}
        </span>
      ))}
    </div>
    <div className="build" style={{ position: 'absolute', left: 110, top: 790, fontSize: 22, fontWeight: 700, color: 'var(--muted)', '--d': '0.55s' }}>
      T. A. Pai Management Institute, Bengaluru <span style={{ color: 'var(--faint)', margin: '0 12px' }}>·</span> BBA (Honours) · Management Decision Sciences{' '}
      <span style={{ color: 'var(--faint)', margin: '0 12px' }}>·</span> November 2026
    </div>
    <div className="build-pop" style={{ position: 'absolute', left: 1290, top: 150, '--d': '0.25s' }}>
      <PromiseClock />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 26 }}>
        <span className="chip green">
          <Clock size={18} /> 45-min promise
        </span>
        <span className="chip red">Reality: often 1–2 hrs</span>
      </div>
    </div>
  </>
);

// ── 2. The problem ─────────────────────────────────────────────────────
const STATS = [
  { to: 91.7, text: 'of deliveries take longer than 45 min', color: 'var(--red)' },
  { to: 51.8, text: 'take more than an hour', color: 'var(--orange)' },
  { to: 85.3, text: 'of orders come between 10 PM and 1 AM', color: 'var(--blue)' },
  { to: 9.7, text: 'of food arrives hot', color: '#B07A12' },
];
const DELIVERY = [
  { label: '< 45 min', pct: 8.3, color: 'var(--green)' },
  { label: '45 min – 1 hr', pct: 39.9, color: 'var(--amber)' },
  { label: '1 – 2 hrs', pct: 45.7, color: 'var(--orange)' },
  { label: '> 2 hrs', pct: 6.1, color: 'var(--red)' },
];

const ProblemSlide = () => (
  <>
    <Head eyebrow="The Problem" title="The 45-Minute Promise Is Rarely Kept" />
    {STATS.map((s, i) => (
      <div key={s.text} className="card build" style={{ left: 110 + (i % 2) * 410, top: 250 + Math.floor(i / 2) * 260, width: 390, height: 240, padding: '34px 34px', '--d': `${0.15 + i * 0.1}s` }}>
        <div className="big-num" style={{ fontSize: 96, color: s.color }}>
          <CountUp to={s.to} decimals={1} delay={300 + i * 100} suffix="%" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', marginTop: 16, lineHeight: 1.3 }}>{s.text}</div>
      </div>
    ))}
    <div className="card build" style={{ left: 960, top: 250, width: 850, height: 548, padding: '34px 40px', '--d': '0.3s' }}>
      <div className="card-label">Reported delivery time · n = 278</div>
      <div style={{ position: 'relative', height: 300, marginTop: 30, display: 'flex', alignItems: 'flex-end', gap: 34, padding: '0 10px' }}>
        {DELIVERY.map((d, i) => (
          <div key={d.label} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>{d.pct}%</div>
            <div className="build-pop" style={{ width: '100%', height: `${(d.pct / 45.7) * 230}px`, borderRadius: '12px 12px 4px 4px', background: d.color, transformOrigin: 'bottom', '--d': `${0.5 + i * 0.12}s` }} />
          </div>
        ))}
        {/* The promise line, between "< 45 min" and the rest */}
        <div style={{ position: 'absolute', left: 'calc(25% + 4px)', top: -14, bottom: 0, borderLeft: '3px dashed var(--navy)', opacity: 0.55 }} />
        <div style={{ position: 'absolute', left: 'calc(25% + 14px)', top: -16 }} className="chip navy">
          Promise: 45–50 min
        </div>
      </div>
      <div style={{ display: 'flex', gap: 34, padding: '14px 10px 0' }}>
        {DELIVERY.map((d) => (
          <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'var(--muted)' }}>
            {d.label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const fill = Math.max(0, Math.min(1, 2.25 - (n - 1)));
            return (
              <span key={n} style={{ position: 'relative', width: 34, height: 34 }}>
                <Star size={34} color="#D5DBE6" fill="#E9EDF4" style={{ position: 'absolute' }} />
                <span style={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, overflow: 'hidden' }}>
                  <Star size={34} color="#F2B33D" fill="#F2B33D" />
                </span>
              </span>
            );
          })}
        </div>
        <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--navy)' }}>2.25 / 5</span>
        <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--muted)' }}>average satisfaction</span>
      </div>
    </div>
    <div className="build" style={{ position: 'absolute', left: 960, top: 818, width: 760, fontSize: 23, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, '--d': '0.6s' }}>
      <b style={{ color: 'var(--navy)' }}>Why it matters:</b> after the mess closes, students depend on ChangePay — and 74% say delays made them sleep late.
    </div>
  </>
);

// ── 3. The delivery process ────────────────────────────────────────────
const STAGES = [
  { name: 'Order placed', note: 'Student', hot: false },
  { name: 'Order confirmed', note: '75% within 10 min', hot: false },
  { name: 'Food prepared', note: '6 chefs', hot: false },
  { name: 'Packed, sorted & batched', note: 'Minimum batch size', hot: true },
  { name: 'Rider travels', note: '1 fixed rider per block', hot: true },
  { name: 'Drop-off in smart box', note: 'Box full → manual', hot: true },
  { name: 'Student picks up', note: 'No pickup deadline', hot: true },
];

const ProcessSlide = () => (
  <>
    <Head eyebrow="The Delivery Process" title="Where the Time Is Lost" />
    <div className="card build" style={{ left: 110, top: 235, width: 1700, height: 320, '--d': '0.15s' }}>
      {STAGES.map((s, i) => {
        const x = 120 + i * 245;
        return (
          <React.Fragment key={s.name}>
            <div
              style={{
                position: 'absolute',
                left: x - 105,
                top: 52,
                width: 210,
                height: 104,
                borderRadius: 18,
                border: `2.5px solid ${s.hot ? 'var(--red)' : 'var(--blue)'}`,
                background: s.hot ? 'var(--red-soft)' : 'var(--blue-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0 12px',
                fontSize: 21,
                fontWeight: 800,
                color: 'var(--navy)',
                lineHeight: 1.2,
              }}
            >
              {s.name}
            </div>
            <div style={{ position: 'absolute', left: x - 115, top: 168, width: 230, textAlign: 'center', fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: s.hot ? 'var(--red)' : 'var(--muted)' }}>{s.note}</div>
            {i < STAGES.length - 1 ? <ArrowRight size={24} color="#A9B1C3" style={{ position: 'absolute', left: x + 110, top: 92 }} /> : null}
          </React.Fragment>
        );
      })}
      {/* Order lane: quick through the first stages, piling up at the smart box */}
      <div style={{ position: 'absolute', left: 120, top: 258, width: 1470, height: 6, borderRadius: 4, background: 'linear-gradient(90deg, #2F6FDE 0%, #2F6FDE 33%, #E0474C 40%, #E0474C 100%)', opacity: 0.25 }} />
      <div style={{ position: 'absolute', left: 120, top: 261 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="token" style={{ animationDelay: `${-i * 1.55}s` }} />
        ))}
      </div>
    </div>
    <div className="card build" style={{ left: 110, top: 590, width: 720, height: 270, padding: '36px 40px', '--d': '0.3s' }}>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--navy)', lineHeight: 1.15 }}>
        The delay happens <span style={{ color: 'var(--red)' }}>after the food is ready.</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 26, fontSize: 22, fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CircleCheck size={24} color="var(--green)" /> Confirmation is fast — 75% within 10 min
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={24} color="var(--red)" /> Time is lost at batching and the smart box
        </span>
      </div>
    </div>
    <div className="card build" style={{ left: 870, top: 590, width: 860, height: 270, padding: '28px 36px', '--d': '0.45s' }}>
      <div className="card-label">Inside the hostel at the peak</div>
      <div style={{ display: 'flex', gap: 36, marginTop: 20 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 46px)', gap: 7, padding: 12, borderRadius: 16, background: 'var(--navy)' }}>
            {Array.from({ length: 21 }, (_, i) => (
              <span key={i} className="slot" style={{ height: 36, '--d': `${i * 0.26}s` }} />
            ))}
          </div>
          <div className="full-stamp" style={{ position: 'absolute', left: 92, top: 42, padding: '6px 22px', border: '5px solid var(--red)', borderRadius: 12, background: 'rgba(255,255,255,0.9)', color: 'var(--red)', fontSize: 40, fontWeight: 800, letterSpacing: '0.1em' }}>
            FULL
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--muted)', marginTop: 10 }}>Smart box · 21 slots (HB4) · 14 (HB1)</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="ring" style={{ display: 'inline-flex', width: 60, height: 60, borderRadius: '50%', background: 'var(--red-soft)', color: 'var(--red)', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneCall size={30} />
            </span>
            <span style={{ fontSize: 46, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.03em' }}>40–50 min</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.35 }}>Rider stuck at reception, calling students one by one</div>
        </div>
      </div>
    </div>
  </>
);

// ── 4. Root cause ──────────────────────────────────────────────────────
const BONES = [
  { x: 260, up: true, cat: 'Manpower', cause: 'One fixed rider per block' },
  { x: 510, up: true, cat: 'Methods', cause: 'Batching · only 2 status updates' },
  { x: 760, up: true, cat: 'Machines', cause: 'Limited slots\n(21 · 21 · 14)' },
  { x: 260, up: false, cat: 'Materials', cause: 'Food cools while waiting' },
  { x: 510, up: false, cat: 'Environment', cause: '85% of orders 10 PM – 1 AM' },
  { x: 760, up: false, cat: 'Policy', cause: 'No pickup deadline' },
];
const WHYS = [
  'Orders wait after the food is ready',
  'Batching + full smart boxes',
  'Late pickups; riders tied to one block',
  'No updates, no deadline, no demand-based riders',
  'Process not designed for the 10 PM – 1 AM peak',
];

const RootCauseSlide = () => (
  <>
    <Head eyebrow="Root Cause Analysis" title="Fishbone and Why-Why" />
    <div className="card build" style={{ left: 110, top: 232, width: 1100, height: 470, '--d': '0.15s' }}>
      <svg width={1100} height={470} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line className="draw" pathLength={1} x1={60} y1={235} x2={895} y2={235} stroke="#1B2A4E" strokeWidth={6} strokeLinecap="round" style={{ '--d': '0.3s' }} />
        {BONES.map((b, i) => (
          <line key={i} className="draw" pathLength={1} x1={b.x} y1={235} x2={b.x - 120} y2={b.up ? 92 : 378} stroke={b.up ? '#2F6FDE' : '#EE8A32'} strokeWidth={4} strokeLinecap="round" style={{ '--d': `${0.5 + i * 0.1}s` }} />
        ))}
        <circle className="spine-pulse" cx={70} cy={235} r={9} fill="#F2B33D" />
      </svg>
      {BONES.map((b, i) => (
        <React.Fragment key={b.cat}>
          <span className="chip build-pop" style={{ position: 'absolute', left: b.x - 120, top: b.up ? 50 : 388, transform: 'translateX(-50%)', background: b.up ? 'var(--blue)' : 'var(--orange)', color: '#FFFFFF', fontSize: 17, letterSpacing: '0.06em', textTransform: 'uppercase', '--d': `${0.7 + i * 0.1}s` }}>
            {b.cat}
          </span>
          <div className="build" style={{ position: 'absolute', left: b.x - 40, top: b.up ? 132 : 296, width: b.x > 700 ? 150 : 190, whiteSpace: 'pre-line', fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, '--d': `${0.8 + i * 0.1}s` }}>
            {b.cause}
          </div>
        </React.Fragment>
      ))}
      <div style={{ position: 'absolute', left: 905, top: 165, width: 175, height: 140, borderRadius: 20, background: 'var(--red)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 14, boxShadow: '0 18px 36px -16px rgba(224,71,76,0.6)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>Late deliveries</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6, opacity: 0.9, whiteSpace: 'nowrap' }}>over 45–50 min</div>
      </div>
    </div>
    <div className="card build" style={{ left: 1240, top: 232, width: 570, height: 470, padding: '30px 30px 30px 34px', '--d': '0.3s' }}>
      <div className="card-label">Why-Why</div>
      <div style={{ position: 'absolute', left: 58, top: 86, width: 3, height: 352, background: 'var(--blue-soft)' }} />
      <span className="why-flow" style={{ position: 'absolute', left: 52, top: 80, width: 15, height: 15, borderRadius: '50%', background: 'var(--blue)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 22 }}>
        {WHYS.map((w, i) => (
          <div key={w} className="build" style={{ display: 'flex', alignItems: 'center', gap: 16, '--d': `${0.5 + i * 0.15}s` }}>
            <span style={{ flexShrink: 0, width: 50, height: 50, borderRadius: 14, background: 'var(--blue)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, position: 'relative', zIndex: 1 }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.25 }}>{w}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="card build" style={{ left: 110, top: 728, width: 1700, height: 132, padding: '24px 40px', display: 'flex', alignItems: 'center', gap: 40, border: '2.5px solid var(--green)', background: '#F4FBF8', '--d': '0.9s' }}>
      <div style={{ flex: 1 }}>
        <div className="card-label" style={{ color: 'var(--green)' }}>Root cause</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', marginTop: 6 }}>No demand-responsive dispatch and handover process</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)', gap: 10 }}>
        {['Slow pickups', 'Limited slots', 'No status updates', 'Fixed riders, uneven demand'].map((t) => (
          <span key={t} className="chip green" style={{ fontSize: 17 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  </>
);

// ── 5. Queueing models ─────────────────────────────────────────────────
const BOXES = [
  { name: 'HB4-Boys', rho: 1.55 },
  { name: 'HB4-Girls', rho: 1.08 },
  { name: 'HB1', rho: 1.39 },
];
const BLOCKS = [
  { name: 'HB4-Boys', share: 36.8, hot: true },
  { name: 'HB4-Girls', share: 25.5, hot: true },
  { name: 'HB1', share: 22.0, hot: true },
  { name: 'HB3', share: 12.8 },
  { name: 'HB2', share: 2.4 },
  { name: 'HB5', share: 0.4 },
];
const RHO_MAX = 1.7;
const TRACK = 420;

const ModelCard = ({ x, title, model, sub, delay, children }) => (
  <div className="card build" style={{ left: x, top: 236, width: 560, height: 620, padding: '32px 36px', '--d': delay }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em' }}>{title}</div>
      <span className="chip navy">{model}</span>
    </div>
    <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--muted)', marginTop: 8, lineHeight: 1.35 }}>{sub}</div>
    {children}
  </div>
);

const ModelsSlide = () => (
  <>
    <Head eyebrow="Current State in Numbers" title="The Queueing Models" />
    <ModelCard x={110} delay="0.15s" title="Smart box" model="M/M/c" sub="Each slot is a server; pickup time (≈ 40 min) is the service time.">
      <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {BOXES.map((b, i) => {
          const okW = (1 / RHO_MAX) * TRACK;
          const overW = ((b.rho - 1) / RHO_MAX) * TRACK;
          return (
            <div key={b.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, color: 'var(--navy)' }}>
                <span>{b.name}</span>
                <span style={{ color: 'var(--red)' }}>ρ = {b.rho}</span>
              </div>
              <div style={{ position: 'relative', height: 30, marginTop: 8, width: TRACK }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#EEF1F6' }} />
                <div className="grow-x" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: okW, borderRadius: '8px 0 0 8px', background: 'var(--navy)', '--d': `${0.4 + i * 0.15}s` }} />
                <div className="grow-x overflow" style={{ position: 'absolute', left: okW, top: 0, bottom: 0, width: overW, borderRadius: '0 8px 8px 0', '--d': `${1.0 + i * 0.15}s` }} />
                <div style={{ position: 'absolute', left: okW, top: -8, bottom: -8, borderLeft: '3px dashed var(--navy)' }} />
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)', marginLeft: (1 / RHO_MAX) * TRACK - 40 }}>ρ = 1 · capacity</div>
      </div>
      <div style={{ position: 'absolute', left: 36, right: 36, bottom: 32, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
        <div className="big-num" style={{ fontSize: 72, color: 'var(--red)' }}>
          ≈ <CountUp to={81} delay={900} />
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, marginTop: 6 }}>manual handovers per peak · all 3 boxes overflow</div>
      </div>
    </ModelCard>

    <ModelCard x={680} delay="0.3s" title="Riders" model="M/M/1 per block" sub="Time stuck at reception takes riders out of service.">
      <div style={{ marginTop: 30 }}>
        <div className="card-label">Orders per rider-hour</div>
        <div style={{ position: 'relative', height: 44, marginTop: 12, width: TRACK + 60, borderRadius: 10, background: '#EEF1F6' }}>
          <div className="shrink-cap" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', borderRadius: 10, background: 'var(--blue)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, fontSize: 26, fontWeight: 800, color: 'var(--navy)' }}>
          14.4 <ArrowRight size={24} color="var(--red)" /> <span style={{ color: 'var(--red)' }}>8.6</span>
          <span className="chip red">−40%</span>
        </div>
      </div>
      <div style={{ marginTop: 34 }}>
        <div className="card-label">Riders needed at the peak</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, width: 470 }}>
          {Array.from({ length: 11 }, (_, i) => {
            const have = i < 7;
            return (
              <span key={i} className={have ? '' : 'missing'} style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: have ? 'var(--navy)' : 'transparent', border: have ? 'none' : '2.5px dashed var(--red)', color: have ? '#FFFFFF' : 'var(--red)', '--d': `${(i - 7) * 0.3}s` }}>
                <Bike size={28} />
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 36, right: 36, bottom: 32, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
        <div className="big-num" style={{ fontSize: 72 }}>
          <span style={{ color: 'var(--red)' }}>
            <CountUp to={11.1} decimals={1} delay={900} />
          </span>{' '}
          <span style={{ fontSize: 40, color: 'var(--muted)' }}>vs 7</span>
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, marginTop: 6 }}>riders&apos; worth of capacity needed vs available</div>
      </div>
    </ModelCard>

    <ModelCard x={1250} delay="0.45s" title="Uneven demand" model="1 rider / block" sub="Share of estimated orders by hostel block.">
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 13 }}>
        {BLOCKS.map((b, i) => (
          <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 104, fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{b.name}</span>
            <div style={{ flex: 1, height: 24, position: 'relative' }}>
              <div className="grow-x" style={{ height: '100%', width: `${Math.max(1.5, (b.share / 36.8) * 100)}%`, borderRadius: 6, background: b.hot ? 'var(--red)' : '#9DB8EE', '--d': `${0.5 + i * 0.1}s` }} />
            </div>
            <span style={{ width: 66, textAlign: 'right', fontSize: 18, fontWeight: 800 }}>{b.share}%</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 15, fontWeight: 700, color: 'var(--muted)' }}>
              <Bike size={16} /> 1
            </span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 36, right: 36, bottom: 32, paddingTop: 22, borderTop: '1px solid var(--border)' }}>
        <div className="big-num" style={{ fontSize: 72, color: 'var(--red)' }}>
          ≈ <CountUp to={84} delay={900} suffix="%" />
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, marginTop: 6 }}>of orders from HB4 + HB1 — yet one rider each</div>
      </div>
    </ModelCard>
  </>
);

// ── 6. Solution + plan ─────────────────────────────────────────────────
const PHASES = [
  { name: 'Notify', when: 'Weeks 1–2', what: 'Add the two new notifications' },
  { name: 'Pilot', when: 'Weeks 3–4', what: 'Late-pickup charge at HB4-Boys' },
  { name: 'Scale', when: 'Month 2', what: 'Extend the charge to all blocks' },
  { name: 'Pool', when: 'Month 3', what: '10 PM – 2 AM flexible rider pool' },
];

const SolutionCard = ({ x, letter, title, fixes, change, delay, children }) => (
  <div className="card build" style={{ left: x, top: 228, width: 560, height: 440, padding: '26px 32px', '--d': delay }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--navy)', color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, flexShrink: 0 }}>{letter}</span>
      <div style={{ fontSize: 25, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2 }}>{title}</div>
    </div>
    <div style={{ height: 196, marginTop: 16, position: 'relative' }}>{children}</div>
    <div style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>
      <span style={{ color: 'var(--green)' }}>Fixes:</span> {fixes}
    </div>
    <span className="chip blue" style={{ marginTop: 14 }}>
      {change}
    </span>
  </div>
);

const NOTIFS = [
  { text: 'Order accepted', fresh: false },
  { text: 'Your order has been prepared', fresh: true },
  { text: 'Your order is out for delivery', fresh: true },
  { text: 'Placed in smart box', fresh: false },
];
const TIERS = [
  { label: 'Under 15 min', fee: 'Free', color: 'var(--green)', bg: 'var(--green-soft)' },
  { label: '15–30 min', fee: '₹10', color: '#B07A12', bg: 'var(--amber-soft)' },
  { label: 'After 30 min', fee: '₹20', color: 'var(--red)', bg: 'var(--red-soft)' },
];

const SolutionSlide = () => (
  <>
    <Head eyebrow="Solution & Implementation" title="Our Solution and Implementation Plan" />
    <SolutionCard x={110} delay="0.15s" letter="A" title="Two extra status notifications" fixes="students come down on time" change="Pickup 40 → 30 min">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {NOTIFS.map((n, i) => (
          <div
            key={n.text}
            className={n.fresh ? 'notif' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px', borderRadius: 12, background: n.fresh ? 'var(--blue-soft)' : '#F3F5F9', border: n.fresh ? '1.5px solid var(--blue)' : '1px solid var(--border)', fontSize: 17, fontWeight: 700, color: 'var(--navy)', opacity: n.fresh ? undefined : 1, '--d': `${i * 0.6}s` }}
          >
            <Bell size={17} color={n.fresh ? 'var(--blue)' : 'var(--faint)'} />
            {n.text}
            {n.fresh ? <span className="chip blue" style={{ marginLeft: 'auto', padding: '2px 10px', fontSize: 13, background: 'var(--blue)', color: '#FFFFFF' }}>NEW</span> : null}
          </div>
        ))}
      </div>
    </SolutionCard>
    <SolutionCard x={680} delay="0.3s" letter="B" title="Late-pickup charge on the next order" fixes="students collect quickly" change="Pickup 30 → 15 min">
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        {TIERS.map((t) => (
          <div key={t.label} style={{ flex: 1, padding: '16px 12px', borderRadius: 16, background: t.bg, textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.fee}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginTop: 6 }}>{t.label}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 8, marginTop: 22, background: 'linear-gradient(90deg, var(--green) 0 33%, var(--amber) 33% 66%, var(--red) 66% 100%)' }}>
        <span className="road-marker" style={{ position: 'absolute', top: -9, width: 26, height: 26, marginLeft: -13, borderRadius: '50%', background: '#FFFFFF', border: '4px solid var(--navy)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: 'var(--muted)', marginTop: 16 }}>
        <IndianRupee size={16} /> Timer starts at the &quot;placed in smart box&quot; alert
      </div>
    </SolutionCard>
    <SolutionCard x={1250} delay="0.45s" letter="C" title="Flexible peak-hour rider allocation" fixes="capacity goes where demand is" change="6 × M/M/1 → 1 × M/M/7">
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {['HB4-B', 'HB4-G', 'HB1', 'HB3', 'HB2', 'HB5'].map((b, i) => (
            <span key={b} className="pool-dot" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: 'var(--muted)', '--d': `${i * 0.2}s`, '--tx': '14px', '--ty': `${(2.5 - i) * 4}px` }}>
              <Package size={16} color={i < 3 ? 'var(--red)' : '#9DB8EE'} /> {b}
            </span>
          ))}
        </div>
        <ArrowRight size={30} color="var(--navy)" className="arrow-flow" />
        <div style={{ flex: 1, padding: 16, borderRadius: 18, background: 'var(--green-soft)', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)', letterSpacing: '0.06em' }}>ONE SHARED QUEUE</div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="pool-dot" style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--navy)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', '--d': `${i * 0.25}s`, '--ty': '-6px' }}>
                <Bike size={20} />
              </span>
            ))}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 10 }}>Next free rider takes the next batch</div>
        </div>
      </div>
    </SolutionCard>
    <div className="card build" style={{ left: 110, top: 690, width: 1600, height: 172, padding: '22px 60px', '--d': '0.6s' }}>
      <div className="card-label">Implementation roadmap</div>
      <div style={{ position: 'relative', marginTop: 26, marginLeft: 150, marginRight: 150 }}>
        <div style={{ height: 6, borderRadius: 6, background: '#EEF1F6' }} />
        <div className="road-fill" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 6, borderRadius: 6, background: 'var(--blue)' }} />
        <span className="road-marker" style={{ position: 'absolute', top: -14, marginLeft: -17, color: 'var(--blue)' }}>
          <Bike size={34} />
        </span>
        {PHASES.map((p, i) => (
          <div key={p.name} style={{ position: 'absolute', left: `${(i / (PHASES.length - 1)) * 100}%`, top: -9, transform: 'translateX(-50%)', width: 300, textAlign: 'center' }}>
            <span style={{ display: 'block', width: 24, height: 24, margin: '0 auto', borderRadius: '50%', background: '#FFFFFF', border: '5px solid var(--navy)' }} />
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 10 }}>
              {i + 1}. {p.name} <span style={{ fontSize: 17, color: 'var(--blue)' }}>· {p.when}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>{p.what}</div>
          </div>
        ))}
      </div>
    </div>
  </>
);

// ── 7. Before vs after ─────────────────────────────────────────────────
const ROWS = [
  { measure: 'Smart-box utilisation', before: '1.08–1.55 (overflow)', after: '0.40–0.58' },
  { measure: 'Manual handovers per night', before: '≈ 81', after: '0' },
  { measure: 'Riders needed at the peak', before: '11.1', after: '6.6' },
  { measure: 'Food ready → smart box', before: 'Queue grows all peak', after: '≈ 12.8 min' },
];
const KPIS = [
  { label: 'Delivered within 45–50 min', now: 8.3, target: 70, show: ['8.3%', '≥ 70%'] },
  { label: 'Average satisfaction', now: 45, target: 70, show: ['2.25', '≥ 3.5 / 5'] },
  { label: 'Food arriving hot', now: 9.7, target: 50, show: ['9.7%', '≥ 50%'] },
];

const ImpactSlide = () => (
  <>
    <Head eyebrow="The Impact" title="Before vs After" />
    <div className="card build" style={{ left: 110, top: 232, width: 1110, height: 468, padding: '22px 40px', '--d': '0.15s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 60px 1fr', alignItems: 'center', padding: '10px 0 16px', borderBottom: '2px solid var(--border)' }}>
        <span className="card-label">Measure (peak)</span>
        <span className="card-label" style={{ color: 'var(--red)' }}>Before</span>
        <span />
        <span className="card-label" style={{ color: 'var(--green)' }}>After A + B + C</span>
      </div>
      {ROWS.map((r, i) => (
        <div key={r.measure} className="build" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 60px 1fr', alignItems: 'center', padding: '22px 0', borderBottom: i < ROWS.length - 1 ? '1px solid var(--border)' : 'none', '--d': `${0.35 + i * 0.15}s` }}>
          <span style={{ fontSize: 25, fontWeight: 800, color: 'var(--navy)' }}>{r.measure}</span>
          <span className="chip red" style={{ fontSize: 22, justifySelf: 'start' }}>{r.before}</span>
          <ArrowRight size={30} color="var(--navy)" className="arrow-flow" />
          <span className="chip green" style={{ fontSize: 24, justifySelf: 'start' }}>{r.after}</span>
        </div>
      ))}
    </div>
    <div className="build" style={{ position: 'absolute', left: 110, top: 728, width: 1110, display: 'flex', gap: 14, '--d': '1s' }}>
      {[
        { t: 'No new hires', i: <Users size={22} /> },
        { t: 'Near-zero cost', i: <IndianRupee size={22} /> },
        { t: 'All three solutions together', i: <CircleCheck size={22} /> },
      ].map((p) => (
        <span key={p.t} className="chip navy" style={{ fontSize: 22, padding: '14px 24px' }}>
          {p.i} {p.t}
        </span>
      ))}
    </div>
    <div className="build" style={{ position: 'absolute', left: 110, top: 806, fontSize: 18, fontWeight: 600, color: 'var(--muted)', '--d': '1.1s' }}>
      Pooling alone fails (ρ = 1.58); A + B alone leave the busiest blocks overloaded. Pickup targets to be verified in a pilot.
    </div>
    <div className="card build" style={{ left: 1260, top: 232, width: 550, height: 468, padding: '30px 36px', '--d': '0.3s' }}>
      <div className="card-label">KPI targets</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 24 }}>
        {KPIS.map((k, i) => (
          <div key={k.label}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>{k.label}</div>
            <div style={{ position: 'relative', height: 20, marginTop: 14, borderRadius: 10, background: '#EEF1F6' }}>
              <div className="kpi-fill" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${k.target}%`, borderRadius: 10, background: 'var(--green)', '--from': k.now / k.target, '--d': `${0.6 + i * 0.2}s` }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${k.now}%`, borderRadius: 10, background: 'var(--red)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 20, fontWeight: 800 }}>
              <span style={{ color: 'var(--red)' }}>Now {k.show[0]}</span>
              <span style={{ color: 'var(--green)' }}>Target {k.show[1]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export const SLIDES = [
  { id: 'title', Component: TitleSlide, origin: '80% 40%' }, // zooms into the clock on the way out
  { id: 'problem', Component: ProblemSlide },
  { id: 'process', Component: ProcessSlide, origin: '50% 45%' },
  { id: 'root-cause', Component: RootCauseSlide, origin: '50% 85%' },
  { id: 'models', Component: ModelsSlide },
  { id: 'solution', Component: SolutionSlide },
  { id: 'impact', Component: ImpactSlide },
];
