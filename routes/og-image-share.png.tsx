/**
 * Dynamic OG Image Generator
 *
 * Generates OpenGraph preview images for social sharing
 * Returns SVG converted to PNG-like response
 */

import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req) {
    // Generate SVG with brand colors
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:oklch(0.95 0.02 30);stop-opacity:1" />
      <stop offset="50%" style="stop-color:oklch(0.96 0.015 50);stop-opacity:1" />
      <stop offset="100%" style="stop-color:oklch(0.94 0.025 80);stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#grad)"/>

  <!-- Decorative circles -->
  <circle cx="100" cy="100" r="150" fill="oklch(0.85 0.08 30)" opacity="0.3"/>
  <circle cx="1100" cy="530" r="120" fill="oklch(0.82 0.12 50)" opacity="0.3"/>

  <!-- Main content -->
  <text x="600" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="800" fill="oklch(0.35 0.03 30)" text-anchor="middle" letter-spacing="-0.02em">
    Conversation Mapper
  </text>

  <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="600" fill="oklch(0.55 0.05 40)" text-anchor="middle">
    Turn talk into action
  </text>

  <text x="600" y="370" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="oklch(0.6 0.04 35)" text-anchor="middle" opacity="0.9">
    Record, transcribe, and map messy conversations
  </text>

  <text x="600" y="410" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="oklch(0.6 0.04 35)" text-anchor="middle" opacity="0.9">
    into clean topics and action items
  </text>

  <!-- Icon elements -->
  <g transform="translate(400, 480)">
    <rect x="0" y="0" width="60" height="60" rx="12" fill="oklch(0.75 0.1 40)" opacity="0.8"/>
    <text x="30" y="42" font-size="32" text-anchor="middle">🎙️</text>
  </g>

  <g transform="translate(490, 480)">
    <rect x="0" y="0" width="60" height="60" rx="12" fill="oklch(0.75 0.1 45)" opacity="0.8"/>
    <text x="30" y="42" font-size="32" text-anchor="middle">🧠</text>
  </g>

  <g transform="translate(580, 480)">
    <rect x="0" y="0" width="60" height="60" rx="12" fill="oklch(0.75 0.1 50)" opacity="0.8"/>
    <text x="30" y="42" font-size="32" text-anchor="middle">✅</text>
  </g>

  <g transform="translate(670, 480)">
    <rect x="0" y="0" width="60" height="60" rx="12" fill="oklch(0.75 0.1 55)" opacity="0.8"/>
    <text x="30" y="42" font-size="32" text-anchor="middle">🗺️</text>
  </g>
</svg>`;

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  },
};
