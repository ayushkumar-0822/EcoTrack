# AGENTS.md

This file provides guidance to contributors working in the **EcoTrack** repository.

## Project Overview

**EcoTrack** is a smart, campus and local waste management tracking web platform. It enables residents and students to track waste collection schedules, report sanitation issues, view neighborhood impact metrics, and manage complaints through an authority dashboard.

## Tech Stack & Architecture

- **Frontend Core**: Semantic HTML5, CSS3 Custom Properties, Vanilla JavaScript (ES6+).
- **Data Persistence**: Supabase Cloud PostgreSQL REST API with resilient client-side `localStorage` fallback.
- **Local Preview**: VS Code Live Server / Static Web Server.
- **Deployment**: Vercel Static Hosting.

## Senior Engineering Standards

All contributions must follow these non-negotiable principles:
1. **Accessibility (WCAG 2.1 AA)**:
   - All interactive elements (`<button>`, `<a>`, `<input>`) must have descriptive text or `aria-label`.
   - Modals and dropdowns must trap focus, handle Escape key, and toggle `aria-expanded`/`aria-hidden`.
   - Respect `prefers-reduced-motion: reduce`.
2. **Security & Input Sanitization**:
   - Never inject raw user inputs into DOM using `innerHTML`. Use `textContent` or sanitized DOM node creation.
   - Prevent XSS, CSRF, and prototype pollution in client storage.
3. **Performance & Core Web Vitals**:
   - Images must have explicit aspect ratios and `loading="lazy"`.
   - Debounce scroll/resize listeners; leverage `IntersectionObserver` for animations and unobserve after trigger.
4. **Resilience**:
   - Fail gracefully if `localStorage`, `IntersectionObserver`, or external CDN assets are blocked or fail to load.
