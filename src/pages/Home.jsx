
import React from 'react';

export default function Home() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `<main id="content">
  <!-- BEGIN: HeroSection (Exact Glassmorphic Visual Match to ignisia.tech Reference Screenshot) -->
  <section class="relative pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden text-center bg-transparent" id="hero">
    <img class="poster-hero-art poster-hero-sparkle" src="/assets/hero-poster-sparkle.png" width="349" height="349" alt="" aria-hidden="true" />
    <img class="poster-hero-art poster-hero-star" src="/assets/competition-star.png" width="673" height="762" alt="" aria-hidden="true" />

    
    <!-- Hero background: poster-style capsules and network nodes -->
    <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
      <svg class="hpa hpa-tl" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><defs>
          <radialGradient id="hpa-orb-violet" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f3f3ff"/><stop offset="0.55" stop-color="#c9c8ff"/><stop offset="0.86" stop-color="#8e82f6"/><stop offset="1" stop-color="#6d5ae8"/></radialGradient>
          <radialGradient id="hpa-orb-teal" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f1fbff"/><stop offset="0.55" stop-color="#c3ecfb"/><stop offset="0.86" stop-color="#8fc6f7"/><stop offset="1" stop-color="#7390ef"/></radialGradient>
          <radialGradient id="hpa-orb-blue" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f1f2ff"/><stop offset="0.5" stop-color="#c3c7ff"/><stop offset="0.84" stop-color="#7a74f2"/><stop offset="1" stop-color="#5146e0"/></radialGradient>
          <radialGradient id="hpa-orb-haze" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#eeeefe" stop-opacity="0"/><stop offset="0.8" stop-color="#e3e3fd" stop-opacity="0.55"/><stop offset="1" stop-color="#d6d6fb" stop-opacity="0.8"/></radialGradient>
          <linearGradient id="hpa-cap-violet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#dcdcff"/><stop offset="0.72" stop-color="#9a8ff7"/><stop offset="1" stop-color="#6e5ef0"/></linearGradient>
          <linearGradient id="hpa-cap-pink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#eadcff"/><stop offset="0.72" stop-color="#b393f7"/><stop offset="1" stop-color="#7f5cf0"/></linearGradient>
          <linearGradient id="hpa-cap-cyan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="0.35" stop-color="#d4ecff"/><stop offset="0.72" stop-color="#86baf8"/><stop offset="1" stop-color="#5d78ee"/></linearGradient>
          <filter id="hpa-edge" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>
          <filter id="hpa-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
        </defs><g class="hpa-orb"><circle cx="-30" cy="-30" r="250" fill="url(#hpa-orb-violet)" filter="url(#hpa-edge)"/><circle cx="-30" cy="-30" r="247" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.45"/></g><circle cx="-30" cy="-30" r="330" fill="none" stroke="#dedffb" stroke-width="1.2"/><g class="hpa-bob hpa-bob-1"><g transform="rotate(145 10 340)"><rect x="-105.0" y="331.2" width="230" height="40" rx="20.0" fill="#6a5cf0" opacity="0.16" filter="url(#hpa-soft)"/><rect x="-105.0" y="320.0" width="230" height="40" rx="20.0" fill="url(#hpa-cap-violet)" filter="url(#hpa-edge)"/><rect x="-87.0" y="326.4" width="194.0" height="8.8" rx="4.4" fill="#ffffff" opacity="0.7"/></g></g></svg>
      <svg class="hpa hpa-tr" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><circle cx="430" cy="230" r="190" fill="url(#hpa-orb-haze)"/><g class="hpa-lines" stroke="#c9ccf6" stroke-width="1.4" fill="none"><path d="M150 250 L235 175"/><path d="M235 175 L320 235"/><path d="M320 235 L385 120"/><path d="M235 175 L290 70"/><path d="M320 235 L230 330"/></g><g class="hpa-dots" fill="#b8b4f4"><circle cx="150" cy="250" r="6"/><circle cx="235" cy="175" r="9"/><circle cx="320" cy="235" r="7"/><circle cx="385" cy="120" r="6"/><circle cx="290" cy="70" r="5"/><circle cx="230" cy="330" r="5"/></g></svg>
      <svg class="hpa hpa-bl" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><g class="hpa-orb"><circle cx="-30" cy="440" r="220" fill="url(#hpa-orb-teal)" filter="url(#hpa-edge)"/><circle cx="-30" cy="440" r="217" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.45"/></g><g class="hpa-lines" stroke="#c9ccf6" stroke-width="1.4" fill="none"><path d="M40 170 L120 235"/><path d="M120 235 L70 320"/><path d="M120 235 L210 300"/><path d="M120 235 L190 190"/></g><g class="hpa-dots" fill="#b8b4f4"><circle cx="40" cy="170" r="6"/><circle cx="120" cy="235" r="9"/><circle cx="70" cy="320" r="6"/><circle cx="210" cy="300" r="7"/><circle cx="190" cy="190" r="5"/></g><g class="hpa-bob hpa-bob-2"><g transform="rotate(145 40 40)"><rect x="-90.0" y="30.32" width="260" height="44" rx="22.0" fill="#6a5cf0" opacity="0.16" filter="url(#hpa-soft)"/><rect x="-90.0" y="18.0" width="260" height="44" rx="22.0" fill="url(#hpa-cap-pink)" filter="url(#hpa-edge)"/><rect x="-70.2" y="25.04" width="220.4" height="9.68" rx="4.84" fill="#ffffff" opacity="0.7"/></g></g></svg>
      <svg class="hpa hpa-br" viewBox="0 0 400 400" aria-hidden="true" focusable="false"><g class="hpa-orb"><circle cx="470" cy="470" r="190" fill="url(#hpa-orb-blue)" filter="url(#hpa-edge)"/><circle cx="470" cy="470" r="187" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.45"/></g><circle cx="470" cy="470" r="280" fill="none" stroke="#dedffb" stroke-width="1.2"/><g class="hpa-bob hpa-bob-3"><g transform="rotate(-35 360 110)"><rect x="250.0" y="101.64" width="220" height="38" rx="19.0" fill="#6a5cf0" opacity="0.16" filter="url(#hpa-soft)"/><rect x="250.0" y="91.0" width="220" height="38" rx="19.0" fill="url(#hpa-cap-cyan)" filter="url(#hpa-edge)"/><rect x="267.1" y="97.08" width="185.8" height="8.36" rx="4.18" fill="#ffffff" opacity="0.7"/></g></g></svg>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="hero-layout-wrapper">
        
        <!-- Left / Center Main Content: Uncongested & Spacious -->
        <div class="hero-content-col">
          
          <!-- Wordmark: INCUBEX / 2026 in poster styling, "by Ignisia" in the ignisia.tech serif -->
          <h1 class="hero-wordmark select-none" aria-label="INCUBEX by Ignisia 2026">
            <span class="poster-wordmark">INCUBE<span>X</span></span>
          </h1>

          <p class="hero-vision-line">
            <span class="hero-vision-phrase">From Vision To</span>
            <span class="hero-venture-word">Venture</span>
          </p>

          <p class="hero-launchpad-line"><span>National-Level Tech Launchpad</span> by <span class="poster-ignisia">Ignisia</span></p>

          <div class="hero-cta-stack">
            <button type="button" onclick="openRegisterModal(); playSound('click');" class="hero-register-big">
              <span>Register Now</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>

            <div class="hero-secondary-actions">
              <a href="#arena" onclick="playSound('hover');" class="hero-secondary-link">
                <iconify-icon icon="ph:rocket-launch-duotone" width="18" height="18" aria-hidden="true"></iconify-icon>
                <span>Explore Tracks</span>
              </a>
              <button type="button" onclick="openPosterModal(); playSound('click');" class="hero-secondary-link">
                <iconify-icon icon="ph:download-simple-bold" width="17" height="17" aria-hidden="true"></iconify-icon>
                <span>View Brochure</span>
              </button>
            </div>
          </div>

        </div>
        <!-- END: hero-content-col -->

        <!-- Social links anchored opposite the countdown -->
        <nav class="hero-social-dock" aria-label="Ignisia social links">
          <a
            class="hero-social-link hero-social-instagram"
            href="https://www.instagram.com/ignisiamit?igsh=cm5hamdoYXVsODR1&amp;utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram: @ignisiamit"
            title="Instagram: @ignisiamit"
          >
            <iconify-icon icon="mdi:instagram" width="25" height="25"></iconify-icon>
          </a>
          <a
            class="hero-social-link hero-social-x"
            href="https://x.com/ignisiamit?s=11"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter): @ignisiamit"
            title="X (Twitter): @ignisiamit"
          >
            <iconify-icon icon="simple-icons:x" width="21" height="21"></iconify-icon>
          </a>
          <a
            class="hero-social-link hero-social-linkedin"
            href="https://www.linkedin.com/company/ignisia-26/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn: @ignisia"
            title="LinkedIn: @ignisia"
          >
            <iconify-icon icon="mdi:linkedin" width="26" height="26"></iconify-icon>
          </a>
        </nav>

        <!-- 8. Countdown strictly to the right: NO CARD, ONLY TEXT -->
        <div class="w-full flex justify-end mt-6 pr-2 sm:pr-6 lg:absolute lg:right-0 lg:bottom-1 lg:mt-0 lg:w-auto z-20" id="hero-countdown-block">
          <div class="flex flex-col items-end text-right">
            <!-- Explicit Heading: "Countdown" -->
            <div class="mb-1 text-[11px] sm:text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
              <span>Countdown</span>
            </div>

            <!-- Pure Text Monospace Countdown Timer (No enclosing card or border) -->
            <div class="grid auto-cols-max grid-flow-col gap-3 sm:gap-4 text-center" id="countdown-timer">
              <div class="flex flex-col items-center">
                <span class="countdown font-mono text-indigo-700">
                  <span id="days" style="--value:23;" aria-live="polite" aria-label="23">23</span>
                </span>
                <span class="countdown-unit">days</span>
              </div>
              <div class="flex flex-col items-center">
                <span class="countdown font-mono text-indigo-700">
                  <span id="hours" style="--value:14;" aria-live="polite" aria-label="14">14</span>
                </span>
                <span class="countdown-unit">hours</span>
              </div>
              <div class="flex flex-col items-center">
                <span class="countdown font-mono text-indigo-700">
                  <span id="minutes" style="--value:45;" aria-live="polite" aria-label="45">45</span>
                </span>
                <span class="countdown-unit">min</span>
              </div>
              <div class="flex flex-col items-center">
                <span class="countdown font-mono text-indigo-700">
                  <span id="seconds" style="--value:24;" aria-live="polite" aria-label="24">24</span>
                </span>
                <span class="countdown-unit">sec</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <!-- END: HeroSection -->

  <div class="site-sections">
  <!-- BEGIN: Event details (date + venue) -->
  <section class="event-info-section reveal" id="event-info" aria-label="Event date and venue">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="event-info-grid">
        <div class="event-info-card">
          <span class="event-info-date" aria-hidden="true">
            <span class="event-info-day">21</span>
            <span class="event-info-month">Oct<br>2026</span>
          </span>
          <span class="event-info-copy">
            <span class="event-info-label">Grand Finale</span>
            <span class="event-info-value">21 October 2026</span>
            <span class="event-info-sub">9:00 AM – 6:00 PM IST</span>
          </span>
        </div>
        <div class="event-info-card">
          <span class="event-info-icon" aria-hidden="true">
            <iconify-icon icon="ph:map-pin-area-duotone" width="26" height="26"></iconify-icon>
          </span>
          <span class="event-info-copy">
            <span class="event-info-label">Venue</span>
            <span class="event-info-value">MIT-WPU, Pune</span>
            <span class="event-info-sub">Kothrud, Pune, Maharashtra</span>
          </span>
        </div>
      </div>
      <p class="event-info-eligibility">National-level &nbsp;•&nbsp; Diploma, UG &amp; PG students &nbsp;•&nbsp; Across India</p>
    </div>
  </section>
  <!-- END: Event details -->

  <!-- BEGIN: HighlightPosterPillars (Infinite Auto-scrolling Carousel of 6 Perks) -->
  <section class="w-full py-8 md:py-12 relative z-20 overflow-hidden reveal" id="benefits">
    <!-- Prominent Bold Heading with generous vertical spacing -->
    <div class="text-center max-w-4xl mx-auto mb-12 md:mb-16 px-4">
      <span class="ix-kicker">Why take part</span>
      <h2 class="ix-title">Honours &amp; <em>Perks</em></h2>
    </div>

    <!-- Infinite Auto-Scrolling Carousel (Left to Right) -->
    <div class="perks-carousel-wrapper" aria-label="Summit Honours &amp; Institutional Perks Carousel">
      <div class="perks-carousel-track">
        <!-- Set 1 -->
        <!-- Card 1: Cash Prizes -->
        <div class="perks-card group">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:trophy-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">₹50,000 Prize Pool</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Plus consolation prize vouchers and credits</p>
        </div>

        <!-- Card 2: Incubation Support -->
        <div class="perks-card group">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:plant-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Incubation Support</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">MIT-WPU Innovation</p>
        </div>

        <!-- Card 3: Investor Pitch -->
        <div class="perks-card group">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:chart-line-up-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Investor Pitch</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Angel &amp; VC Panel</p>
        </div>

        <!-- Card 4: Trophies -->
        <div class="perks-card group">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:medal-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Trophies</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Category Laurels</p>
        </div>

        <!-- Card 5: Certificates -->
        <div class="perks-card group">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:certificate-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Certificates</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">All Participants</p>
        </div>

        <!-- Card 6: Mentorship -->
        <div class="perks-card group">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:users-three-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Mentorship</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Industry Leaders</p>
        </div>

        <!-- Set 2 (Duplicated for seamless infinite loop) -->
        <!-- Card 1: Cash Prizes -->
        <div class="perks-card group" aria-hidden="true">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:trophy-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">₹50,000 Prize Pool</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Plus consolation prize vouchers and credits</p>
        </div>

        <!-- Card 2: Incubation Support -->
        <div class="perks-card group" aria-hidden="true">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:plant-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Incubation Support</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">MIT-WPU Innovation</p>
        </div>

        <!-- Card 3: Investor Pitch -->
        <div class="perks-card group" aria-hidden="true">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:chart-line-up-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Investor Pitch</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Angel &amp; VC Panel</p>
        </div>

        <!-- Card 4: Trophies -->
        <div class="perks-card group" aria-hidden="true">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:medal-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Trophies</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Category Laurels</p>
        </div>

        <!-- Card 5: Certificates -->
        <div class="perks-card group" aria-hidden="true">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:certificate-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Certificates</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">All Participants</p>
        </div>

        <!-- Card 6: Mentorship -->
        <div class="perks-card group" aria-hidden="true">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <iconify-icon icon="ph:users-three-duotone" width="26" height="26"></iconify-icon>
          </div>
          <h3 class="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">Mentorship</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Industry Leaders</p>
        </div>
      </div>
    </div>
  </section>
  <!-- END: HighlightPosterPillars -->

  <!-- ======================================================== -->
  <!-- UNIQUE FEATURE 1: INTERACTIVE COMPETITION ARENA MATRIX   -->
  <!-- ======================================================== -->
  <section class="py-16 md:py-24 relative reveal" id="arena">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-3xl mx-auto mb-10">
        <span class="ix-kicker">Two ways to compete</span>
        <h2 class="ix-title">Competition <em>Tracks</em></h2>
        <p class="text-base text-slate-600 mt-3">
          Two tracks, each with its own expectations for build maturity and presentation format.
        </p>
      </div>


      <!-- Arena Dynamic Card Presentation (Interactive Side-by-Side Faceoff) -->
      <div class="competition-track-grid grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <img src="/assets/competition-star.png" class="track-poster-accent track-poster-star" width="673" height="762" alt="" aria-hidden="true" loading="lazy" />

        <!-- Track 1: Product Track (Rocket) -->
        <div id="card-product" class="tilt-card glass-panel rounded-3xl border-2 border-indigo-200/90 p-8 shadow-card hover:shadow-hover relative flex flex-col justify-between group overflow-hidden transition-all duration-300">
          <div class="absolute -top-16 -right-16 w-48 h-48 bg-indigo-100/60 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none"></div>

          <div class="relative z-10">
            <!-- Glass Window Control Dots & Category Tag -->
            <div class="flex items-center justify-between pb-3.5 mb-5 border-b border-indigo-100/70">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50/90 px-2.5 py-0.5 rounded-full border border-indigo-200/60">TRACK 01</span>
            </div>

            <div class="flex items-center space-x-4 mb-5">

              <div class="track-heading">
                <h3 class="track-heading-title">
                  Product <span>Track</span>
                </h3>
                <p class="mt-2 text-sm font-semibold text-slate-600">Working products you can demo</p>
              </div>
            </div>

            <!-- Quote badge from poster -->
            <div class="bg-indigo-50/90 rounded-2xl p-4 border border-indigo-200/80 mb-6">
              <p class="text-xs sm:text-sm font-bold text-indigo-950 italic">
                "For projects and products ready to transition into real-world ventures."
              </p>
            </div>

            <!-- 3 Core Themes from PDF -->
            <div class="mb-6 space-y-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-600 block">3 Strategic Themes:</span>
              <div class="grid grid-cols-1 gap-2 text-xs font-semibold">
                <div class="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <span class="text-indigo-600 font-bold">1.</span>
                  <span><strong>Digital &amp; Software Ventures:</strong> SaaS, FinTech, EdTech, mobile apps, digital platforms.</span>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <span class="text-indigo-600 font-bold">2.</span>
                  <span><strong>Smart Systems &amp; Hardware:</strong> Robotics, IoT systems, consumer electronics, physical devices.</span>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <span class="text-indigo-600 font-bold">3.</span>
                  <span><strong>Open Innovation:</strong> Unconventional business models, novel services, cross-domain products.</span>
                </div>
              </div>
            </div>

            <!-- Specifications List -->
            <ul class="space-y-3 text-xs sm:text-sm text-slate-800 font-semibold mb-8">
              <li class="flex items-start space-x-3">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
                <span class="text-slate-800"><strong class="text-slate-900 font-black">Team Size:</strong> 1 – 6 members per team (Solo participation allowed).</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
                <span class="text-slate-800"><strong class="text-slate-900 font-black">Maturity:</strong> Technology Readiness Level (TRL) 5–7 (operational venture or working product ready for practical demonstration).</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
                <span class="text-slate-800"><strong class="text-slate-900 font-black">Format:</strong> Live online qualifier pitch &amp; on-campus closed-door pitch/walkthrough to investors/jury.</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onclick="openRegisterModal(); playSound('click');"
            class="btn-shimmer w-full py-4 text-center rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 relative z-10 cursor-pointer"
          >
            Apply For Product Track →
          </button>
        </div>

        <!-- Track 2: Prototype Expo Track (Lightbulb/Nodes) -->
        <div id="card-prototype" class="tilt-card glass-panel rounded-3xl border-2 border-cyan-200/90 p-8 shadow-card hover:shadow-hover relative flex flex-col justify-between group overflow-hidden transition-all duration-300">
          <img src="/assets/competition-trophy.png" class="track-poster-accent track-poster-trophy" width="651" height="815" alt="" aria-hidden="true" loading="lazy" />
          <div class="absolute -top-16 -right-16 w-48 h-48 bg-cyan-100/60 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none"></div>

          <div class="relative z-10">
            <!-- Glass Window Control Dots & Category Tag -->
            <div class="flex items-center justify-between pb-3.5 mb-5 border-b border-cyan-100/70">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              </div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50/90 px-2.5 py-0.5 rounded-full border border-cyan-200/60">TRACK 02</span>
            </div>

            <div class="flex items-center space-x-4 mb-5">

              <div class="track-heading">
                <h3 class="track-heading-title">
                  Prototype <span>Expo Track</span>
                </h3>
                <p class="mt-2 text-sm font-semibold text-slate-600">Research and lab builds</p>
              </div>
            </div>

            <!-- Quote badge from poster -->
            <div class="bg-cyan-50/90 rounded-2xl p-4 border border-cyan-200/80 mb-6">
              <p class="text-xs sm:text-sm font-bold text-cyan-950 italic">
                "For academic projects, research builds, and early-stage functional models."
              </p>
            </div>

            <!-- Core Focus from PDF -->
            <div class="mb-6 space-y-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-600 block">3 Core Focus Areas:</span>
              <div class="grid grid-cols-1 gap-2 text-xs font-semibold">
                <div class="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <span class="text-cyan-600 font-bold">1.</span>
                  <span><strong>Academic Builds &amp; Capstones:</strong> Engineering prototypes, research models, capstone builds, and proof-of-concept implementations.</span>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <span class="text-cyan-600 font-bold">2.</span>
                  <span><strong>DeepTech &amp; Hardware Systems:</strong> Robotics, IoT, embedded devices, AgriTech, and healthcare innovations.</span>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2">
                  <span class="text-cyan-600 font-bold">3.</span>
                  <span><strong>Open Software &amp; Social Impact:</strong> High-potential software builds, AI for Bharat, social impact tech, and novel cross-domain projects.</span>
                </div>
              </div>
            </div>

            <!-- Specifications List -->
            <ul class="space-y-3 text-xs sm:text-sm text-slate-800 font-semibold mb-8">
              <li class="flex items-start space-x-3">
                <span class="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
                <span class="text-slate-800"><strong class="text-slate-900 font-black">Team Size:</strong> 3 – 6 members per team (Solo participation is strictly NOT allowed).</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
                <span class="text-slate-800"><strong class="text-slate-900 font-black">Maturity:</strong> Functional working prototype required with TRL level 1-4 (Hardware build or software model mandatory; purely theoretical concepts are not eligible).</span>
              </li>
              <li class="flex items-start space-x-3">
                <span class="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
                <span class="text-slate-800"><strong class="text-slate-900 font-black">Format:</strong> Full-day live public exhibition booth at MIT-WPU campus &amp; walk-around jury evaluation.</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onclick="openRegisterModal(); playSound('click');"
            class="btn-shimmer w-full py-4 text-center rounded-2xl bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 relative z-10 cursor-pointer"
          >
            Apply For Prototype Expo Track →
          </button>
        </div>
      </div>
    </div>
  </section>

  

  <!-- ======================================================== -->
  <!-- INNOVATION DOMAINS WITH SEARCH & FILTER                  -->
  <!-- ======================================================== -->
  <section class="py-16 md:py-24 relative reveal" id="categories">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="domains-heading-wrap">
        <div class="domains-orbit" aria-hidden="true">
          <span class="domains-number">14</span>
        </div>
        <div class="domains-heading-copy">
        <span class="ix-kicker">Where to build</span>
        <h2 class="domains-heading-title ix-title" aria-label="14 Innovation Domains">Innovation <em>Domains</em></h2>
        <p class="text-base text-slate-600 mt-3">
          Select or search any tech vertical to see how your project aligns with INCUBEX 2026.
        </p>
        </div>
      </div>


      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8" id="domains-container">
        
        <!-- Category Group 1: Software & Digital Innovation -->
        <div class="domain-group domain-group-software bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-3xl border border-blue-100 shadow-card">
          <div class="domain-group-header flex items-center space-x-3.5 mb-6 pb-4 border-b border-blue-100">
            <div class="domain-group-icon w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shadow-xs">
              &lt;/&gt;
            </div>
            <div>
              <h3 class="text-xl font-extrabold text-slate-900">Software &amp; Digital Innovation</h3>
              <p class="text-xs text-blue-700 font-bold">Algorithms, Platforms &amp; Cloud Solutions</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 domain-grid">
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">AI for Bharat</span>
              <span class="text-[11px] text-slate-500">Local languages, Indic models, accessibility</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Healthcare &amp; Accessibility</span>
              <span class="text-[11px] text-slate-500">Diagnostics, assistive tools, patient ops</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Education &amp; Learning Systems</span>
              <span class="text-[11px] text-slate-500">Adaptive tutoring, skill assessment, VR labs</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Climate, Energy &amp; Sustainability</span>
              <span class="text-[11px] text-slate-500">Carbon accounting, smart grid telemetry</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">AgriTech &amp; Food Tech</span>
              <span class="text-[11px] text-slate-500">Yield modeling, rural livelihoods, supply chain</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">FinTech &amp; GovTech</span>
              <span class="text-[11px] text-slate-500">UPI/OCEN innovations, public rails</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Peace, Ethics &amp; Social Impact</span>
              <span class="text-[11px] text-slate-500">Civil safety, conflict mitigation tech</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-blue-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Open Software Innovation</span>
              <span class="text-[11px] text-slate-500">Developer tools, security &amp; Web3 infra</span>
            </div>
          </div>
        </div>

        <!-- Category Group 2: Hardware & Physical Engineering -->
        <div class="domain-group domain-group-hardware bg-gradient-to-br from-white to-cyan-50/50 p-8 rounded-3xl border border-cyan-100 shadow-card">
          <div class="domain-group-header flex items-center space-x-3.5 mb-6 pb-4 border-b border-cyan-100">
            <div class="domain-group-icon w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-lg shadow-xs">
              ⚙
            </div>
            <div>
              <h3 class="text-xl font-extrabold text-slate-900">Hardware &amp; Physical Engineering</h3>
              <p class="text-xs text-cyan-700 font-bold">Circuits, Robotics &amp; Embedded Builds</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 domain-grid">
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-cyan-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Robotics &amp; Drones</span>
              <span class="text-[11px] text-slate-500">Autonomous rovers, aerial platforms, AGVs</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-cyan-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Embedded Systems &amp; IoT</span>
              <span class="text-[11px] text-slate-500">Edge telemetry, smart sensors, micro-controllers</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-cyan-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Manufacturing &amp; Industry 4.0</span>
              <span class="text-[11px] text-slate-500">Additive manufacturing, digital twins, CNC</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-cyan-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">DeepTech &amp; Materials</span>
              <span class="text-[11px] text-slate-500">Optics, biomaterials, quantum devices</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-cyan-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Clean Mobility &amp; EV Tech</span>
              <span class="text-[11px] text-slate-500">BMS, powertrain optimization, smart charging</span>
            </div>
            <div class="domain-card p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-cyan-300 transition-all">
              <span class="text-xs font-bold text-slate-900 block">Open Hardware Innovation</span>
              <span class="text-[11px] text-slate-500">Novel mechanical &amp; electronic builds</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ======================================================== -->
  <!-- 8-STEP LAUNCHPAD MISSION TIMELINE (IGNISIA VERTICAL STYLE) -->
  <!-- ======================================================== -->
  <section class="py-16 md:py-24 relative reveal" id="mission-map">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Section Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="ix-kicker">Key dates</span>
        <h2 class="ix-title">Event <em>Timeline</em></h2>
        <p class="text-base text-slate-600 mt-3">
          Key dates from registration to the Grand Finale at MIT-WPU Pune.
        </p>

        <!-- Quick Timeline Action Filters -->
        <div class="flex items-center justify-center mt-6">
          <button
            id="timeline-toggle"
            onclick="toggleTimelineDetails(); playSound('click');"
            class="px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            aria-expanded="false"
          >
            <svg id="timeline-toggle-icon" class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
            <span id="timeline-toggle-label">Expand All Details</span>
          </button>
        </div>
      </div>

      <!-- Vertical Continuous Timeline (Matching ignisia.tech Reference Design) -->
      <div class="relative">
        
        <!-- Continuous Vertical Spine Line -->
        <div class="hidden md:block absolute left-72 top-6 bottom-6 w-0.5" id="timeline-spine" aria-hidden="true">
          <div id="timeline-progress"></div>
        </div>

        <!-- 8 Timeline Milestones -->
        <div class="space-y-12 sm:space-y-16">

          <!-- Step 1: 7 Oct 2026 -->
          <div class="relative flex flex-col md:flex-row items-start group timeline-item" id="step-node-1">
            <!-- Left Date Column -->
            <div class="w-full md:w-72 md:shrink-0 md:pr-8 text-left md:text-right pb-3 md:pb-0">
              <time datetime="2026-10-07" class="font-serif italic text-2xl sm:text-3xl text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
                7 Oct 2026
              </time>
              <span class="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold block mt-1">
                Step 01 • Registration
              </span>
            </div>

            <!-- Center Node Marker -->
            <div class="hidden md:flex absolute left-72 -translate-x-1/2 items-center justify-center z-10">
              <div class="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:border-blue-500 transition-transform">
                <div class="w-3 h-3 rounded-full bg-indigo-600"></div>
              </div>
            </div>

            <!-- Right Content Card -->
            <div class="w-full md:flex-1 md:min-w-0 md:pl-12">
              <div class="bg-white/90 backdrop-blur-sm border border-indigo-100/90 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-card hover:border-indigo-300 transition-all">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    Registration &amp; Outreach
                  </span>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                  Team Enrolment on Unstop
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed font-normal mb-4">
                  Register your team: 1–6 members for Product Track or 3–6 members for Prototype Expo Track. Registration is ₹300 per team and free for MIT-WPU Pune students.
                </p>
                <div id="step-expanded-1" class="hidden mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span class="block font-bold text-slate-700 mb-1">Required Deliverable:</span>
                    <span class="text-slate-600">Provide college ID credentials and select track &amp; category.</span>
                  </div>
                  <div class="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                    <span class="block font-bold text-indigo-900 mb-1">Immediate Milestone:</span>
                    <span class="text-indigo-800">Unlocks download access to the official 10-slide INCUBEX blueprint template.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: 9 - 10 Oct 2026 -->
          <div class="relative flex flex-col md:flex-row items-start group timeline-item" id="step-node-4">
            <div class="w-full md:w-72 md:shrink-0 md:pr-8 text-left md:text-right pb-3 md:pb-0">
              <time datetime="2026-10-09" data-end-date="2026-10-10" class="font-serif italic text-2xl sm:text-3xl text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
                9 – 10 Oct 2026
              </time>
              <span class="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold block mt-1">
                Step 02 • Qualifier Round
              </span>
            </div>

            <div class="hidden md:flex absolute left-72 -translate-x-1/2 items-center justify-center z-10">
              <div class="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:border-blue-500 transition-transform">
                <div class="w-3 h-3 rounded-full bg-indigo-600"></div>
              </div>
            </div>

            <div class="w-full md:flex-1 md:min-w-0 md:pl-12">
              <div class="bg-white/90 backdrop-blur-sm border border-indigo-100/90 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-card hover:border-indigo-300 transition-all">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
                    Qualifier Round
                  </span>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                  Online Qualifier Round
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed font-normal mb-4">
                  Registered teams present online to screening panels of faculty and industry experts. The round is fully online, so teams across India can take part without travelling.
                </p>
                <div id="step-expanded-4" class="hidden mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span class="block font-bold text-slate-700 mb-1">Defense Timing:</span>
                    <span class="text-slate-600">7-minute pitch presentation + 5-minute technical Q&amp;A defense before panels.</span>
                  </div>
                  <div class="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
                    <span class="block font-bold text-amber-900 mb-1">Jury Rubric:</span>
                    <span class="text-amber-800">Scored across Problem Need (25%), Tech Feasibility (25%), Novelty (25%), and Market Impact (25%).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="relative flex flex-col md:flex-row items-start group timeline-item" id="step-node-5">
            <div class="w-full md:w-72 md:shrink-0 md:pr-8 text-left md:text-right pb-3 md:pb-0">
              <time datetime="2026-10-12" class="font-serif italic text-2xl sm:text-3xl text-slate-900 font-bold">12 Oct 2026</time>
              <span class="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold block mt-1">Round 1 Results</span>
            </div>
            <div class="hidden md:flex absolute left-72 -translate-x-1/2 items-center justify-center z-10">
              <div class="w-8 h-8 rounded-full border-2 border-indigo-600 flex items-center justify-center"><div class="w-3 h-3 rounded-full bg-indigo-600"></div></div>
            </div>
            <div class="w-full md:flex-1 md:min-w-0 md:pl-12">
              <div class="rounded-2xl p-6 sm:p-7 border border-indigo-200">
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">Round 1 Results</h3>
                <p class="text-sm text-slate-700 leading-relaxed">Round 1 results will be announced on 12 October 2026.</p>
              </div>
            </div>
          </div>

          <!-- Step 6: 15 – 16 Oct 2026 -->
          <div class="relative flex flex-col md:flex-row items-start group timeline-item" id="step-node-6">
            <div class="w-full md:w-72 md:shrink-0 md:pr-8 text-left md:text-right pb-3 md:pb-0">
              <time datetime="2026-10-15" data-end-date="2026-10-16" class="font-serif italic text-2xl sm:text-3xl text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
                15 – 16 Oct 2026
              </time>
              <span class="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold block mt-1">
                Step 03 • Mentorship
              </span>
            </div>

            <div class="hidden md:flex absolute left-72 -translate-x-1/2 items-center justify-center z-10">
              <div class="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:border-blue-500 transition-transform">
                <div class="w-3 h-3 rounded-full bg-indigo-600"></div>
              </div>
            </div>

            <div class="w-full md:flex-1 md:min-w-0 md:pl-12">
              <div class="bg-white/90 backdrop-blur-sm border border-indigo-100/90 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-card hover:border-indigo-300 transition-all">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-cyan-50 text-cyan-700 border border-cyan-200">
                    Mentoring
                  </span>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                  Mentoring Sessions
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed font-normal mb-4">
                  Finalist teams work with domain mentors in online sessions to refine their build, strengthen the pitch, and prepare for the Grand Finale.
                </p>
                <div id="step-expanded-6" class="hidden mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span class="block font-bold text-slate-700 mb-1">Hardware Testing:</span>
                    <span class="text-slate-600">Review sensor calibrations, mechanical casings, power supplies, and battery specs.</span>
                  </div>
                  <div class="bg-cyan-50/70 p-3.5 rounded-xl border border-cyan-100">
                    <span class="block font-bold text-cyan-900 mb-1">Presentation Coaching:</span>
                    <span class="text-cyan-800">Feedback on executive pitch narrative and live stage demo pacing.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 7: 21 Oct 2026 (Grand Finale Day - Featured with image like ignisia.tech) -->
          <div class="relative flex flex-col md:flex-row items-start group timeline-item" id="step-node-7">
            <div class="w-full md:w-72 md:shrink-0 md:pr-8 text-left md:text-right pb-3 md:pb-0">
              <time datetime="2026-10-21" class="font-serif italic text-3xl sm:text-4xl text-indigo-700 group-hover:text-indigo-800 transition-colors font-bold">
                21 Oct 2026
              </time>
              <span class="text-xs font-mono uppercase tracking-wider text-indigo-600 font-extrabold block mt-1">
                Step 04 • Grand Finale
              </span>
            </div>

            <div class="hidden md:flex absolute left-72 -translate-x-1/2 items-center justify-center z-10">
              <div class="w-9 h-9 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <div class="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              </div>
            </div>

            <div class="w-full md:flex-1 md:min-w-0 md:pl-12">
              <div class="bg-gradient-to-br from-white via-indigo-50/30 to-white backdrop-blur-sm border-2 border-indigo-300 rounded-3xl p-6 sm:p-8 shadow-card hover:shadow-hover hover:border-indigo-400 transition-all">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-indigo-600 text-white shadow-xs">
                    MIT-WPU Pune Campus • In-Person Expo
                  </span>
                </div>
                <h3 class="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
                  The Grand Finale &amp; National Technology Expo
                </h3>
                <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-5">
                  A full-day exhibition at the MIT-WPU Kothrud campus in Pune, with live booth judging, investor pitches, and the awards ceremony.
                </p>

                <!-- Featured Stage Image (Matching Screenshot 3 design from ignisia.tech) -->
                <div class="mb-5 rounded-2xl overflow-hidden shadow-md border border-indigo-200/80 group/img relative">
                  <img 
                    src="/assets/mit-wpu-summit-stage.jpg" 
                    alt="INCUBEX 2026 Grand Finale Stage at MIT-WPU Pune" 
                    width="1376"
                    height="768"
                    class="w-full h-56 sm:h-72 object-cover object-center group-hover/img:scale-102 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <span class="text-white text-xs font-bold tracking-wide flex items-center space-x-1.5">
                      <svg class="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                      <span>Auditorium Keynote Stage &amp; Live Jury Rounds • MIT-WPU Pune</span>
                    </span>
                  </div>
                </div>

                <div id="step-expanded-7" class="hidden mt-4 pt-4 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                    <span class="block font-bold text-slate-700 mb-1">Morning Schedule:</span>
                    <span class="text-slate-600">8:30 AM Booth Setup → 10:00 AM Inauguration → 11:00 AM Walk-around Jury Rounds.</span>
                  </div>
                  <div class="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                    <span class="block font-bold text-indigo-900 mb-1">Afternoon &amp; Evening:</span>
                    <span class="text-indigo-800">2:30 PM Top 10 Stage Pitching in front of VCs &amp; Angels → 5:00 PM Cash Awards &amp; Valedictory Ceremony.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 8: Post 21 Oct 2026 -->
          <div class="relative flex flex-col md:flex-row items-start group timeline-item" id="step-node-8">
            <div class="w-full md:w-72 md:shrink-0 md:pr-8 text-left md:text-right pb-3 md:pb-0">
              <time datetime="2026-10-22" class="font-serif italic text-2xl sm:text-3xl text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">
                Post 21 Oct 2026
              </time>
              <span class="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold block mt-1">
                Step 05 • Evolve &amp; Scale
              </span>
            </div>

            <div class="hidden md:flex absolute left-72 -translate-x-1/2 items-center justify-center z-10">
              <div class="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:border-blue-500 transition-transform">
                <div class="w-3 h-3 rounded-full bg-indigo-600"></div>
              </div>
            </div>

            <div class="w-full md:flex-1 md:min-w-0 md:pl-12">
              <div class="bg-white/90 backdrop-blur-sm border border-indigo-100/90 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-card hover:border-indigo-300 transition-all">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Incubation &amp; Acceleration
                  </span>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                  Incubation, Seed Support &amp; Network Access
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed font-normal mb-4">
                  Winners and standout projects receive fast-track incubation support at MIT-WPU Technology Business Incubator (TBI), direct investor syndicate introductions, patent consultation, national merit certificates, and cash prize disbursements.
                </p>
                <div id="step-expanded-8" class="hidden mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span class="block font-bold text-slate-700 mb-1">Ongoing Mentorship:</span>
                    <span class="text-slate-600">Access to Ignisia's alumni network, venture capital partner office hours, and technical labs.</span>
                  </div>
                  <div class="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
                    <span class="block font-bold text-emerald-900 mb-1">Venture Fast-Track:</span>
                    <span class="text-emerald-800">Direct pitch routing to institutional venture funds and state/central government grant programs.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </section>

  <!-- ======================================================== -->
  <!-- TRANSPARENT FEES SECTION (EXACT COMPLIANCE WITH POSTER)  -->
  <!-- ======================================================== -->
  <section class="py-16 md:py-24 relative reveal" id="fees">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="ix-kicker">Per team</span>
        <h2 class="ix-title">Participation <em>Fees</em></h2>
        <p class="text-base text-slate-600 mt-3">
          One registration fee per team.
        </p>
      </div>

      <div class="participation-fee-panel">
        <div class="fee-summary">
          <span class="fee-eyebrow">All Registered Teams</span>
          <h3>Initial Registration Fee</h3>
          <p class="fee-price"><strong>₹300</strong><span>per team</span></p>
          <p class="fee-exemption">Free registration for MIT-WPU Pune students</p>
        </div>
        <ul class="fee-inclusions">
          <li><span aria-hidden="true">✓</span>Covers the whole team (Product: 1–6; Prototype Expo: 3–6 members)</li>
          <li><span aria-hidden="true">✓</span>Entry to the online qualifier round</li>
          <li><span aria-hidden="true">✓</span>Evaluation by the jury panel</li>
          <li><span aria-hidden="true">✓</span>Digital participation certificate for every member</li>
        </ul>
      </div>

    </div>
  </section>

  <!-- BEGIN: FAQSection (Animated & Filterable) -->
  <section class="py-16 md:py-24 relative reveal" id="faq">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="faq-layout grid grid-cols-1 gap-8 xl:grid-cols-[1.7fr_0.9fr] xl:items-start">
        <div class="faq-main min-w-0">
          <div class="text-center max-w-3xl mx-auto mb-12 xl:text-left xl:mx-0">
            <span class="ix-kicker">Need to know</span>
            <h2 class="ix-title">Frequently Asked <em>Questions</em></h2>
            <p class="text-base text-slate-600 mt-3">
              Explore interactive answers categorized by eligibility, screening, finale logistics, and intellectual property.
            </p>

            <!-- Live FAQ Search Bar -->
            <div class="mt-6 max-w-md mx-auto relative xl:mx-0">
              <label for="faq-search-input" class="sr-only">Search frequently asked questions</label>
              <input
                type="text" 
                id="faq-search-input" 
                oninput="filterFaqs();" 
                placeholder="Search questions (e.g. fees, IP, team size, Pune)..." 
                class="w-full pl-11 pr-4 py-3 rounded-full text-xs sm:text-sm font-semibold border border-indigo-200 bg-white/90 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
              <svg class="w-4 h-4 text-indigo-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            <!-- Interactive Category Filter Tabs -->
            <div class="flex flex-wrap items-center justify-center gap-2 mt-6 xl:justify-start" id="faq-category-filters">
              <button onclick="setFaqCategory('event', this); playSound('hover');" class="faq-filter-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-slate-800 border border-slate-300 hover:border-indigo-500 hover:text-indigo-700 cursor-pointer shadow-2xs">
                Event &amp; Eligibility
              </button>
              <button onclick="setFaqCategory('tracks', this); playSound('hover');" class="faq-filter-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-slate-800 border border-slate-300 hover:border-indigo-500 hover:text-indigo-700 cursor-pointer shadow-2xs">
                Tracks &amp; Project Eligibility
              </button>
              <button onclick="setFaqCategory('registration', this); playSound('hover');" class="faq-filter-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-slate-800 border border-slate-300 hover:border-indigo-500 hover:text-indigo-700 cursor-pointer shadow-2xs">
                Teams &amp; Registration
              </button>
              <button onclick="setFaqCategory('finale', this); playSound('hover');" class="faq-filter-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-slate-800 border border-slate-300 hover:border-indigo-500 hover:text-indigo-700 cursor-pointer shadow-2xs">
                Selection &amp; Grand Finale
              </button>
            </div>
          </div>

          <p id="faq-results-status" class="faq-results-status" role="status" aria-live="polite"></p>
          <!-- FAQ Accordion List (Animated Cards) -->
          <div class="space-y-4" id="faq-container">
            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="event" data-keywords="What is INCUBEX 2026? INCUBEX 2026 is a national-level Project Expo + Launchpad Event organized by Ignisia Club at MIT-WPU. It brings together student innovators to showcase working projects, prototypes, and products to expert panels and investors.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">What is INCUBEX 2026?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>INCUBEX 2026 is a national-level Project Expo + Launchpad Event organized by Ignisia Club at MIT-WPU. It brings together student innovators to showcase working projects, prototypes, and products to expert panels and investors.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="event" data-keywords="Who can participate? College students (Diploma, UG, and PG) from any branch or stream across India are eligible. School students are not eligible.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Who can participate?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>College students (Diploma, UG, and PG) from any branch or stream across India are eligible. School students are not eligible.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="event" data-keywords="What is the age limit? Participants must be between 16 and 22 years old.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">What is the age limit?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Participants must be between 16 and 22 years old.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="event" data-keywords="Can students from outside MIT-WPU participate? Yes, INCUBEX 2026 is open to students across India. All team members must belong to the same college (inter-college teams are not permitted). Non-MIT-WPU teams pay a one-time fee of ₹300 per team, while registration is free for MIT-WPU student teams.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Can students from outside MIT-WPU participate?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Yes, INCUBEX 2026 is open to students across India. All team members must belong to the same college (inter-college teams are not permitted). Non-MIT-WPU teams pay a one-time fee of ₹300 per team, while registration is free for MIT-WPU student teams.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="event" data-keywords="What is the event format and when is the finale? The event begins with an online evaluation round (9th–10th October 2026), followed by mentoring sessions for shortlisted teams (15th–16th October) and an offline Grand Finale at the MIT-WPU campus in Pune on 21st October 2026. Only shortlisted finalist teams need to travel to Pune.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">What is the event format and when is the finale?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>The event begins with an online evaluation round (9th–10th October 2026), followed by mentoring sessions for shortlisted teams (15th–16th October) and an offline Grand Finale at the MIT-WPU campus in Pune on 21st October 2026. Only shortlisted finalist teams need to travel to Pune.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="tracks" data-keywords="What are the two tracks? Product Track: For operational ventures or working software/hardware products with a business model (TRL 5–7). Prototype Expo Track: For academic projects, research builds, hardware models, and functional early-stage builds.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">What are the two tracks?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Product Track: For operational ventures or working software/hardware products with a business model (TRL 5–7).</p>
                <p>Prototype Expo Track: For academic projects, research builds, hardware models, and functional early-stage builds.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="tracks" data-keywords="Can I participate with only an idea or slides? No. Submissions must have a working implementation or prototype. Purely theoretical concepts or slide-only presentations are not eligible.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Can I participate with only an idea or slides?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>No. Submissions must have a working implementation or prototype. Purely theoretical concepts or slide-only presentations are not eligible.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="tracks" data-keywords="Can I submit an existing college project, capstone build, or startup? Yes. Existing academic projects, research builds, capstones, startups, or projects previously entered in other competitions are eligible.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Can I submit an existing college project, capstone build, or startup?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Yes. Existing academic projects, research builds, capstones, startups, or projects previously entered in other competitions are eligible.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="tracks" data-keywords="Can a team participate in both tracks? You may submit entries under both tracks, but a team can only be shortlisted for one track in the Grand Finale.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Can a team participate in both tracks?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>You may submit entries under both tracks, but a team can only be shortlisted for one track in the Grand Finale.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="registration" data-keywords="What are the team size rules? Product Track: 1 to 6 members (Solo participation allowed). Prototype Expo Track: 3 to 6 members (Solo participation is NOT allowed).">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">What are the team size rules?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Product Track: 1 to 6 members (Solo participation allowed).</p>
                <p>Prototype Expo Track: 3 to 6 members (Solo participation is NOT allowed).</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="registration" data-keywords="Can students from different colleges form one team? No. All team members must be from the same college. However, students across different academic years and departments within the same college can team up.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Can students from different colleges form one team?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>No. All team members must be from the same college. However, students across different academic years and departments within the same college can team up.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="registration" data-keywords="Can one person join multiple teams? No, a participant can only be part of one team.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Can one person join multiple teams?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>No, a participant can only be part of one team.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="registration" data-keywords="How do we register and what is the fee? Registration must be completed by the Team Leader via Unstop, Luma, or incubex.ignisia.tech. Registration is free for MIT-WPU teams and ₹300 per team for non-MIT-WPU teams.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">How do we register and what is the fee?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Registration must be completed by the Team Leader via Unstop, Luma, or incubex.ignisia.tech. Registration is free for MIT-WPU teams and ₹300 per team for non-MIT-WPU teams.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="registration" data-keywords="Can I change team members or registration details after submitting? No. Team composition, leader details, and track selections cannot be changed after registration.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Can I change team members or registration details after submitting?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>No. Team composition, leader details, and track selections cannot be changed after registration.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="finale" data-keywords="How many teams qualify for the Grand Finale? A total of 80 finalist teams (30 Product Track teams and 50 Prototype Expo Track teams) will be shortlisted for on-campus booths at the Grand Finale on 21st October.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">How many teams qualify for the Grand Finale?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>A total of 80 finalist teams (30 Product Track teams and 50 Prototype Expo Track teams) will be shortlisted for on-campus booths at the Grand Finale on 21st October.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="finale" data-keywords="When will shortlisted teams be announced? Round 1 results and shortlisted finalist announcements will be made on 12th October 2026. Selected teams will be notified via email and phone.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">When will shortlisted teams be announced?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Round 1 results and shortlisted finalist announcements will be made on 12th October 2026. Selected teams will be notified via email and phone.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="finale" data-keywords="What is provided at the exhibition booth, and what should teams bring? Finalists will receive an assigned exhibition booth with power access on campus. Teams must bring their own laptops, extension boards, chargers, testing devices, and demonstration equipment.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">What is provided at the exhibition booth, and what should teams bring?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>Finalists will receive an assigned exhibition booth with power access on campus. Teams must bring their own laptops, extension boards, chargers, testing devices, and demonstration equipment.</p>
              </div>
            </div>

            <div class="faq-item border border-indigo-100/90 rounded-2xl bg-white/95 overflow-hidden shadow-xs hover:border-indigo-300 hover:shadow-card transition-all duration-300" data-category="finale" data-keywords="Who retains the Intellectual Property (IP) rights? 100% IP ownership remains with the participating teams. Ignisia and MIT-WPU do not claim equity, royalties, or code ownership over any participant project.">
              <button class="w-full text-left px-6 py-5 font-extrabold text-slate-900 flex justify-between items-center focus:outline-none cursor-pointer group" onclick="toggleFaq(this); playSound('click');">
                <span class="text-sm sm:text-base pr-4 group-hover:text-indigo-600 transition-colors">Who retains the Intellectual Property (IP) rights?</span>
                <div class="faq-icon-wrapper w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-indigo-600 transition-transform duration-300">
                  <span class="faq-icon text-lg font-bold">+</span>
                </div>
              </button>
              <div class="faq-answer hidden px-6 pb-6 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal border-t border-slate-100 pt-4">
                <p>100% IP ownership remains with the participating teams. Ignisia and MIT-WPU do not claim equity, royalties, or code ownership over any participant project.</p>
              </div>
            </div>
          </div>

        </div>

        <aside class="faq-brochure-aside">
          <div class="faq-brochure-card sticky top-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card max-w-sm mx-auto">
            <button class="faq-brochure-trigger" onclick="openPosterModal(); playSound('click');" aria-label="Download the INCUBEX 2026 brochure">
              <img src="/assets/incubex-poster.jpg" alt="INCUBEX 2026 poster" width="1061" height="1500" class="w-full max-h-[500px] object-cover object-top" loading="lazy" />
              <span class="faq-brochure-open-icon" aria-hidden="true">
                <iconify-icon icon="ph:download-simple-bold" width="21" height="21"></iconify-icon>
              </span>
            </button>
          </div>
        </aside>
      </div>

      <!-- Still have questions? Full-width help card -->
      <div class="faq-help-card bg-white rounded-2xl border border-indigo-100 text-center flex flex-col sm:flex-row items-center justify-between gap-5">
        <div class="text-center sm:text-left">
          <h3 class="text-base sm:text-lg font-extrabold text-slate-900">Still have questions or need custom clarifications?</h3>
          <p class="text-xs text-slate-600 mt-1">Our organizing committee is available to support student innovators.</p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3 flex-shrink-0">
          <a href="mailto:ignisia@mitwpu.edu.in" class="px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-indigo-300 transition-all inline-flex items-center space-x-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <span>Email Committee</span>
          </a>
          <button type="button" onclick="openRegisterModal(); playSound('click');" class="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer">
            <span>Register Now</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </button>
        </div>
      </div>
    </div>
  </section>
  <!-- END: FAQSection -->
  </div>
  </main>
<footer class="relative z-10 border-t-2 border-indigo-200/80 bg-[#f1f5f9] pt-12 pb-8" id="contact">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <a class="footer-brand-banner" href="https://ignisia.tech/" target="_blank" rel="noopener noreferrer" aria-label="Visit Ignisia">
        <svg viewBox="0 0 1200 220" role="img" aria-label="IGNISIA" focusable="false">
          <text x="0" y="205" textLength="1200" lengthAdjust="spacingAndGlyphs" fill="currentColor" font-family="League Spartan, Montserrat, sans-serif" font-size="260" font-weight="900">IGNISIA</text>
        </svg>
      </a>
      <div class="footer-info-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12">
        <!-- Col 1: Brand & Details -->
        <div class="lg:col-span-6">
          <div class="footer-logo-lockup flex items-center gap-4 mb-5">
            <a href="https://mitwpu.edu.in/" target="_blank" rel="noopener noreferrer" aria-label="Visit the official MIT-WPU website">
              <img src="/assets/mit-wpu-logo.png" alt="MIT World Peace University" width="943" height="264" class="h-10 w-auto object-contain" />
            </a>
            <div class="h-8 w-px bg-slate-200"></div>
            <a href="https://ignisia.tech/" target="_blank" rel="noopener noreferrer" aria-label="Visit the official Ignisia website">
              <img src="/assets/ignisia-logo.png" alt="Ignisia — Think Build Evolve" width="817" height="305" class="footer-ignisia-logo" />
            </a>
          </div>
          <p class="max-w-lg text-xs sm:text-sm leading-relaxed text-slate-600">
            A national-level technology launchpad hosted by <strong class="font-bold text-slate-800">IGNISIA Club</strong> at <strong class="font-bold text-slate-800">Dr. Vishwanath Karad MIT World Peace University (MIT-WPU), Pune.</strong> Since 1983, nurturing technical and entrepreneurial excellence. Over 1,600+ students engaged in previous editions.
          </p>
          <p class="mt-4 text-xs sm:text-sm leading-relaxed text-slate-600">
            <strong class="font-bold text-slate-800">Campus Address:</strong> MIT World Peace University, S.No. 124, Paud Road, Kothrud, Pune, Maharashtra 411038
          </p>
        </div>

        <!-- Col 2: Summit Navigation -->
        <div class="lg:col-span-3">
          <h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900">Summit Navigation</h2>
          <ul class="space-y-2.5 text-xs sm:text-sm text-slate-600">
            <li><a class="transition-colors hover:text-indigo-600" href="#arena">Competition Tracks</a></li>
            <li><button type="button" class="text-left transition-colors hover:text-indigo-600 cursor-pointer" onclick="openRegisterModal(); playSound('click');">Register</button></li>
            <li><a class="transition-colors hover:text-indigo-600" href="/assets/incubex-poster.pdf">Official Brochure (PDF)</a></li>
            <li><a class="transition-colors hover:text-indigo-600" href="#categories">Innovation Domains</a></li>
            <li><a class="transition-colors hover:text-indigo-600" href="#mission-map">Event Timeline</a></li>
            <li><a class="transition-colors hover:text-indigo-600" href="#fees">Registration Fees</a></li>
            <li><a class="transition-colors hover:text-indigo-600" href="#faq">Frequently Asked Questions</a></li>
          </ul>
        </div>

        <!-- Col 3: Organizing Secretariat -->
        <div class="lg:col-span-3">
          <h2 class="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900">Organizing Secretariat</h2>
          <div class="space-y-3.5 text-xs sm:text-sm">
            <div>
              <span class="block font-semibold text-slate-800 text-xs sm:text-sm">Email Helpdesk:</span>
              <a href="mailto:ignisia@mitwpu.edu.in" class="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 transition-colors font-medium">ignisia@mitwpu.edu.in</a>
            </div>
            <div>
              <span class="block font-semibold text-slate-800 text-xs sm:text-sm">Social Handles:</span>
              <div class="text-xs sm:text-sm text-slate-600 space-y-0.5 mt-0.5">
                <p>Instagram: <a href="https://www.instagram.com/ignisiamit?igsh=cm5hamdoYXVsODR1&amp;utm_source=qr" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-medium">@ignisiamit</a></p>
                <p>X (Twitter): <a href="https://x.com/ignisiamit?s=11" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-medium">@ignisiamit</a></p>
                <p>LinkedIn: <a href="https://www.linkedin.com/company/ignisia-26/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-medium">@ignisia</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom-bar flex flex-col items-center justify-between gap-3 border-t border-slate-200/90 pt-6 text-xs text-slate-500 sm:flex-row">
        <p>© 2026 IGNISIA Club, MIT-WPU Pune. All rights reserved.</p>
        <p class="footer-build-mark">Built by <span>Ignisia Tech Team</span></p>
        <p class="font-normal text-slate-500">Powered by Unstop • Dr. Vishwanath Karad MIT World Peace University</p>
      </div>
    </div>
  </footer>
` }} />
  );
}
