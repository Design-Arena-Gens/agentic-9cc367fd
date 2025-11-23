"use client";
import React from "react";

export function AvatarWoman({ mouthOpen }: { mouthOpen: number }) {
  const clamped = Math.max(0, Math.min(1, mouthOpen));
  // Scale mouth height between 2 and 16 px
  const mouthHeight = 2 + clamped * 14;
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" aria-label="Virtuelle Moderatorin">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="400" fill="url(#bg)" />
      {/* Shoulders */}
      <ellipse cx="200" cy="320" rx="140" ry="70" fill="#0ea5e9" />
      {/* Neck */}
      <rect x="175" y="240" width="50" height="40" rx="10" fill="#f2c7a5" />
      {/* Head */}
      <circle cx="200" cy="190" r="90" fill="#f7d3b6" />
      {/* Hair */}
      <path d="M110,170 C120,80 280,80 290,170 C300,270 100,270 110,170 Z" fill="#1f2937" />
      {/* Eyes */}
      <circle cx="170" cy="185" r="8" fill="#111827" />
      <circle cx="230" cy="185" r="8" fill="#111827" />
      {/* Brows */}
      <rect x="155" y="165" width="30" height="4" rx="2" fill="#111827" />
      <rect x="215" y="165" width="30" height="4" rx="2" fill="#111827" />
      {/* Nose */}
      <path d="M200 185 C195 205 205 205 200 220" stroke="#f0bfa0" strokeWidth="4" fill="none" />
      {/* Mouth */}
      <rect x="180" y={230 - mouthHeight/2} width="40" height={mouthHeight} rx="8" fill="#b91c1c" />
      {/* Blush */}
      <circle cx="150" cy="215" r="10" fill="#fecaca" opacity="0.7" />
      <circle cx="250" cy="215" r="10" fill="#fecaca" opacity="0.7" />
      {/* Shirt collar */}
      <path d="M170,280 L200,250 L230,280" stroke="#ffffff" strokeWidth="10" fill="none" />
      {/* Title badge */}
      <g>
        <rect x="115" y="305" width="170" height="28" rx="14" fill="#ffffff" stroke="#bae6fd" />
        <text x="200" y="324" textAnchor="middle" fontSize="14" fill="#0369a1" fontWeight="700">Ihre Moderatorin</text>
      </g>
    </svg>
  );
}
