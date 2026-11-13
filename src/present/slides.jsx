// The WellNest deck's slides (1920x1080 stage). Light, minimal, always moving; few words.
import React from 'react';
import {
  BellRing,
  CalendarClock,
  Heart,
  Scale,
  ThumbsUp,
  Briefcase,
  EyeOff,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Play,
  RefreshCw,
  Search,
  Send,
  Target,
  TrendingUp,
  User,
  Users,
  Activity,
  Pause,
} from 'lucide-react';

const BIRD = '/brand/wellnest-bird.svg';
const WORDMARK = '/brand/wellnest-wordmark.svg';
const BIRD_RATIO = 409 / 420;
const WORDMARK_RATIO = 1314 / 306;

const TAGLINE = 'Every Voice Safely Heard.';

// ── Shared pieces ──────────────────────────────────────────────────────
const Ambient = () => (
  <div className="ambient">
    <div className="blob b1" />
    <div className="blob b2" />
    <div className="blob b3" />
  </div>
);

const MESSAGES = [
  'My workload is too high',
  "I don't feel heard",
  'Too many meetings',
  'The office is too loud',
  'Can we talk about burnout?',
  'I have an idea to share',
  'Priorities keep changing',
  'I need more support',
];

/** Anonymous messages drifting upward behind the content (the video's message wall). */
const Bubbles = ({ count = 8, opacity = 0.5, lanes }) => {
  // Lanes hug the left and right edges and sway outward, so bubbles never drift behind the centred content
  const xs = lanes ?? [30, 1510, 70, 1550, 20, 1490, 90, 1530];
  return (
    <div className="bubbles">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            left: xs[i % xs.length],
            // One speed for all, evenly staggered, so bubbles in the same lane never overlap
            animationDuration: '32s',
            animationDelay: `${-i * (32 / count)}s`,
            '--o': opacity,
            '--sway': `${(xs[i % xs.length] > 960 ? 1 : -1) * (30 + (i % 3) * 20)}px`,
            transform: `scale(${0.85 + (i % 3) * 0.1})`,
          }}
        >
          <span className="avatar">
            <User size={16} />
          </span>
          <span>
            <b>Anonymous</b> {MESSAGES[i % MESSAGES.length]}
          </span>
        </div>
      ))}
    </div>
  );
};

/** Floating bird with breathing glow and ripple rings, centred on (cx, cy). */
const FloatingBird = ({ cx, cy, size }) => {
  const h = size * BIRD_RATIO;
  return (
    <>
      <div className="glow-disc" style={{ left: cx - size * 1.2, top: cy - size * 1.2, width: size * 2.4, height: size * 2.4 }} />
      <div className="ripples" style={{ left: cx - size * 0.75, top: cy - size * 0.75, width: size * 1.5, height: size * 1.5 }}>
        <span />
        <span />
        <span />
      </div>
      <img className="logo-float" src={BIRD} alt="" style={{ position: 'absolute', left: cx - size / 2, top: cy - h / 2, width: size, height: h }} />
    </>
  );
};

const Wordmark = ({ height, style }) => <img src={WORDMARK} alt="WellNest" style={{ height, width: height * WORDMARK_RATIO, ...style }} />;

const center = { position: 'absolute', left: 0, right: 0, textAlign: 'center' };

// ── 1. Intro ───────────────────────────────────────────────────────────
const IntroSlide = () => (
  <>
    <Ambient />
    <Bubbles opacity={0.45} />
    <FloatingBird cx={960} cy={300} size={290} />
    <div className="build" style={{ ...center, top: 488, '--d': '0.35s' }}>
      <Wordmark height={138} />
    </div>
    <div className="build subtitle" style={{ ...center, top: 680, fontSize: 36, '--d': '0.65s' }}>
      Anonymous AI Workplace Wellness and Feedback Analysis
    </div>
    <div className="build" style={{ ...center, top: 760, fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--forest)', '--d': '0.9s' }}>
      {TAGLINE}
    </div>
    <div className="build" style={{ ...center, top: 940, '--d': '1.2s' }}>
      <span className="eyebrow" style={{ fontSize: 20 }}>
        <i /> Presented by Working Group A7
      </span>
    </div>
  </>
);

// ── 2. Video ───────────────────────────────────────────────────────────
const VideoSlide = ({ video }) => {
  const showCover = !video.started;
  const paused = video.started && !video.playing && !video.ended;
  return (
    <div className="video-slide" style={{ position: 'absolute', inset: 0 }}>
      <video
        ref={video.ref}
        src="/media/wellnest-demo.mp4"
        preload="auto"
        playsInline
        onPlay={video.onPlay}
        onPause={video.onPause}
        onEnded={video.onEnded}
      />
      <div className={`video-cover ${showCover ? '' : 'gone'}`} style={{ background: 'var(--canvas)' }}>
        <Ambient />
        <Bubbles opacity={0.4} />
        <FloatingBird cx={960} cy={360} size={240} />
        <div className="build title" style={{ ...center, top: 560, fontSize: 112, '--d': '0.3s' }}>
          WellNest in <span className="pill">Action</span>
        </div>
        <div className="build" style={{ ...center, top: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, fontSize: 24, fontWeight: 600, color: 'var(--muted)', '--d': '0.7s' }}>
          Press <span className="keycap">SPACE</span> to play
        </div>
      </div>
      {paused ? (
        <div className="paused-badge">
          <Pause size={18} /> Paused · Space to resume
        </div>
      ) : null}
      {video.ended ? (
        <div className="paused-badge">
          <Play size={18} /> Space for next slide
        </div>
      ) : null}
    </div>
  );
};

// ── 3. The problem and its relevance ───────────────────────────────
const NODE = { x: 960, y: 600 };
// Unspoken concerns: [right edge x, centre y, text] — they float, then flow into WellNest
const PROBLEMS = [
  [650, 350, "I'm burning out"],
  [560, 445, 'Afraid to speak up'],
  [700, 540, "My manager doesn't listen"],
  [590, 635, 'Too much on my plate'],
  [680, 730, 'Conflict in my team'],
  [570, 825, 'No idea what matters most'],
];
const DASH = { x: 1320, y: 430, w: 460, h: 340 };
const BARS = [
  [0.35, 0.8],
  [0.5, 0.95],
  [0.3, 0.65],
  [0.55, 1],
  [0.4, 0.85],
  [0.6, 0.9],
];

const RelevanceSlide = () => {
  // Paths in stage coordinates: concerns → WellNest → insights
  const inPaths = PROBLEMS.map(([x, y]) => `M ${x + 14} ${y} C ${x + 180} ${y}, ${NODE.x - 240} ${NODE.y}, ${NODE.x} ${NODE.y}`);
  const outPath = `M ${NODE.x} ${NODE.y} C ${NODE.x + 160} ${NODE.y}, ${DASH.x - 120} ${DASH.y + 170}, ${DASH.x + 20} ${DASH.y + 170}`;
  return (
    <>
      <Ambient />
      <div className="build title" style={{ position: 'absolute', left: 140, top: 100, fontSize: 92, '--d': '0.1s' }}>
        The Problem and Its Relevance
      </div>

      {/* Flow lines + travelling dots */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, '--d': '0.5s' }} className="build">
        {inPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(61,102,82,0.12)" strokeWidth={2} strokeDasharray="6 10" />
        ))}
        <path d={outPath} fill="none" stroke="rgba(31,174,116,0.3)" strokeWidth={3} strokeDasharray="6 10" />
      </svg>
      {inPaths.map((d, i) =>
        [0, 1].map((k) => (
          <span key={`${i}-${k}`} className="flow-dot" style={{ offsetPath: `path('${d}')`, background: '#B9C7C0', animationDuration: '3.6s', animationDelay: `${-(i * 0.6 + k * 1.8)}s` }} />
        )),
      )}
      {[0, 1, 2, 3, 4].map((k) => (
        <span key={k} className="flow-dot" style={{ offsetPath: `path('${outPath}')`, background: 'var(--mint-deep)', boxShadow: '0 0 14px rgba(98,227,168,0.9)', animationDuration: '2.4s', animationDelay: `${-k * 0.48}s` }} />
      ))}

      {/* Unspoken concerns, floating */}
      {PROBLEMS.map(([x, y, text], i) => (
        <div key={text} className="build-pop" style={{ position: 'absolute', left: x, top: y, '--d': `${0.3 + i * 0.1}s` }}>
          {/* Anchored by its right edge so the flow line starts at the bubble */}
          <div style={{ position: 'absolute', right: 0, top: 0, transform: 'translateY(-50%)' }}>
            <div className="problem-bubble" style={{ animationDelay: `${-i * 1.3}s`, animationDuration: `${6 + (i % 3)}s` }}>
              <span className="problem-dot" />
              {text}
            </div>
          </div>
        </div>
      ))}
      <div className="build" style={{ position: 'absolute', left: 170, top: 900, width: 500, textAlign: 'center', fontSize: 30, fontWeight: 700, color: 'var(--muted)', '--d': '0.9s' }}>
        Unspoken concerns
      </div>

      {/* WellNest node */}
      <div className="build-pop" style={{ position: 'absolute', left: NODE.x - 135, top: NODE.y - 135, width: 270, height: 270, '--d': '0.45s' }}>
        <div className="ripples" style={{ inset: -30 }}>
          <span />
          <span />
          <span />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#FFFFFF', boxShadow: 'var(--shadow-float)' }} />
        <div className="node-ring" />
        <img className="logo-float" src={BIRD} alt="" style={{ position: 'absolute', left: 55, top: 58, width: 160 }} />
      </div>

      {/* Live insights */}
      <div className="build-pop" style={{ position: 'absolute', left: DASH.x, top: DASH.y, width: DASH.w, height: DASH.h, borderRadius: 32, background: '#FFFFFF', boxShadow: 'var(--shadow-float)', padding: '30px 34px', '--d': '0.6s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 700, color: 'var(--emerald)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <Activity size={22} /> Live insights
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, marginTop: 34 }}>
          {BARS.map(([from, to], i) => (
            <div
              key={i}
              className="bar"
              style={{
                height: '100%',
                background: i === BARS.length - 1 ? 'linear-gradient(180deg, #3ED994, #1FAE74)' : 'rgba(61,102,82,0.22)',
                '--from': from,
                '--to': to,
                animationDuration: `${1.8 + (i % 3) * 0.5}s`,
                animationDelay: `${-i * 0.4}s`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="build" style={{ position: 'absolute', left: DASH.x, top: 820, width: DASH.w, textAlign: 'center', fontSize: 30, fontWeight: 700, color: 'var(--forest)', '--d': '0.85s' }}>
        Clear signals
      </div>
    </>
  );
};

// ── 4. Workplace benefits ──────────────────────────────────────────────
const LOOP = { x: 960, y: 690, r: 190 };
const LOOP_NODES = [
  { label: 'Share', icon: <Send size={34} />, dx: 0, dy: -1 },
  { label: 'Analyze', icon: <Search size={34} />, dx: 1, dy: 0 },
  { label: 'Review', icon: <RefreshCw size={34} />, dx: 0, dy: 1 },
  { label: 'Respond', icon: <HeartHandshake size={34} />, dx: -1, dy: 0 },
];

const BenefitCard = ({ x, title, icon, rows, delay }) => (
  <div className="benefit-card build" style={{ left: x, '--d': delay }}>
    <div className="head">
      <span className="ic">{icon}</span>
      {title}
    </div>
    {rows.map((r, i) => (
      <div key={r.text} className="benefit-row">
        <span className="ic" style={{ '--d': `${i * 2}s` }}>
          {r.icon}
        </span>
        {r.text}
      </div>
    ))}
  </div>
);

const BenefitsSlide = () => (
  <>
    <Ambient />
    <div className="build" style={{ position: 'absolute', left: 140, top: 100, '--d': '0.1s' }}>
      <div className="title">The Workplace Benefits</div>
      <div className="subtitle" style={{ marginTop: 18 }}>
        A feedback system that closes the loop.
      </div>
    </div>

    <BenefitCard
      x={120}
      delay="0.3s"
      title="For HR & Managers"
      icon={<Briefcase size={34} />}
      rows={[
        { icon: <LayoutDashboard size={28} />, text: 'One clear view' },
        { icon: <TrendingUp size={28} />, text: 'Live mood trends' },
        { icon: <BellRing size={28} />, text: 'Early warning signs' },
        { icon: <Target size={28} />, text: 'Evidence-based action' },
      ]}
    />

    {/* The loop */}
    <div className="build-pop" style={{ position: 'absolute', left: LOOP.x - LOOP.r, top: LOOP.y - LOOP.r, width: LOOP.r * 2, height: LOOP.r * 2, '--d': '0.6s' }}>
      <svg width={LOOP.r * 2} height={LOOP.r * 2} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <circle cx={LOOP.r} cy={LOOP.r} r={LOOP.r} fill="none" stroke="rgba(61,102,82,0.22)" strokeWidth={3} strokeDasharray="4 12" />
      </svg>
      <div className="loop-orbit">
        <i />
      </div>
      <img className="logo-float" src={BIRD} alt="" style={{ position: 'absolute', left: LOOP.r - 70, top: LOOP.r - 68, width: 140 }} />
    </div>
    {LOOP_NODES.map((n, i) => (
      // The anchor centres the node on its point; the pop-in runs on the inner element so its transform can't undo that
      <div key={n.label} className="loop-node" style={{ left: LOOP.x + n.dx * LOOP.r, top: LOOP.y + n.dy * LOOP.r + (n.dy === 0 ? 18 : n.dy * 6) }}>
        <div className="build-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, '--d': `${0.7 + i * 0.1}s` }}>
          {/* Lights up as the orbiting dot passes (9 s loop, a quarter turn apart) */}
          <span className="ic" style={{ '--d': `${i * 2.25 - 0.35}s` }}>
            {n.icon}
          </span>
          {n.label}
        </div>
      </div>
    ))}

    <BenefitCard
      x={1240}
      delay="0.9s"
      title="For Employees"
      icon={<Users size={34} />}
      rows={[
        { icon: <Lock size={28} />, text: 'Speak up safely' },
        { icon: <EyeOff size={28} />, text: 'Stay anonymous' },
        { icon: <MessageCircle size={28} />, text: 'Feel heard' },
        { icon: <RefreshCw size={28} />, text: 'See real change' },
      ]}
    />
  </>
);

// ── 5. Theories behind the design ──────────────────────────────────
const CHAIN = [
  { label: 'Work events', icon: <CalendarClock size={40} />, x: 100 },
  { label: 'Feelings', icon: <Heart size={40} />, x: 352 },
  { label: 'Attitudes', icon: <ThumbsUp size={40} />, x: 604 },
];

const TheoryCard = ({ x, delay, icon, name, source, children, line }) => (
  <div className="theory-card build" style={{ left: x, '--d': delay }}>
    <div className="head">
      <span className="ic">{icon}</span>
      <div>
        <div className="name">{name}</div>
        <div className="source">{source}</div>
      </div>
    </div>
    <div className="theory-visual">{children}</div>
    <div className="theory-line">{line}</div>
  </div>
);

const TheoriesSlide = () => (
  <>
    <Ambient />
    <div className="build" style={{ position: 'absolute', left: 140, top: 100, '--d': '0.1s' }}>
      <div className="title">The Theories Behind the Design</div>
      <div className="subtitle" style={{ marginTop: 18 }}>
        Grounded in organisational behaviour.
      </div>
    </div>

    <TheoryCard
      x={120}
      delay="0.3s"
      icon={<Heart size={34} />}
      name="Affective Events Theory"
      source="Weiss & Cropanzano, 1996"
      line={
        <>
          Daily check-ins capture the <b>moments that shape</b> how people feel and act.
        </>
      }
    >
      {/* Work events → feelings → attitudes, with dots flowing along the chain */}
      {[0, 1].map((seg) =>
        [0, 1, 2].map((k) => (
          <span
            key={seg + '-' + k}
            className="flow-dot"
            style={{
              offsetPath: "path('M " + (CHAIN[seg].x + 62) + ' 110 L ' + (CHAIN[seg + 1].x - 62) + " 110')",
              background: 'var(--mint-deep)',
              animationDuration: '1.8s',
              animationDelay: -(k * 0.6 + seg * 0.3) + 's',
            }}
          />
        )),
      )}
      {CHAIN.map((n, i) => (
        <div key={n.label} className="chain-node" style={{ left: n.x }}>
          <span className="ic" style={{ animationDelay: i * 2 + 's' }}>
            {n.icon}
          </span>
          {n.label}
        </div>
      ))}
    </TheoryCard>

    <TheoryCard
      x={1000}
      delay="0.6s"
      icon={<Scale size={34} />}
      name="Equity Theory"
      source="Adams, 1963"
      line={
        <>
          Every voice is <b>heard equally</b>, and every concern gets a <b>visible response</b>.
        </>
      }
    >
      {/* A balance that tips, then settles level: voice weighed fairly against response */}
      <div className="balance">
        <div className="post" />
        <div className="base" />
        <div className="beam">
          {[
            { side: 'left', label: 'Voice', icon: <MessageCircle size={26} /> },
            { side: 'right', label: 'Response', icon: <HeartHandshake size={26} /> },
          ].map((p) => (
            <div key={p.side} className={'pan ' + p.side}>
              <div className="string" />
              <div className="dish">
                {p.icon}
                {p.label}
              </div>
            </div>
          ))}
        </div>
        <div className="justice-chip">Interactional justice</div>
      </div>
    </TheoryCard>
  </>
);

// ── 6. Thank you ───────────────────────────────────────────────────────
const ThanksSlide = () => (
  <>
    <Ambient />
    <Bubbles opacity={0.45} />
    <FloatingBird cx={960} cy={290} size={300} />
    <div className="build title" style={{ ...center, top: 500, fontSize: 150, '--d': '0.3s' }}>
      Thank You
    </div>
    <div className="build" style={{ ...center, top: 700, fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--sage)', '--d': '0.6s' }}>
      {TAGLINE}
    </div>
    <div className="build" style={{ ...center, top: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, '--d': '0.9s' }}>
      <Wordmark height={70} />
      <span className="eyebrow" style={{ fontSize: 18 }}>
        <i /> Working Group A7
      </span>
    </div>
  </>
);

export const SLIDES = [
  { id: 'intro', Component: IntroSlide, origin: '50% 28%' }, // zooms into the bird on the way to the video
  { id: 'video', Component: VideoSlide },
  { id: 'relevance', Component: RelevanceSlide, origin: '50% 56%' },
  { id: 'benefits', Component: BenefitsSlide, origin: '50% 64%' },
  { id: 'theories', Component: TheoriesSlide, origin: '50% 60%' },
  { id: 'thanks', Component: ThanksSlide, origin: '50% 27%' },
];
