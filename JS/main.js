/**
 * EcoTrack — Main Application Logic
 * Engineered according to Senior Frontend & WCAG 2.1 AA standards.
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // Global Constants & State
    // -------------------------------------------------------------
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeModal = null;
    let lastFocusedElement = null;

    // Pre-seeded complaint records for demo/testing
    const DEMO_REPORTS = {
        "ECO-2026-101": {
            id: "ECO-2026-101",
            category: "Overflowing Bin",
            location: "Maple Street & 4th Cross",
            urgency: "High",
            status: "Resolved",
            submittedAt: "Yesterday at 09:15 AM",
            timeline: [
                { title: "Complaint Logged", desc: "Citizen reported via EcoTrack portal", completed: true },
                { title: "Inspection Complete", desc: "Local sanitation officer verified site", completed: true },
                { title: "Cleaned & Resolved", desc: "Disposal truck collected all debris", completed: true }
            ]
        },
        "ECO-2026-102": {
            id: "ECO-2026-102",
            category: "Missed Collection",
            location: "North Ridge, Sector 7",
            urgency: "Normal",
            status: "In Progress",
            submittedAt: "Today at 07:45 AM",
            timeline: [
                { title: "Complaint Logged", desc: "Citizen reported missed household pickup", completed: true },
                { title: "Dispatched", desc: "Route truck #14 assigned for recovery", completed: true },
                { title: "Awaiting Resolution", desc: "Driver en route", completed: false }
            ]
        }
    };

    // Neighborhood Collection Schedules
    const SCHEDULE_DATA = {
        "zone-green-valley": [
            { type: "Organic / Wet Waste", days: "Mon, Wed, Fri", time: "07:00 AM – 09:30 AM", icon: "fa-leaf" },
            { type: "Dry Recyclables (Paper/Plastic)", days: "Tue, Sat", time: "08:00 AM – 10:30 AM", icon: "fa-recycle" },
            { type: "Hazardous / E-Waste", days: "First Sunday of Month", time: "10:00 AM – 02:00 PM", icon: "fa-battery-half" }
        ],
        "zone-north-ridge": [
            { type: "Organic / Wet Waste", days: "Daily (Mon–Sat)", time: "06:30 AM – 08:30 AM", icon: "fa-leaf" },
            { type: "Dry Recyclables", days: "Wed, Sun", time: "09:00 AM – 11:30 AM", icon: "fa-recycle" },
            { type: "Bulk Furniture / Green Waste", days: "Bi-weekly Thursdays", time: "01:00 PM – 04:00 PM", icon: "fa-couch" }
        ],
        "zone-downtown": [
            { type: "Commercial Wet Waste", days: "Daily (twice daily)", time: "05:00 AM & 09:00 PM", icon: "fa-building" },
            { type: "Cardboard & Packaging", days: "Daily (Mon–Sat)", time: "10:00 AM – 12:00 PM", icon: "fa-box-open" },
            { type: "Sanitary Waste", days: "Mon, Wed, Fri", time: "02:00 PM – 04:00 PM", icon: "fa-shield-halved" }
        ],
        "zone-south-harbor": [
            { type: "General Domestic Waste", days: "Mon, Thu, Sat", time: "07:30 AM – 10:00 AM", icon: "fa-trash-can" },
            { type: "Marine & Plastics Cleanliness", days: "Tue, Fri", time: "08:00 AM – 11:00 AM", icon: "fa-water" },
            { type: "Hazardous Material", days: "Last Saturday of Month", time: "11:00 AM – 03:00 PM", icon: "fa-triangle-exclamation" }
        ]
    };

    // -------------------------------------------------------------
    // 1. Toast Notification Helper
    // -------------------------------------------------------------
    function showToast(message, type = "success") {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        const iconClass = type === "success" ? "fa-circle-check" : "fa-circle-info";
        const icon = document.createElement("i");
        icon.className = `fa-solid ${iconClass}`;
        
        const textSpan = document.createElement("span");
        textSpan.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(textSpan);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 400);
        }, 4200);
    }

    // -------------------------------------------------------------
    // 2. Accessible Modal Dialog System
    // -------------------------------------------------------------
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        lastFocusedElement = document.activeElement;
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        activeModal = modal;
        document.body.style.overflow = "hidden";

        // Focus first interactive control
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }

    function closeModal() {
        if (!activeModal) return;
        activeModal.classList.remove("active");
        activeModal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
        activeModal = null;
    }

    // Modal Triggers
    document.querySelectorAll("[data-modal-open]").forEach(trigger => {
        trigger.addEventListener("click", event => {
            event.preventDefault();
            const targetId = trigger.getAttribute("data-modal-open");
            openModal(targetId);
        });
    });

    // Modal Close buttons & Backdrop clicks
    document.querySelectorAll("[data-modal-close]").forEach(el => {
        el.addEventListener("click", () => closeModal());
    });

    // Keyboard Accessibility (ESC closes active modal & mobile menu)
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (activeModal) {
                closeModal();
            }
            const navLinks = document.getElementById("navLinks");
            const menuToggle = document.getElementById("menuToggle");
            if (navLinks && navLinks.classList.contains("open")) {
                navLinks.classList.remove("open");
                if (menuToggle) {
                    menuToggle.setAttribute("aria-expanded", "false");
                    menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
                    menuToggle.focus();
                }
            }
        }
    });

    // -------------------------------------------------------------
    // 3. Issue Reporting Form & Geolocation
    // -------------------------------------------------------------
    const reportForm = document.getElementById("reportIssueForm");
    const btnDetectLocation = document.getElementById("btnDetectLocation");
    const geoStatus = document.getElementById("geoStatus");
    const locationInput = document.getElementById("issueLocation");

    if (btnDetectLocation && locationInput) {
        btnDetectLocation.addEventListener("click", () => {
            if (!navigator.geolocation) {
                if (geoStatus) geoStatus.textContent = "Geolocation is not supported by your browser.";
                return;
            }

            if (geoStatus) geoStatus.textContent = "Detecting GPS location...";
            btnDetectLocation.disabled = true;

            navigator.geolocation.getCurrentPosition(
                position => {
                    const lat = position.coords.latitude.toFixed(5);
                    const lng = position.coords.longitude.toFixed(5);
                    locationInput.value = `GPS: ${lat}, ${lng} (Auto-detected)`;
                    if (geoStatus) geoStatus.textContent = "Location verified via GPS.";
                    btnDetectLocation.disabled = false;
                },
                error => {
                    if (geoStatus) geoStatus.textContent = "Unable to retrieve location. Please type manually.";
                    btnDetectLocation.disabled = false;
                },
                { timeout: 8000 }
            );
        });
    }

    if (reportForm) {
        reportForm.addEventListener("submit", event => {
            event.preventDefault();

            const category = document.getElementById("issueCategory").value;
            const location = document.getElementById("issueLocation").value;
            const urgency = document.getElementById("issueUrgency").value;
            const description = document.getElementById("issueDescription").value;

            // Generate clean unique ticket ID
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const ticketId = `ECO-2026-${randomSuffix}`;

            const newReport = {
                id: ticketId,
                category,
                location,
                urgency,
                description: description || "No additional remarks.",
                status: "Submitted",
                submittedAt: "Just now",
                timeline: [
                    { title: "Complaint Logged", desc: `Issue reported: ${category}`, completed: true },
                    { title: "Under Review", desc: "Sanitation team reviewing report", completed: false },
                    { title: "Resolution", desc: "Awaiting field team dispatch", completed: false }
                ]
            };

            // Save to localStorage
            try {
                const stored = JSON.parse(localStorage.getItem("ecotrack_reports") || "{}");
                stored[ticketId] = newReport;
                localStorage.setItem("ecotrack_reports", JSON.stringify(stored));
            } catch (err) {
                console.warn("Storage quota or access denied:", err);
            }

            reportForm.reset();
            closeModal();

            showToast(`Report logged successfully! Your Tracking ID is ${ticketId}`, "success");

            // Optionally pre-fill track dialog for immediate convenience
            const trackInput = document.getElementById("trackingInput");
            if (trackInput) {
                trackInput.value = ticketId;
            }
        });
    }

    // -------------------------------------------------------------
    // 4. Waste Collection Schedule Viewer
    // -------------------------------------------------------------
    const scheduleSelect = document.getElementById("scheduleZoneSelect");
    const scheduleContainer = document.getElementById("scheduleResults");

    function renderSchedules(zoneKey) {
        if (!scheduleContainer) return;
        const items = SCHEDULE_DATA[zoneKey] || [];
        scheduleContainer.innerHTML = "";

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "schedule-item";

            const wasteDiv = document.createElement("div");
            wasteDiv.className = "schedule-waste-type";
            
            const icon = document.createElement("i");
            icon.className = `fa-solid ${item.icon}`;

            const nameSpan = document.createElement("span");
            nameSpan.textContent = item.type;

            wasteDiv.appendChild(icon);
            wasteDiv.appendChild(nameSpan);

            const timeDiv = document.createElement("div");
            timeDiv.className = "schedule-time";
            timeDiv.textContent = `${item.days} · ${item.time}`;

            card.appendChild(wasteDiv);
            card.appendChild(timeDiv);
            scheduleContainer.appendChild(card);
        });
    }

    if (scheduleSelect) {
        renderSchedules(scheduleSelect.value);
        scheduleSelect.addEventListener("change", () => renderSchedules(scheduleSelect.value));
    }

    // -------------------------------------------------------------
    // 5. Live Complaint Tracker
    // -------------------------------------------------------------
    const trackForm = document.getElementById("trackForm");
    const trackingDetails = document.getElementById("trackingDetails");

    if (trackForm && trackingDetails) {
        trackForm.addEventListener("submit", event => {
            event.preventDefault();
            const inputVal = document.getElementById("trackingInput").value.trim().toUpperCase();
            
            // Check localStorage then demo reports
            let storedReports = {};
            try {
                storedReports = JSON.parse(localStorage.getItem("ecotrack_reports") || "{}");
            } catch (e) {}

            const record = storedReports[inputVal] || DEMO_REPORTS[inputVal];

            trackingDetails.innerHTML = "";

            if (!record) {
                const notFound = document.createElement("div");
                notFound.className = "form-hint";
                notFound.style.color = "#dc2626";
                notFound.style.marginTop = "1rem";
                notFound.textContent = `No complaint found for ID "${inputVal}". Please verify the reference number or submit a report.`;
                trackingDetails.appendChild(notFound);
                return;
            }

            const box = document.createElement("div");
            box.className = "tracking-result-box";

            const header = document.createElement("div");
            header.className = "tracking-header";

            const idSpan = document.createElement("span");
            idSpan.className = "tracking-id";
            idSpan.textContent = record.id;

            const badge = document.createElement("span");
            const statusKey = record.status.toLowerCase().includes("progress")
                ? "progress"
                : record.status.toLowerCase().includes("resolved")
                ? "resolved"
                : "submitted";
            badge.className = `status-badge ${statusKey}`;
            badge.textContent = record.status;

            header.appendChild(idSpan);
            header.appendChild(badge);
            box.appendChild(header);

            const metaP = document.createElement("p");
            metaP.style.fontSize = "0.85rem";
            metaP.style.marginBottom = "0.75rem";
            metaP.textContent = `${record.category} • ${record.location} • Submitted: ${record.submittedAt}`;
            box.appendChild(metaP);

            const timeline = document.createElement("div");
            timeline.className = "timeline";

            record.timeline.forEach(step => {
                const stepEl = document.createElement("div");
                stepEl.className = `timeline-step ${step.completed ? "completed" : ""}`;

                const dot = document.createElement("div");
                dot.className = "timeline-dot";

                const strong = document.createElement("strong");
                strong.textContent = step.title;

                const span = document.createElement("span");
                span.textContent = step.desc;

                stepEl.appendChild(dot);
                stepEl.appendChild(strong);
                stepEl.appendChild(span);
                timeline.appendChild(stepEl);
            });

            box.appendChild(timeline);
            trackingDetails.appendChild(box);
        });
    }

    // -------------------------------------------------------------
    // 6. Mobile Navigation
    // -------------------------------------------------------------
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.innerHTML = isOpen
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }

    // -------------------------------------------------------------
    // 7. Active Navigation Spy (IntersectionObserver)
    // -------------------------------------------------------------
    const sections = document.querySelectorAll("main section[id]");
    const navigationLinks = document.querySelectorAll(".nav-link");

    if ("IntersectionObserver" in window && sections.length > 0) {
        const sectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentId = entry.target.getAttribute("id");
                    navigationLinks.forEach(link => {
                        link.classList.remove("active");
                        if (link.getAttribute("href") === `#${currentId}`) {
                            link.classList.add("active");
                        }
                    });
                }
            });
        }, { root: null, threshold: 0.25 });

        sections.forEach(sec => sectionObserver.observe(sec));
    }

    // -------------------------------------------------------------
    // 8. Animated Statistics
    // -------------------------------------------------------------
    const counters = document.querySelectorAll("[data-count]");

    if ("IntersectionObserver" in window && counters.length > 0) {
        const counterObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = Number(counter.dataset.count);

                    if (prefersReducedMotion) {
                        counter.textContent = target.toLocaleString("en-IN");
                        counterObserver.unobserve(counter);
                        return;
                    }

                    const duration = 1500;
                    let startTime = null;

                    function animateCounter(timestamp) {
                        if (!startTime) startTime = timestamp;
                        const progress = Math.min((timestamp - startTime) / duration, 1);
                        const easedProgress = 1 - Math.pow(1 - progress, 4);
                        const currentValue = Math.floor(easedProgress * target);

                        counter.textContent = currentValue.toLocaleString("en-IN");

                        if (progress < 1) {
                            requestAnimationFrame(animateCounter);
                        } else {
                            counter.textContent = target.toLocaleString("en-IN");
                        }
                    }

                    requestAnimationFrame(animateCounter);
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => counterObserver.observe(c));
    }

    // -------------------------------------------------------------
    // 9. Smooth Scrolling
    // -------------------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const targetId = link.getAttribute("href");
            if (targetId === "#" || link.hasAttribute("data-modal-open")) {
                return;
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                event.preventDefault();
                targetElement.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                    block: "start"
                });
            }
        });
    });

    // -------------------------------------------------------------
    // 10. Progressive Reveal Animations
    // -------------------------------------------------------------
    if (!prefersReducedMotion && "IntersectionObserver" in window) {
        const revealElements = document.querySelectorAll(".service-card, .step-item, .stat-card");

        revealElements.forEach(element => {
            element.style.opacity = "0";
            element.style.transform = "translateY(16px)";
            element.style.transition = "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        });

        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach((entry, idx) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.style.transitionDelay = `${(idx % 4) * 60}ms`;
                    el.style.opacity = "1";
                    el.style.transform = "translateY(0)";
                    revealObserver.unobserve(el);
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    console.log(
        "%cEcoTrack initialized successfully with CodeRabbit Antigravity & Worktree integrations!",
        "color: #176b45; font-size: 14px; font-weight: bold;"
    );
});
