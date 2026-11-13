// Delivery rider on a scooter (with a ChangePay box) and the hostel he delivers to.
import React from 'react';

const Wheel = ({ cx, cy }) => (
  <g>
    <circle cx={cx} cy={cy} r={17} fill="#232B3D" />
    <g className="wheel">
      <circle cx={cx} cy={cy} r={9.5} fill="#C9D2E2" />
      {[0, 60, 120].map((a) => (
        <line
          key={a}
          x1={cx - 9 * Math.cos((a * Math.PI) / 180)}
          y1={cy - 9 * Math.sin((a * Math.PI) / 180)}
          x2={cx + 9 * Math.cos((a * Math.PI) / 180)}
          y2={cy + 9 * Math.sin((a * Math.PI) / 180)}
          stroke="#7C879C"
          strokeWidth={2}
        />
      ))}
      <circle cx={cx} cy={cy} r={3} fill="#4A556B" />
    </g>
  </g>
);

export const Scooter = () => (
  <svg width={190} height={121} viewBox="0 0 190 121" style={{ overflow: 'visible' }}>
    {/* Speed lines + exhaust */}
    <g>
      {[42, 58, 74].map((y, i) => (
        <line key={y} className="speed" x1={-24} y1={y} x2={0} y2={y} stroke="#AEB8CB" strokeWidth={3} strokeLinecap="round" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
      {['p1', 'p2', 'p3'].map((p) => (
        <circle key={p} className={`puff ${p}`} cx={18} cy={100} r={5} fill="#C3CAD8" />
      ))}
    </g>
    <g className="bob">
      {/* Delivery box */}
      <rect x={6} y={24} width={58} height={48} rx={7} fill="#EE8A32" />
      <rect x={6} y={24} width={58} height={10} rx={5} fill="#D9741F" />
      <text x={35} y={62} textAnchor="middle" fontFamily="Manrope, Arial" fontWeight={800} fontSize={18} fill="#FFFFFF">
        CP
      </text>
      {/* Scooter body */}
      <path d="M22 93 C22 81 33 75 48 75 L106 75 C113 75 117 80 122 86 L134 86 L141 50 L150 50 L146 84 C157 86 166 92 170 101 L133 101 C129 93 121 89 111 89 L64 89 C58 96 50 101 40 101 C30 101 22 99 22 93 Z" fill="#2F6FDE" />
      <path d="M48 75 L106 75 C112 75 115 78 118 82 L52 82 Z" fill="#5A8CEA" />
      {/* Fork, handlebar, headlight */}
      <line x1={146} y1={52} x2={151} y2={100} stroke="#1B2A4E" strokeWidth={5} strokeLinecap="round" />
      <line x1={134} y1={42} x2={154} y2={40} stroke="#1B2A4E" strokeWidth={5} strokeLinecap="round" />
      <circle cx={157} cy={56} r={5} fill="#F2B33D" />
      {/* Seat */}
      <rect x={58} y={66} width={44} height={10} rx={5} fill="#1B2A4E" />
      {/* Rider */}
      <path d="M84 66 L100 66 L122 86 L114 92 Z" fill="#2B3752" />
      <rect x={110} y={86} width={16} height={7} rx={3} fill="#232B3D" />
      <path d="M78 68 L96 68 L112 36 L96 30 Z" fill="#1B2A4E" />
      <line x1={106} y1={38} x2={138} y2={43} stroke="#24365F" strokeWidth={8} strokeLinecap="round" />
      <circle cx={106} cy={20} r={13} fill="#F2B33D" />
      <path d="M108 13 C116 13 120 18 119 24 L108 24 Z" fill="#1B2A4E" />
    </g>
    <Wheel cx={40} cy={101} />
    <Wheel cx={150} cy={101} />
  </svg>
);

/** Hostel with a smart box; when `delivered`, a parcel drops into a slot and a badge appears. */
export const Hostel = ({ delivered }) => (
  <svg width={150} height={170} viewBox="0 0 150 170" style={{ overflow: 'visible' }}>
    {/* Building */}
    <rect x={40} y={38} width={110} height={132} rx={6} fill="#FFFFFF" stroke="#C9D2E2" strokeWidth={2} />
    <rect x={34} y={30} width={122} height={14} rx={4} fill="#1B2A4E" />
    <text x={95} y={41} textAnchor="middle" fontFamily="Manrope, Arial" fontWeight={800} fontSize={10} fill="#F2B33D" letterSpacing={1.5}>
      HOSTEL
    </text>
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r}-${c}`} x={52 + c * 32} y={54 + r * 26} width={22} height={16} rx={3} fill={(r + c) % 2 ? '#FDF4DF' : '#F2D58A'} />
      )),
    )}
    <rect x={84} y={136} width={22} height={34} rx={3} fill="#C9D2E2" />
    {/* Smart box */}
    <rect x={0} y={110} width={38} height={60} rx={5} fill="#2F6FDE" />
    {[0, 1, 2].map((r) =>
      [0, 1].map((c) => <rect key={`s${r}${c}`} x={4 + c * 16} y={114 + r * 18} width={14} height={15} rx={2} fill="#E7EEFC" />),
    )}
    {delivered ? (
      <g>
        <rect className="parcel-drop" x={4} y={114} width={14} height={15} rx={2} fill="#EE8A32" />
        <g className="delivered" style={{ transformOrigin: '19px 92px' }}>
          <rect x={-22} y={80} width={86} height={24} rx={12} fill="#1C9C6B" />
          <text x={21} y={96} textAnchor="middle" fontFamily="Manrope, Arial" fontWeight={800} fontSize={11} fill="#FFFFFF">
            ✓ Delivered
          </text>
        </g>
      </g>
    ) : null}
  </svg>
);
