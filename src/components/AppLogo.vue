<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: [Number, String],
    default: 36
  }
});

const numSize = computed(() => Number(props.size) || 36);
// Proportional emblem badge width (1.24x height) so 1+1=3 renders with crisp, spacious balance
const badgeWidth = computed(() => Math.round(numSize.value * 1.24));
const badgeHeight = computed(() => numSize.value);
</script>

<template>
  <svg
    :width="badgeWidth"
    :height="badgeHeight"
    viewBox="0 0 56 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="app-logo-svg"
    role="img"
    aria-label="1+1=3 Logo"
  >
    <defs>
      <!-- Deep space glassmorphism badge background -->
      <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0e1728" />
        <stop offset="60%" stop-color="#090e1a" />
        <stop offset="100%" stop-color="#05070f" />
      </linearGradient>

      <!-- Radiant neon cyberpunk border -->
      <linearGradient id="logoBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="40%" stop-color="#818cf8" />
        <stop offset="75%" stop-color="#c084fc" />
        <stop offset="100%" stop-color="#f43f5e" />
      </linearGradient>

      <!-- Digits gradients -->
      <linearGradient id="logoCyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="40%" stop-color="#7dd3fc" />
        <stop offset="100%" stop-color="#0284c7" />
      </linearGradient>

      <linearGradient id="logoPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="30%" stop-color="#f472b6" />
        <stop offset="80%" stop-color="#ec4899" />
        <stop offset="100%" stop-color="#e11d48" />
      </linearGradient>

      <!-- Soft glow filters -->
      <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      <radialGradient id="ambientAura" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
        <stop offset="60%" stop-color="#818cf8" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
      </radialGradient>

      <linearGradient id="topReflect" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Outer drop shadow / ambient glow -->
    <rect x="2" y="2" width="52" height="40" rx="12" fill="url(#logoBgGrad)" />
    <rect x="2" y="2" width="52" height="40" rx="12" fill="url(#ambientAura)" />

    <!-- Top glass reflection curve -->
    <path
      d="M 5 14 C 14 6, 42 6, 51 14 L 51 16 C 38 10, 18 10, 5 16 Z"
      fill="url(#topReflect)"
    />

    <!-- Glowing perimeter frame -->
    <rect
      x="2"
      y="2"
      width="52"
      height="40"
      rx="12"
      stroke="url(#logoBorderGrad)"
      stroke-width="1.8"
      stroke-linejoin="round"
    />

    <!-- 1+1=3 Equation Text Element with vibrant gradient styling -->
    <g filter="url(#logoGlow)">
      <text
        x="27"
        y="24.5"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif"
        font-weight="900"
        font-size="14.5"
        letter-spacing="0.2"
      >
        <tspan fill="url(#logoCyanGrad)">1</tspan>
        <tspan fill="#818cf8" font-size="12" font-weight="800"> + </tspan>
        <tspan fill="url(#logoCyanGrad)">1</tspan>
        <tspan fill="#c084fc" font-size="12" font-weight="800"> = </tspan>
        <tspan fill="url(#logoPinkGrad)" font-size="16" font-weight="900">3</tspan>
      </text>
    </g>

    <!-- Synergy Sparkle Accent at top corner -->
    <path
      d="M 45 6.5 L 46 9 L 48.5 10 L 46 11 L 45 13.5 L 44 11 L 41.5 10 L 44 9 Z"
      fill="#67e8f9"
      opacity="0.9"
    />
    <circle cx="45" cy="10" r="0.9" fill="#ffffff" />
  </svg>
</template>

<style scoped>
.app-logo-svg {
  display: block;
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
  cursor: pointer;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
}
.app-logo-svg:hover {
  transform: translateY(-1px) scale(1.06);
  filter: drop-shadow(0 0 14px rgba(56, 189, 248, 0.55));
}
</style>
