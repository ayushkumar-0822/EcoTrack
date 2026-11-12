/**
 * EcoTrack — Local Waste-Service Coordination Engine
 * Implements: Area Selection, Collection Calendar, Reminders, Missed Pickup & Bin Issue Reporting,
 * Status Stepper, Municipal Service Dashboard, Notifications, and CMS/Figma Token Bridges.
 * WCAG 2.1 AA Compliant & CodeRabbit Standards.
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // 1. Data Store & State
    // -------------------------------------------------------------
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let activeModal = null;
    let lastFocusedElement = null;

    // Current State
    const AppState = {
        currentZone: localStorage.getItem("ecotrack_zone") || "zone-green-valley",
        calendarYear: 2026,
        calendarMonth: 10, // 0-indexed: 10 is November
        selectedDay: 18,
        activeCategoryFilter: "all",
        notificationsUnread: 2
    };

    // Zone Definitions
    const ZONES = {
        "zone-green-valley": {
            name: "Green Valley & Eco Heights (Zone A)",
            shortName: "Green Valley (Zone A)",
            type: "Residential & Parks",
            trucks: ["Truck-04", "Truck-09"],
            nextPickup: "Tomorrow, 7:00 AM · Organic",
            weeklySchedule: {
                1: [{ type: "Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "Route #04 (R. Patel)" }], // Mon
                2: [{ type: "Dry Recyclables", time: "08:00 AM – 10:30 AM", cat: "recyclable", crew: "Route #09 (M. Jenkins)" }], // Tue
                3: [{ type: "Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "Route #04 (R. Patel)" }], // Wed
                5: [{ type: "Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "Route #04 (R. Patel)" }], // Fri
                6: [
                    { type: "Dry Recyclables", time: "08:00 AM – 10:30 AM", cat: "recyclable", crew: "Route #09 (M. Jenkins)" },
                    { type: "Hazardous & E-Waste", time: "10:00 AM – 02:00 PM", cat: "hazardous", crew: "HazMat Team #02" }
                ] // Sat
            }
        },
        "zone-north-ridge": {
            name: "North Ridge Residential (Zone B)",
            shortName: "North Ridge (Zone B)",
            type: "High-density housing",
            trucks: ["Truck-12"],
            nextPickup: "Friday, 6:30 AM · Organic",
            weeklySchedule: {
                1: [{ type: "Organic", time: "06:30 AM – 08:30 AM", cat: "organic", crew: "Route #12 (S. Kumar)" }],
                3: [{ type: "Dry Recyclables", time: "09:00 AM – 11:30 AM", cat: "recyclable", crew: "Route #09" }],
                5: [{ type: "Organic", time: "06:30 AM – 08:30 AM", cat: "organic", crew: "Route #12 (S. Kumar)" }],
                0: [{ type: "Dry Recyclables", time: "09:00 AM – 11:30 AM", cat: "recyclable", crew: "Route #09" }]
            }
        },
        "zone-downtown": {
            name: "Central Commercial & Downtown (Zone C)",
            shortName: "Downtown (Zone C)",
            type: "Business & Retail",
            trucks: ["Truck-02"],
            nextPickup: "Tonight, 9:00 PM · Commercial Wet",
            weeklySchedule: {
                1: [{ type: "Cardboard & Packaging", time: "10:00 AM – 12:00 PM", cat: "recyclable", crew: "Truck-02" }],
                2: [{ type: "Commercial Wet", time: "09:00 PM – 11:00 PM", cat: "organic", crew: "Night Crew #01" }],
                3: [{ type: "Sanitary Waste", time: "02:00 PM – 04:00 PM", cat: "hazardous", crew: "HazMat Team" }],
                4: [{ type: "Cardboard & Packaging", time: "10:00 AM – 12:00 PM", cat: "recyclable", crew: "Truck-02" }],
                5: [{ type: "Commercial Wet", time: "09:00 PM – 11:00 PM", cat: "organic", crew: "Night Crew #01" }]
            }
        },
        "zone-south-harbor": {
            name: "South Harbor & Waterfront (Zone D)",
            shortName: "South Harbor (Zone D)",
            type: "Coastal & Mixed",
            trucks: ["Truck-07"],
            nextPickup: "Saturday, 7:30 AM · General Domestic",
            weeklySchedule: {
                1: [{ type: "General Domestic", time: "07:30 AM – 10:00 AM", cat: "organic", crew: "Truck-07" }],
                2: [{ type: "Marine & Plastics", time: "08:00 AM – 11:00 AM", cat: "recyclable", crew: "Eco-Fleet" }],
                4: [{ type: "General Domestic", time: "07:30 AM – 10:00 AM", cat: "organic", crew: "Truck-07" }],
                5: [{ type: "Marine & Plastics", time: "08:00 AM – 11:00 AM", cat: "recyclable", crew: "Eco-Fleet" }],
                6: [{ type: "Hazardous Materials", time: "11:00 AM – 03:00 PM", cat: "hazardous", crew: "HazMat Team" }]
            }
        }
    };

    // Preloaded Demo Tickets for Status Tracking
    const SAMPLE_REPORTS = {
        "ECO-2026-MP-101": {
            id: "ECO-2026-MP-101",
            category: "Missed Pickup",
            title: "Missed Organic Household Bins",
            location: "142 Elm Street, Maple Quarter",
            submittedAt: "Nov 11, 2026 • 08:15 AM",
            resolvedAt: "Nov 11, 2026 • 11:42 AM",
            status: "Resolved",
            currentStep: 4,
            steps: [
                { num: 1, name: "Report Logged", desc: "Citizen submitted curbside missed pickup ticket", time: "08:15 AM", done: true },
                { num: 2, name: "Triaged & Approved", desc: "Sanitation Dispatcher verified route miss", time: "08:40 AM", done: true },
                { num: 3, name: "Recovery Truck Sent", desc: "Truck-04 rerouted for recovery pickup", time: "09:55 AM", done: true },
                { num: 4, name: "Pickup Completed", desc: "Bins emptied. Resident confirmed resolution", time: "11:42 AM", done: true }
            ]
        },
        "ECO-2026-BN-204": {
            id: "ECO-2026-BN-204",
            category: "Bin Issue",
            title: "Damaged Wheels & Split Lid",
            location: "88 North Ridge Blvd, Bin #BN-892",
            submittedAt: "Today at 07:30 AM",
            resolvedAt: "Estimated Today 03:30 PM",
            status: "In Progress",
            currentStep: 3,
            steps: [
                { num: 1, name: "Report Logged", desc: "Photo and bin serial received", time: "07:30 AM", done: true },
                { num: 2, name: "Replacement Order", desc: "240L Heavy-duty replacement bin allocated from depot", time: "08:10 AM", done: true },
                { num: 3, name: "En Route for Delivery", desc: "Depot Maintenance Truck #02 dispatched", time: "10:15 AM", done: true },
                { num: 4, name: "Installation & Exchange", desc: "Old bin retrieved & new bin placed curbside", time: "Pending", done: false }
            ]
        },
        "ECO-2026-ID-308": {
            id: "ECO-2026-ID-308",
            category: "Illegal Dumping",
            title: "Construction Debris & Dry Dumping",
            location: "Empty lot behind Green Valley Central Park",
            submittedAt: "Today at 09:00 AM",
            resolvedAt: "Inspection within 2 hours",
            status: "Dispatched",
            currentStep: 2,
            steps: [
                { num: 1, name: "Report Logged", desc: "Citizen reported ~3 tons dry debris", time: "09:00 AM", done: true },
                { num: 2, name: "Officer Dispatched", desc: "Sanitation Inspector assigned for assessment", time: "09:25 AM", done: true },
                { num: 3, name: "Heavy Loader Scheduled", desc: "Municipal loader and dump truck assigned", time: "Pending", done: false },
                { num: 4, name: "Site Cleared", desc: "Site sanitized and fenced", time: "Pending", done: false }
            ]
        }
    };

    // -------------------------------------------------------------
    // 2. Toast Notification Service
    // -------------------------------------------------------------
    function showToast(message, type = "success") {
        const container = document.getElementById("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        const icon = document.createElement("i");
        icon.className = `fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-info"}`;
        
        const span = document.createElement("span");
        span.textContent = message;

        toast.appendChild(icon);
        toast.appendChild(span);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    }

    // -------------------------------------------------------------
    // 3. Modal Manager (WCAG 2.1 AA Compliant)
    // -------------------------------------------------------------
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        lastFocusedElement = document.activeElement;
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        activeModal = modal;
        document.body.style.overflow = "hidden";

        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) focusable[0].focus();
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

    document.querySelectorAll("[data-modal-open]").forEach(trigger => {
        trigger.addEventListener("click", e => {
            e.preventDefault();
            const targetId = trigger.getAttribute("data-modal-open");
            openModal(targetId);
        });
    });

    document.querySelectorAll("[data-modal-close]").forEach(el => {
        el.addEventListener("click", () => closeModal());
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            if (activeModal) closeModal();
            closeDropdowns();
        }
    });

    // -------------------------------------------------------------
    // 4. Area Selection Controller
    // -------------------------------------------------------------
    const navAreaBtn = document.getElementById("navAreaBtn");
    const navAreaDropdown = document.getElementById("navAreaDropdown");
    const navAreaMenu = document.getElementById("navAreaMenu");
    const navAreaLabel = document.getElementById("navAreaLabel");
    const calendarAreaSelect = document.getElementById("calendarAreaSelect");
    const heroCurrentZoneName = document.getElementById("heroCurrentZoneName");
    const heroNextPickup = document.getElementById("heroNextPickup");

    function updateActiveZone(zoneKey) {
        if (!ZONES[zoneKey]) return;
        AppState.currentZone = zoneKey;
        localStorage.setItem("ecotrack_zone", zoneKey);

        const zone = ZONES[zoneKey];

        if (navAreaLabel) navAreaLabel.textContent = zone.shortName;
        if (heroCurrentZoneName) heroCurrentZoneName.textContent = zone.name;
        if (heroNextPickup) heroNextPickup.textContent = zone.nextPickup;
        if (calendarAreaSelect) calendarAreaSelect.value = zoneKey;

        // Update active class in menu
        if (navAreaMenu) {
            navAreaMenu.querySelectorAll("li").forEach(li => {
                const isActive = li.getAttribute("data-zone") === zoneKey;
                li.classList.toggle("active", isActive);
                li.setAttribute("aria-selected", String(isActive));
            });
        }

        renderCalendar();
        showToast(`Neighborhood area switched to ${zone.shortName}`, "info");
    }

    if (navAreaBtn && navAreaDropdown) {
        navAreaBtn.addEventListener("click", e => {
            e.stopPropagation();
            const isOpen = navAreaDropdown.classList.toggle("open");
            navAreaBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    if (navAreaMenu) {
        navAreaMenu.querySelectorAll("li").forEach(item => {
            item.addEventListener("click", () => {
                const zoneKey = item.getAttribute("data-zone");
                updateActiveZone(zoneKey);
                navAreaDropdown.classList.remove("open");
                navAreaBtn.setAttribute("aria-expanded", "false");
            });
        });
    }

    if (calendarAreaSelect) {
        calendarAreaSelect.addEventListener("change", () => {
            updateActiveZone(calendarAreaSelect.value);
        });
    }

    // -------------------------------------------------------------
    // 5. Notifications Dropdown Controller
    // -------------------------------------------------------------
    const notifBtn = document.getElementById("notifBtn");
    const notifWrapper = document.getElementById("notifWrapper");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifBadge = document.getElementById("notifBadge");
    const btnMarkAllRead = document.getElementById("btnMarkAllRead");

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener("click", e => {
            e.stopPropagation();
            const isOpen = notifDropdown.classList.toggle("open");
            notifBtn.setAttribute("aria-expanded", String(isOpen));
            notifDropdown.setAttribute("aria-hidden", String(!isOpen));
        });
    }

    if (btnMarkAllRead) {
        btnMarkAllRead.addEventListener("click", () => {
            document.querySelectorAll(".notif-item.unread").forEach(el => el.classList.remove("unread"));
            if (notifBadge) notifBadge.style.display = "none";
            showToast("All notifications marked as read", "info");
        });
    }

    function closeDropdowns() {
        if (navAreaDropdown) navAreaDropdown.classList.remove("open");
        if (notifDropdown) notifDropdown.classList.remove("open");
    }

    document.addEventListener("click", () => closeDropdowns());

    // -------------------------------------------------------------
    // 6. Collection Calendar Engine
    // -------------------------------------------------------------
    const calendarGrid = document.getElementById("calendarGrid");
    const calendarMonthTitle = document.getElementById("calendarMonthTitle");
    const btnPrevMonth = document.getElementById("btnPrevMonth");
    const btnNextMonth = document.getElementById("btnNextMonth");
    const calendarFilters = document.getElementById("calendarFilters");
    const selectedDateHeading = document.getElementById("selectedDateHeading");
    const selectedDateDesc = document.getElementById("selectedDateDesc");
    const selectedDatePickups = document.getElementById("selectedDatePickups");
    const btnQuickReminder = document.getElementById("btnQuickReminder");

    const MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    function getPickupsForDay(dayNumber, dayOfWeek, zoneKey) {
        const zone = ZONES[zoneKey] || ZONES["zone-green-valley"];
        const dayPickups = zone.weeklySchedule[dayOfWeek] || [];

        if (AppState.activeCategoryFilter === "all") {
            return dayPickups;
        }
        return dayPickups.filter(p => p.cat === AppState.activeCategoryFilter);
    }

    function renderCalendar() {
        if (!calendarGrid) return;

        const year = AppState.calendarYear;
        const month = AppState.calendarMonth;

        if (calendarMonthTitle) {
            calendarMonthTitle.textContent = `${MONTH_NAMES[month]} ${year}`;
        }

        calendarGrid.innerHTML = "";

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Convert JS Sunday-first (0-6) to Monday-first (0-6)
        let startDayIndex = firstDayOfMonth.getDay() - 1;
        if (startDayIndex < 0) startDayIndex = 6;

        // Days from previous month
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const dayEl = document.createElement("div");
            dayEl.className = "calendar-day other-month";
            const num = document.createElement("span");
            num.className = "day-number";
            num.textContent = daysInPrevMonth - i;
            dayEl.appendChild(num);
            calendarGrid.appendChild(dayEl);
        }

        // Days of current month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dayOfWeek = dateObj.getDay(); // 0 is Sun, 1 is Mon...
            const pickups = getPickupsForDay(d, dayOfWeek, AppState.currentZone);

            const dayEl = document.createElement("div");
            dayEl.className = "calendar-day";
            if (d === 13) dayEl.classList.add("today"); // Current date highlight
            if (d === AppState.selectedDay) dayEl.classList.add("selected");

            const numSpan = document.createElement("span");
            numSpan.className = "day-number";
            numSpan.textContent = d;
            dayEl.appendChild(numSpan);

            if (pickups.length > 0) {
                const dotsContainer = document.createElement("div");
                dotsContainer.className = "day-pickups";
                pickups.forEach(p => {
                    const dot = document.createElement("span");
                    dot.className = `pickup-dot dot-${p.cat}`;
                    dot.title = p.type;
                    dotsContainer.appendChild(dot);
                });
                dayEl.appendChild(dotsContainer);
            }

            dayEl.addEventListener("click", () => {
                AppState.selectedDay = d;
                renderCalendar();
                updateDetailPanel(d, dateObj, pickups);
            });

            calendarGrid.appendChild(dayEl);
        }

        // Initialize detail inspection panel for selected day
        const selectedDateObj = new Date(year, month, AppState.selectedDay);
        const currentPickups = getPickupsForDay(AppState.selectedDay, selectedDateObj.getDay(), AppState.currentZone);
        updateDetailPanel(AppState.selectedDay, selectedDateObj, currentPickups);
    }

    function updateDetailPanel(dayNum, dateObj, pickups) {
        if (!selectedDateHeading || !selectedDatePickups) return;

        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
        selectedDateHeading.textContent = `${dayName}, Nov ${dayNum}`;

        if (pickups.length === 0) {
            selectedDateDesc.textContent = "No collections scheduled for this date in your zone.";
            selectedDatePickups.innerHTML = `
                <div style="padding: 1.5rem; text-align: center; color: var(--text-light); font-size: 0.85rem;">
                    <i class="fa-solid fa-calendar-xmark" style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #94a3b8; display: block;"></i>
                    No collection truck on route today. Next collection is scheduled for upcoming pickup cycle.
                </div>
            `;
            return;
        }

        selectedDateDesc.textContent = `${pickups.length} scheduled waste stream collection(s) active.`;
        selectedDatePickups.innerHTML = "";

        pickups.forEach(p => {
            const card = document.createElement("div");
            card.className = `pickup-card ${p.cat}`;

            const title = document.createElement("strong");
            title.textContent = p.type;

            const time = document.createElement("span");
            time.textContent = `Time window: ${p.time}`;

            const crew = document.createElement("div");
            crew.style.fontSize = "0.75rem";
            crew.style.marginTop = "0.3rem";
            crew.style.color = "var(--primary-dark)";
            crew.style.fontWeight = "600";
            crew.textContent = `Assigned: ${p.crew}`;

            card.appendChild(title);
            card.appendChild(time);
            card.appendChild(crew);
            selectedDatePickups.appendChild(card);
        });
    }

    if (btnPrevMonth) {
        btnPrevMonth.addEventListener("click", () => {
            AppState.calendarMonth = (AppState.calendarMonth === 0) ? 11 : AppState.calendarMonth - 1;
            renderCalendar();
        });
    }

    if (btnNextMonth) {
        btnNextMonth.addEventListener("click", () => {
            AppState.calendarMonth = (AppState.calendarMonth === 11) ? 0 : AppState.calendarMonth + 1;
            renderCalendar();
        });
    }

    if (calendarFilters) {
        calendarFilters.querySelectorAll(".chip").forEach(chip => {
            chip.addEventListener("click", () => {
                calendarFilters.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                AppState.activeCategoryFilter = chip.getAttribute("data-filter");
                renderCalendar();
            });
        });
    }

    if (btnQuickReminder) {
        btnQuickReminder.addEventListener("click", () => {
            openModal("reminderModal");
        });
    }

    // -------------------------------------------------------------
    // 7. Reminders Configuration Form
    // -------------------------------------------------------------
    const reminderForm = document.getElementById("reminderForm");
    if (reminderForm) {
        reminderForm.addEventListener("submit", e => {
            e.preventDefault();
            const email = document.getElementById("reminderEmail").value;
            const phone = document.getElementById("reminderPhone").value;

            const prefs = {
                evening: document.getElementById("checkEveningReminder").checked,
                morning: document.getElementById("checkMorningReminder").checked,
                weather: document.getElementById("checkWeatherAlerts").checked,
                email,
                phone,
                zone: AppState.currentZone
            };

            localStorage.setItem("ecotrack_reminder_prefs", JSON.stringify(prefs));
            closeModal();
            showToast("Automated pickup reminders saved & activated!", "success");
        });
    }

    // -------------------------------------------------------------
    // 8. Issue Reporting Hub (Segmented Tabs & Forms)
    // -------------------------------------------------------------
    const tabButtons = document.querySelectorAll(".v0-segmented-tabs .tab-btn");
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-selected", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-selected", "true");

            const tabKey = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab-pane").forEach(pane => {
                pane.classList.remove("active");
                pane.hidden = true;
            });

            const targetPane = document.getElementById(`pane${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
            if (targetPane) {
                targetPane.classList.add("active");
                targetPane.hidden = false;
            }
        });
    });

    // Geolocation Helper for all GPS buttons
    document.querySelectorAll(".btnGeoDetect").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.closest(".input-with-action").querySelector("input");
            if (!navigator.geolocation) {
                showToast("Geolocation is not supported by your browser.", "info");
                return;
            }
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GPS';

            navigator.geolocation.getCurrentPosition(
                pos => {
                    const lat = pos.coords.latitude.toFixed(5);
                    const lng = pos.coords.longitude.toFixed(5);
                    if (input) input.value = `Curbside GPS: ${lat}, ${lng} (Auto-detected)`;
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> GPS';
                    showToast("GPS coordinates acquired!", "success");
                },
                err => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> GPS';
                    showToast("Unable to fetch GPS. Please type address manually.", "info");
                },
                { timeout: 7000 }
            );
        });
    });

    // Form: Missed Pickup Report
    const formMissed = document.getElementById("formMissedPickup");
    if (formMissed) {
        formMissed.addEventListener("submit", e => {
            e.preventDefault();
            const addr = document.getElementById("missedAddress").value;
            const wasteType = document.getElementById("missedWasteType").value;
            const area = document.getElementById("missedArea").value;
            const ticketId = `ECO-2026-MP-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: "Missed Pickup",
                title: `${wasteType} Left Behind`,
                location: `${addr} • ${area}`,
                submittedAt: "Just now",
                resolvedAt: "Guaranteed within 4 hours",
                status: "Triaged",
                currentStep: 2,
                steps: [
                    { num: 1, name: "Report Logged", desc: `Missed pickup filed for ${wasteType}`, time: "Just now", done: true },
                    { num: 2, name: "Triaged & Approved", desc: "Route supervisor scheduled recovery truck", time: "Pending", done: true },
                    { num: 3, name: "Recovery Truck Sent", desc: "Truck dispatched on priority recovery loop", time: "Pending", done: false },
                    { num: 4, name: "Pickup Completed", desc: "Bins emptied & confirmed", time: "Pending", done: false }
                ]
            };

            saveReport(newRecord);
            formMissed.reset();
            showToast(`Missed Pickup Ticket Generated: ${ticketId}`, "success");
            renderTrackingView(ticketId);
            document.getElementById("track").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    }

    // Form: Bin Issue Report
    const formBin = document.getElementById("formBinIssue");
    if (formBin) {
        formBin.addEventListener("submit", e => {
            e.preventDefault();
            const prob = document.getElementById("binIssueType").value;
            const loc = document.getElementById("binLocation").value;
            const ticketId = `ECO-2026-BN-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: "Bin Issue",
                title: prob,
                location: loc,
                submittedAt: "Just now",
                resolvedAt: "Expected within 24-48 hours",
                status: "In Progress",
                currentStep: 2,
                steps: [
                    { num: 1, name: "Report Logged", desc: `Issue reported: ${prob}`, time: "Just now", done: true },
                    { num: 2, name: "Replacement Order", desc: "Work order created for municipal bin maintenance", time: "Pending", done: true },
                    { num: 3, name: "En Route for Delivery", desc: "Delivery truck loaded with new receptacle", time: "Pending", done: false },
                    { num: 4, name: "Installation & Exchange", desc: "Exchange verified by crew", time: "Pending", done: false }
                ]
            };

            saveReport(newRecord);
            formBin.reset();
            showToast(`Bin Issue Ticket Generated: ${ticketId}`, "success");
            renderTrackingView(ticketId);
            document.getElementById("track").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    }

    // Form: General Issue
    const formGeneral = document.getElementById("formGeneralIssue");
    if (formGeneral) {
        formGeneral.addEventListener("submit", e => {
            e.preventDefault();
            const cat = document.getElementById("generalCategory").value;
            const loc = document.getElementById("generalLocation").value;
            const ticketId = `ECO-2026-ID-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: "General Dumping",
                title: cat,
                location: loc,
                submittedAt: "Just now",
                resolvedAt: "Inspector dispatch queued",
                status: "Dispatched",
                currentStep: 2,
                steps: [
                    { num: 1, name: "Report Logged", desc: `Citizen report: ${cat}`, time: "Just now", done: true },
                    { num: 2, name: "Officer Dispatched", desc: "Sanitation patrol unit assigned", time: "Pending", done: true },
                    { num: 3, name: "Clearing Crew", desc: "Heavy waste machinery en route", time: "Pending", done: false },
                    { num: 4, name: "Site Cleared", desc: "Sanitized and certified clean", time: "Pending", done: false }
                ]
            };

            saveReport(newRecord);
            formGeneral.reset();
            showToast(`Environmental Ticket Logged: ${ticketId}`, "success");
            renderTrackingView(ticketId);
            document.getElementById("track").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    }

    // Quick Modal Report Form
    const reportIssueForm = document.getElementById("reportIssueForm");
    if (reportIssueForm) {
        reportIssueForm.addEventListener("submit", e => {
            e.preventDefault();
            const cat = document.getElementById("quickCategory").value;
            const loc = document.getElementById("quickLocation").value;
            const ticketId = `ECO-2026-QR-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: cat,
                title: `Citizen Report: ${cat}`,
                location: loc,
                submittedAt: "Just now",
                resolvedAt: "Active triage in progress",
                status: "Triaged",
                currentStep: 2,
                steps: [
                    { num: 1, name: "Report Logged", desc: "Citizen submission recorded via portal", time: "Just now", done: true },
                    { num: 2, name: "Triaged & Approved", desc: "Municipal dispatch assigned crew", time: "Pending", done: true },
                    { num: 3, name: "Truck En Route", desc: "Sanitation vehicle dispatched", time: "Pending", done: false },
                    { num: 4, name: "Resolved", desc: "Work order closed", time: "Pending", done: false }
                ]
            };

            saveReport(newRecord);
            reportIssueForm.reset();
            closeModal();
            showToast(`Report logged! Reference: ${ticketId}`, "success");
            renderTrackingView(ticketId);
        });
    }

    function saveReport(record) {
        try {
            const saved = JSON.parse(localStorage.getItem("ecotrack_tickets") || "{}");
            saved[record.id] = record;
            localStorage.setItem("ecotrack_tickets", JSON.stringify(saved));
        } catch (e) {
            console.error(e);
        }
    }

    // -------------------------------------------------------------
    // 9. Status & Tracking Stepper View
    // -------------------------------------------------------------
    const pageTrackerForm = document.getElementById("pageTrackerForm");
    const pageTrackingInput = document.getElementById("pageTrackingInput");
    const pageTrackingResult = document.getElementById("pageTrackingResult");

    function renderTrackingView(ticketId) {
        if (!pageTrackingResult) return;
        const normalizedId = ticketId.trim().toUpperCase();

        let stored = {};
        try {
            stored = JSON.parse(localStorage.getItem("ecotrack_tickets") || "{}");
        } catch (e) {}

        const ticket = stored[normalizedId] || SAMPLE_REPORTS[normalizedId];

        if (pageTrackingInput) pageTrackingInput.value = normalizedId;

        if (!ticket) {
            pageTrackingResult.innerHTML = `
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1.5rem; border-radius: var(--radius-sm); color: #991b1b;">
                    <strong><i class="fa-solid fa-circle-exclamation"></i> Ticket ID "${normalizedId}" not found.</strong>
                    <p style="font-size: 0.85rem; margin-top: 0.35rem; color: #7f1d1d;">
                        Please verify your tracking code or select one of the sample tickets above.
                    </p>
                </div>
            `;
            return;
        }

        const isResolved = ticket.status.toLowerCase().includes("resolved");
        const statusClass = isResolved ? "status-active" : "status-pill";

        let stepperHtml = `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 1.75rem; box-shadow: 0 4px 14px rgba(15,23,42,0.06);">
                <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
                    <div>
                        <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-light); letter-spacing: 0.05em; text-transform: uppercase;">
                            ${ticket.category} • REF #${ticket.id}
                        </span>
                        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--primary-dark); margin-top: 0.2rem;">
                            ${ticket.title}
                        </h3>
                        <p style="font-size: 0.85rem; color: var(--text-light); margin: 0;">
                            <i class="fa-solid fa-location-dot"></i> ${ticket.location} • Submitted: ${ticket.submittedAt}
                        </p>
                    </div>
                    <div>
                        <span class="status-pill ${isResolved ? "status-done" : "status-active"}" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;">
                            ${isResolved ? '<i class="fa-solid fa-check"></i> ' : '<span class="pulse-dot"></span> '}
                            ${ticket.status}
                        </span>
                    </div>
                </div>

                <!-- Stepper Progress Bar -->
                <div class="stepper-container">
        `;

        ticket.steps.forEach(step => {
            const isCompleted = step.done;
            const isCurrent = step.num === ticket.currentStep;
            const stateClass = isCompleted ? "completed" : (isCurrent ? "active" : "");

            stepperHtml += `
                <div class="stepper-item ${stateClass}">
                    <div class="stepper-circle">
                        ${isCompleted ? '<i class="fa-solid fa-check"></i>' : step.num}
                    </div>
                    <span class="stepper-title">${step.name}</span>
                    <span class="stepper-subtitle">${step.desc}</span>
                </div>
            `;
        });

        stepperHtml += `
                </div>

                <div style="background: #f8fafc; border-radius: var(--radius-sm); padding: 0.95rem 1.25rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                    <span><strong>Resolution Target:</strong> ${ticket.resolvedAt}</span>
                    <span style="color: var(--primary); font-weight: 600;"><i class="fa-solid fa-shield-check"></i> Municipal SLA Active</span>
                </div>
            </div>
        `;

        pageTrackingResult.innerHTML = stepperHtml;
    }

    if (pageTrackerForm) {
        pageTrackerForm.addEventListener("submit", e => {
            e.preventDefault();
            const val = pageTrackingInput.value;
            renderTrackingView(val);
        });
    }

    document.querySelectorAll(".demo-ticket-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            const id = pill.getAttribute("data-id");
            renderTrackingView(id);
        });
    });

    // -------------------------------------------------------------
    // 10. Service Dashboard Live Ticker
    // -------------------------------------------------------------
    const btnRefreshDashboard = document.getElementById("btnRefreshDashboard");
    if (btnRefreshDashboard) {
        btnRefreshDashboard.addEventListener("click", () => {
            btnRefreshDashboard.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
            setTimeout(() => {
                const kpi = document.getElementById("kpiRouteCompletion");
                if (kpi) kpi.textContent = "84%";
                btnRefreshDashboard.innerHTML = '<i class="fa-solid fa-rotate"></i> Live Refresh';
                showToast("Municipal operations data synchronized with fleet telemetry.", "success");
            }, 600);
        });
    }

    // -------------------------------------------------------------
    // 11. CMS Bridge & Figma Design Tokens Export
    // -------------------------------------------------------------
    window.EcoTrackDesignTokens = {
        name: "EcoTrack Design System Tokens (Figma / UiChemy)",
        version: "2.1.0",
        colors: {
            primary: "#176b45",
            primaryDark: "#104d32",
            primaryLight: "#e8f4ec",
            accent: "#b9e76b",
            background: "#fbfcf8",
            surface: "#ffffff",
            text: "#18372a",
            textMuted: "#718078",
            border: "#e7ece6",
            statusOrganic: "#10b981",
            statusRecyclable: "#3b82f6",
            statusHazardous: "#f59e0b"
        },
        typography: {
            fontHeading: "Manrope, sans-serif",
            fontBody: "DM Sans, sans-serif",
            fontUi: "Inter, sans-serif"
        },
        radii: {
            sm: "10px",
            md: "18px",
            lg: "28px",
            pill: "9999px"
        }
    };

    window.EcoTrackCMS = {
        getZones: () => ZONES,
        getReports: () => JSON.parse(localStorage.getItem("ecotrack_tickets") || "{}"),
        submitExternalReport: (report) => saveReport(report)
    };

    const btnExportTokens = document.getElementById("btnExportDesignTokens");
    if (btnExportTokens) {
        btnExportTokens.addEventListener("click", e => {
            e.preventDefault();
            const blob = new Blob([JSON.stringify(window.EcoTrackDesignTokens, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ecotrack-figma-tokens.json";
            a.click();
            showToast("Exported Figma Design Tokens (ecotrack-figma-tokens.json)", "success");
        });
    }

    const btnExportCMS = document.getElementById("btnExportCMSConfig");
    if (btnExportCMS) {
        btnExportCMS.addEventListener("click", e => {
            e.preventDefault();
            const cmsConfig = {
                endpoint: "https://api.ecotrack.local/v1",
                bridgeVersion: "UiChemy-CMS-Bridge-1.0",
                zones: ZONES
            };
            const blob = new Blob([JSON.stringify(cmsConfig, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ecotrack-cms-bridge.json";
            a.click();
            showToast("Exported UiChemy / CMS Bridge Configuration", "success");
        });
    }

    // -------------------------------------------------------------
    // 12. Animated Counters & Mobile Navigation
    // -------------------------------------------------------------
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });

        navLinks.querySelectorAll("a").forEach(a => {
            a.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }

    const counters = document.querySelectorAll("[data-count]");
    if ("IntersectionObserver" in window && counters.length > 0) {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = Number(counter.dataset.count);
                    if (prefersReducedMotion) {
                        counter.textContent = target.toLocaleString("en-IN");
                        obs.unobserve(counter);
                        return;
                    }
                    let start = null;
                    const duration = 1400;
                    function step(t) {
                        if (!start) start = t;
                        const p = Math.min((t - start) / duration, 1);
                        counter.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString("en-IN");
                        if (p < 1) requestAnimationFrame(step);
                        else counter.textContent = target.toLocaleString("en-IN");
                    }
                    requestAnimationFrame(step);
                    obs.unobserve(counter);
                }
            });
        }, { threshold: 0.4 });
        counters.forEach(c => obs.observe(c));
    }

    // Initial Boots
    updateActiveZone(AppState.currentZone);
    renderTrackingView("ECO-2026-MP-101");

    console.log(
        "%cEcoTrack Local Waste Coordination App initialized with v0 UI & CMS Bridge!",
        "color: #176b45; font-size: 14px; font-weight: bold;"
    );
});
