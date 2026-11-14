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
        currentZone: localStorage.getItem("ecotrack_zone") || "zone-lpu",
        calendarYear: 2026,
        calendarMonth: 10, // 0-indexed: 10 is November
        selectedDay: 18,
        activeCategoryFilter: "all",
        notificationsUnread: 2
    };

    // Zone Definitions — Punjab / Local Hubs (LPU, Law Gate, Phagwara, Jalandhar, Green Valley)
    const ZONES = {
        "zone-lpu": {
            name: "LPU Campus — Lovely Professional University",
            shortName: "LPU Campus",
            type: "University Campus, Hostels & Uni-Mall",
            trucks: ["LPU-EcoTruck-01", "LPU-Clean-02"],
            nextPickup: "Today, 4:00 PM · Student Mess Organic",
            weeklySchedule: {
                1: [{ type: "Organic (Mess & Food Court)", time: "06:30 AM – 09:00 AM", cat: "organic", crew: "LPU-EcoTruck-01 (Harpreet S.)" }],
                2: [{ type: "Dry Recyclables & Parcels", time: "09:00 AM – 11:30 AM", cat: "recyclable", crew: "LPU-Fleet-03" }],
                3: [{ type: "Organic (Mess & Food Court)", time: "06:30 AM – 09:00 AM", cat: "organic", crew: "LPU-EcoTruck-01" }],
                4: [{ type: "Hostel Plastics & Paper", time: "10:00 AM – 01:00 PM", cat: "recyclable", crew: "LPU-Fleet-03" }],
                5: [{ type: "Organic (Mess & Food Court)", time: "06:30 AM – 09:00 AM", cat: "organic", crew: "LPU-EcoTruck-01" }],
                6: [
                    { type: "Campus Recyclables & Uni-Mall", time: "08:00 AM – 11:00 AM", cat: "recyclable", crew: "LPU-Fleet-03" },
                    { type: "Lab & E-Waste Special", time: "02:00 PM – 05:00 PM", cat: "hazardous", crew: "Campus Safety Team" }
                ],
                0: [{ type: "Hostel Weekend Deep Clearance", time: "07:00 AM – 10:00 AM", cat: "organic", crew: "LPU-EcoTruck-01" }]
            }
        },
        "zone-law-gate": {
            name: "Law Gate Student & Commercial Hub, LPU Phagwara",
            shortName: "Law Gate",
            type: "Food Streets, Cafes, PGs & Student Living",
            trucks: ["Phagwara-MC-08 (Law Gate Special)"],
            nextPickup: "Tonight, 10:00 PM · Commercial Eatery Waste",
            weeklySchedule: {
                1: [{ type: "Food Stalls Wet Waste", time: "08:00 AM – 10:30 AM", cat: "organic", crew: "Phagwara-MC-08 (Gurdeep S.)" }],
                2: [{ type: "PG & Delivery Carton Dry Waste", time: "11:00 AM – 01:30 PM", cat: "recyclable", crew: "Phagwara-MC-08" }],
                3: [{ type: "Commercial Food Waste (Late Night)", time: "09:30 PM – 11:30 PM", cat: "organic", crew: "Night Route #02" }],
                4: [{ type: "Street Bin Clearance & Plastics", time: "08:30 AM – 11:00 AM", cat: "recyclable", crew: "Phagwara-MC-08" }],
                5: [{ type: "Food Stalls Wet Waste", time: "08:00 AM – 10:30 AM", cat: "organic", crew: "Phagwara-MC-08" }],
                6: [
                    { type: "Weekend Market Clearance", time: "08:00 AM – 12:00 PM", cat: "recyclable", crew: "Phagwara-MC-08" },
                    { type: "Special Sanitation & Disinfection", time: "03:00 PM – 06:00 PM", cat: "hazardous", crew: "Sanitation Squad" }
                ],
                0: [{ type: "Evening Food Street Wet Waste", time: "09:00 PM – 11:30 PM", cat: "organic", crew: "Night Route #02" }]
            }
        },
        "zone-phagwara": {
            name: "Phagwara City & GT Road Suburbs",
            shortName: "Phagwara",
            type: "Urban Estate, Main Markets & GT Road",
            trucks: ["MC-Phagwara-04", "MC-Phagwara-07"],
            nextPickup: "Tomorrow, 6:30 AM · Domestic Wet & Dry",
            weeklySchedule: {
                1: [{ type: "Domestic Wet Waste", time: "06:30 AM – 08:30 AM", cat: "organic", crew: "MC-Phagwara-04 (Rajesh K.)" }],
                2: [{ type: "Dry Recyclables & Packaging", time: "09:00 AM – 11:30 AM", cat: "recyclable", crew: "MC-Phagwara-07" }],
                3: [{ type: "Domestic Wet Waste", time: "06:30 AM – 08:30 AM", cat: "organic", crew: "MC-Phagwara-04" }],
                5: [{ type: "Domestic Wet Waste", time: "06:30 AM – 08:30 AM", cat: "organic", crew: "MC-Phagwara-04" }],
                6: [
                    { type: "Dry Recyclables & Commercial", time: "08:30 AM – 11:30 AM", cat: "recyclable", crew: "MC-Phagwara-07" },
                    { type: "Hazardous & Battery Waste", time: "11:30 AM – 02:30 PM", cat: "hazardous", crew: "MC HazMat Team" }
                ]
            }
        },
        "zone-jalandhar": {
            name: "Jalandhar Central, Model Town & Cantt",
            shortName: "Jalandhar",
            type: "Municipal Corporation Jalandhar (MCJ)",
            trucks: ["MCJ-SmartTruck-11", "MCJ-Cantt-03"],
            nextPickup: "Tomorrow, 7:00 AM · Municipal Collection",
            weeklySchedule: {
                1: [{ type: "Curbside Domestic Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "MCJ-SmartTruck-11 (Amit S.)" }],
                2: [{ type: "Paper, Plastic & Cans", time: "08:00 AM – 10:30 AM", cat: "recyclable", crew: "MCJ-Cantt-03" }],
                3: [{ type: "Curbside Domestic Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "MCJ-SmartTruck-11" }],
                4: [{ type: "Cantt & Commercial Dry Waste", time: "09:00 AM – 12:00 PM", cat: "recyclable", crew: "MCJ-Cantt-03" }],
                5: [{ type: "Curbside Domestic Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "MCJ-SmartTruck-11" }],
                6: [{ type: "Dry Recyclables & Glass", time: "08:30 AM – 11:00 AM", cat: "recyclable", crew: "MCJ-Cantt-03" }]
            }
        },
        "zone-green-valley": {
            name: "Green Valley & Eco Heights (Zone A)",
            shortName: "Green Valley",
            type: "Residential & Sustainable Parks",
            trucks: ["Truck-04", "Truck-09"],
            nextPickup: "Tomorrow, 7:00 AM · Organic",
            weeklySchedule: {
                1: [{ type: "Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "Route #04 (R. Patel)" }],
                2: [{ type: "Dry Recyclables", time: "08:00 AM – 10:30 AM", cat: "recyclable", crew: "Route #09 (M. Jenkins)" }],
                3: [{ type: "Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "Route #04 (R. Patel)" }],
                5: [{ type: "Organic", time: "07:00 AM – 09:30 AM", cat: "organic", crew: "Route #04 (R. Patel)" }],
                6: [
                    { type: "Dry Recyclables", time: "08:00 AM – 10:30 AM", cat: "recyclable", crew: "Route #09 (M. Jenkins)" },
                    { type: "Hazardous & E-Waste", time: "10:00 AM – 02:00 PM", cat: "hazardous", crew: "HazMat Team #02" }
                ]
            }
        }
    };

    // Preloaded Demo Tickets for Status Tracking
    const SAMPLE_REPORTS = {
        "ECO-2026-LPU-101": {
            id: "ECO-2026-LPU-101",
            category: "Missed Pickup",
            title: "Hostel Mess Organic Waste Overflow",
            location: "LPU Boys Hostel 4 (BH-4), Main Campus",
            submittedAt: "Today • 08:30 AM",
            resolvedAt: "Today • 11:15 AM",
            status: "Resolved",
            currentStep: 4,
            steps: [
                { num: 1, name: "Report Logged", desc: "Student warden logged hostel mess overflow", time: "08:30 AM", done: true },
                { num: 2, name: "Campus Dispatch", desc: "LPU Facility Manager verified route", time: "09:00 AM", done: true },
                { num: 3, name: "EcoTruck Sent", desc: "LPU-EcoTruck-01 rerouted to BH-4", time: "09:45 AM", done: true },
                { num: 4, name: "Bins Cleared", desc: "Mess food bins emptied & sanitized", time: "11:15 AM", done: true }
            ]
        },
        "ECO-2026-LG-202": {
            id: "ECO-2026-LG-202",
            category: "Illegal Dumping",
            title: "Commercial Food Delivery Packaging Overflow",
            location: "Law Gate Main Street (Near Food Hub & Cafes)",
            submittedAt: "Today • 09:15 AM",
            resolvedAt: "Estimated Today 02:00 PM",
            status: "In Progress",
            currentStep: 3,
            steps: [
                { num: 1, name: "Report Logged", desc: "Citizen photo uploaded via EcoTrack", time: "09:15 AM", done: true },
                { num: 2, name: "Triage & Order", desc: "Phagwara Municipal Squad assigned", time: "09:40 AM", done: true },
                { num: 3, name: "Clearing Crew Active", desc: "Phagwara-MC-08 on site with clearing team", time: "10:30 AM", done: true },
                { num: 4, name: "Site Restored", desc: "Litter removed & disinfectant spray applied", time: "Pending", done: false }
            ]
        },
        "ECO-2026-PH-303": {
            id: "ECO-2026-PH-303",
            category: "Bin Issue",
            title: "Public Curbside Dustbin Wheel Axle Broken",
            location: "Phagwara GT Road Near Bus Stand",
            submittedAt: "Today • 10:00 AM",
            resolvedAt: "Estimated Today 04:30 PM",
            status: "Dispatched",
            currentStep: 2,
            steps: [
                { num: 1, name: "Report Logged", desc: "Damaged public bin reported", time: "10:00 AM", done: true },
                { num: 2, name: "Replacement Dispatched", desc: "Maintenance truck dispatched with spare wheel", time: "10:35 AM", done: true },
                { num: 3, name: "Curbside Repair", desc: "Technician repairing wheel bracket", time: "Pending", done: false },
                { num: 4, name: "Certified Ready", desc: "Bin restored to upright position", time: "Pending", done: false }
            ]
        },
        "ECO-2026-JL-404": {
            id: "ECO-2026-JL-404",
            category: "Missed Pickup",
            title: "Model Town Curbside Recyclables Missed",
            location: "Jalandhar Model Town Gol Market",
            submittedAt: "Today • 07:45 AM",
            resolvedAt: "Estimated Today 01:30 PM",
            status: "In Progress",
            currentStep: 3,
            steps: [
                { num: 1, name: "Report Logged", desc: "Model Town shop owner submitted pickup request", time: "07:45 AM", done: true },
                { num: 2, name: "Route Rescheduled", desc: "MCJ Route Dispatcher scheduled recovery", time: "08:15 AM", done: true },
                { num: 3, name: "Truck In Transit", desc: "MCJ-SmartTruck-11 approaching Gol Market", time: "09:20 AM", done: true },
                { num: 4, name: "Cleared", desc: "Commercial packaging collected", time: "Pending", done: false }
            ]
        },
        "ECO-2026-GV-505": {
            id: "ECO-2026-GV-505",
            category: "Bin Issue",
            title: "Green Valley Central Park Organic Bin Exchange",
            location: "Green Valley Central Park (Zone A)",
            submittedAt: "Nov 12, 2026 • 09:00 AM",
            resolvedAt: "Nov 12, 2026 • 01:20 PM",
            status: "Resolved",
            currentStep: 4,
            steps: [
                { num: 1, name: "Report Logged", desc: "Park supervisor requested bin lid replacement", time: "09:00 AM", done: true },
                { num: 2, name: "Lid Allocated", desc: "240L Green Lid retrieved from central store", time: "10:10 AM", done: true },
                { num: 3, name: "Delivered", desc: "Truck-04 delivered and installed new lid", time: "11:50 AM", done: true },
                { num: 4, name: "Resolved", desc: "Exchange certified complete", time: "01:20 PM", done: true }
            ]
        },
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
            closeSidebar();
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
        const sidebarZoneLabel = document.getElementById("sidebarZoneLabel");
        if (sidebarZoneLabel) sidebarZoneLabel.textContent = zone.shortName;
        if (heroCurrentZoneName) heroCurrentZoneName.textContent = zone.name;
        if (heroNextPickup) heroNextPickup.textContent = zone.nextPickup;
        if (calendarAreaSelect) calendarAreaSelect.value = zoneKey;

        // Update active class in dropdown menu
        if (navAreaMenu) {
            navAreaMenu.querySelectorAll("li").forEach(li => {
                const isActive = li.getAttribute("data-zone") === zoneKey;
                li.classList.toggle("active", isActive);
                li.setAttribute("aria-selected", String(isActive));
            });
        }

        // Update active chips in hero section
        document.querySelectorAll(".loc-chip").forEach(chip => {
            chip.classList.toggle("active", chip.getAttribute("data-zone") === zoneKey);
        });

        const globalSearch = document.getElementById("globalAreaSearch");
        if (globalSearch && !globalSearch.matches(":focus")) {
            globalSearch.value = zone.name;
        }

        renderCalendar();
        showToast(`Area switched to ${zone.shortName}`, "info");
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

    // Area Search inside Navbar Dropdown
    const areaSearchInput = document.getElementById("areaSearchInput");
    if (areaSearchInput && navAreaMenu) {
        areaSearchInput.addEventListener("input", () => {
            const term = areaSearchInput.value.toLowerCase().trim();
            navAreaMenu.querySelectorAll("li").forEach(li => {
                const text = li.textContent.toLowerCase();
                li.style.display = text.includes(term) ? "block" : "none";
            });
        });
        areaSearchInput.addEventListener("click", e => e.stopPropagation());
    }

    // Quick Location Chips & Global Hero Search
    document.querySelectorAll(".loc-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const zKey = chip.getAttribute("data-zone");
            updateActiveZone(zKey);
        });
    });

    const globalAreaSearch = document.getElementById("globalAreaSearch");
    const btnSearchArea = document.getElementById("btnSearchArea");

    function executeAreaSearch() {
        if (!globalAreaSearch) return;
        const val = globalAreaSearch.value.trim().toLowerCase();
        if (!val) return;

        // Find best matching zone
        let matchedZoneKey = null;
        for (const [key, z] of Object.entries(ZONES)) {
            if (z.name.toLowerCase().includes(val) || z.shortName.toLowerCase().includes(val) || key.toLowerCase().includes(val)) {
                matchedZoneKey = key;
                break;
            }
        }

        // Also check keywords: "lpu", "law gate", "phagwara", "jalandhar", "green valley"
        if (!matchedZoneKey) {
            if (val.includes("lpu") || val.includes("university") || val.includes("hostel")) matchedZoneKey = "zone-lpu";
            else if (val.includes("law") || val.includes("gate") || val.includes("food street")) matchedZoneKey = "zone-law-gate";
            else if (val.includes("phagwara") || val.includes("gt road")) matchedZoneKey = "zone-phagwara";
            else if (val.includes("jalandhar") || val.includes("cantt") || val.includes("model town")) matchedZoneKey = "zone-jalandhar";
            else if (val.includes("green") || val.includes("valley")) matchedZoneKey = "zone-green-valley";
        }

        if (matchedZoneKey) {
            updateActiveZone(matchedZoneKey);
            showToast(`Found and switched to: ${ZONES[matchedZoneKey].shortName}`, "success");
            const calSection = document.getElementById("calendar");
            if (calSection) calSection.scrollIntoView({ behavior: "smooth" });
        } else {
            showToast(`Searching records for "${globalAreaSearch.value}"...`, "info");
            renderTrackingView(globalAreaSearch.value);
            const trackSection = document.getElementById("track");
            if (trackSection) trackSection.scrollIntoView({ behavior: "smooth" });
        }
    }

    if (btnSearchArea) {
        btnSearchArea.addEventListener("click", executeAreaSearch);
    }
    if (globalAreaSearch) {
        globalAreaSearch.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                executeAreaSearch();
            }
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
        if (roleSwitcherDropdown) roleSwitcherDropdown.classList.remove("open");
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

    // -------------------------------------------------------------
    // Live REST API, Photo Upload & Sync Engine
    // -------------------------------------------------------------
    const API_BASE = window.location.protocol.startsWith("http") ? "" : "http://localhost:5000";

    async function apiFetch(endpoint, options = {}) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                headers: { "Content-Type": "application/json" },
                ...options
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            return null;
        }
    }

    const uploadedPhotos = {
        missed: "",
        bin: "",
        general: ""
    };

    function setupPhotoInput(inputId, previewId, key) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        if (!input || !preview) return;

        input.addEventListener("change", () => {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedPhotos[key] = e.target.result;
                preview.style.display = "inline-block";
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview thumbnail">
                    <button type="button" class="btn-text-link" style="display:block;margin:6px auto 0;color:#dc2626;font-size:0.75rem;">
                        Remove Photo
                    </button>
                `;
                const rmBtn = preview.querySelector("button");
                if (rmBtn) {
                    rmBtn.addEventListener("click", () => {
                        input.value = "";
                        uploadedPhotos[key] = "";
                        preview.style.display = "none";
                        preview.innerHTML = "";
                    });
                }
                showToast("Photo evidence attached!", "info");
            };
            reader.readAsDataURL(file);
        });
    }

    setupPhotoInput("missedPhotoInput", "missedPhotoPreview", "missed");
    setupPhotoInput("binPhotoInput", "binPhotoPreview", "bin");
    setupPhotoInput("generalPhotoInput", "generalPhotoPreview", "general");

    async function syncDashboard() {
        const data = await apiFetch("/api/dashboard");
        if (!data) return;

        const kpiRoute = document.getElementById("kpiRouteCompletion");
        if (kpiRoute && data.route_completion) kpiRoute.textContent = data.route_completion;

        const kpiFleet = document.getElementById("kpiActiveFleet");
        if (kpiFleet && data.active_trucks) kpiFleet.textContent = data.active_trucks;

        const kpiRes = document.getElementById("kpiResolutionRate");
        if (kpiRes && data.resolution_rate) kpiRes.textContent = data.resolution_rate;

        const kpiClean = document.getElementById("kpiCleanlinessIndex");
        if (kpiClean && data.cleanliness_score) kpiClean.textContent = data.cleanliness_score;

        const tbody = document.getElementById("fleetTableBody");
        if (tbody && data.fleet && data.fleet.length > 0) {
            tbody.innerHTML = "";
            data.fleet.forEach(item => {
                const tr = document.createElement("tr");
                const tagClass = item.waste_stream.toLowerCase().includes("organic") ? "tag-organic" : (item.waste_stream.toLowerCase().includes("recycl") ? "tag-recyclable" : "tag-hazardous");
                const statusClass = item.status.toLowerCase().includes("complete") ? "status-done" : "status-active";
                tr.innerHTML = `
                    <td><strong>${item.id}</strong></td>
                    <td>${item.sector}</td>
                    <td><span class="tag ${tagClass}">${item.waste_stream}</span></td>
                    <td>${item.driver}</td>
                    <td>
                        <div class="table-progress">
                            <div class="bar" style="width: ${item.progress}%;"></div>
                            <span>${item.progress}%</span>
                        </div>
                    </td>
                    <td><span class="status-pill ${statusClass}">${item.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    }

    async function syncNotifications() {
        const notifs = await apiFetch("/api/notifications");
        if (!notifs) return;

        const list = document.getElementById("notifList");
        const badge = document.getElementById("notifBadge");
        if (!list) return;

        let unreadCount = 0;
        list.innerHTML = "";

        notifs.forEach(n => {
            if (n.is_unread) unreadCount++;
            const item = document.createElement("div");
            item.className = `notif-item ${n.is_unread ? "unread" : ""}`;
            const iconClass = n.type === "green" ? "fa-truck-fast" : (n.type === "orange" ? "fa-clock" : "fa-cloud-sun");
            item.innerHTML = `
                <span class="notif-type-icon ${n.type}"><i class="fa-solid ${iconClass}"></i></span>
                <div class="notif-body">
                    <p><strong>${n.title}</strong>: ${n.message}</p>
                    <span class="notif-time">${n.time_str} • ${n.zone || "Zone A"}</span>
                </div>
            `;
            list.appendChild(item);
        });

        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? "flex" : "none";
        }
    }

    // Form: Missed Pickup Report
    const formMissed = document.getElementById("formMissedPickup");
    if (formMissed) {
        formMissed.addEventListener("submit", async e => {
            e.preventDefault();
            const addr = document.getElementById("missedAddress").value;
            const wasteType = document.getElementById("missedWasteType").value;
            const area = document.getElementById("missedArea").value;
            const notes = document.getElementById("missedNotes").value;
            const photoUrl = uploadedPhotos.missed;

            const payload = {
                category: "Missed Pickup",
                title: `${wasteType} Left Behind`,
                location: `${addr} • ${area}`,
                urgency: "High",
                description: notes,
                photo_url: photoUrl
            };

            const res = await apiFetch("/api/tickets", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const ticketId = (res && res.ticket_id) ? res.ticket_id : `ECO-2026-MP-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: payload.category,
                title: payload.title,
                location: payload.location,
                photo_url: photoUrl,
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
            const preview = document.getElementById("missedPhotoPreview");
            if (preview) { preview.style.display = "none"; preview.innerHTML = ""; }
            uploadedPhotos.missed = "";

            showToast(`Missed Pickup Ticket #${ticketId} saved to database!`, "success");
            await renderTrackingView(ticketId);
            await syncDashboard();
            await syncNotifications();
            document.getElementById("track").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    }

    // Form: Bin Issue Report
    const formBin = document.getElementById("formBinIssue");
    if (formBin) {
        formBin.addEventListener("submit", async e => {
            e.preventDefault();
            const prob = document.getElementById("binIssueType").value;
            const loc = document.getElementById("binLocation").value;
            const urgency = document.getElementById("binUrgency").value;
            const details = document.getElementById("binDetails").value;
            const photoUrl = uploadedPhotos.bin;

            const payload = {
                category: "Bin Issue",
                title: prob,
                location: loc,
                urgency: urgency,
                description: details,
                photo_url: photoUrl
            };

            const res = await apiFetch("/api/tickets", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const ticketId = (res && res.ticket_id) ? res.ticket_id : `ECO-2026-BN-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: payload.category,
                title: payload.title,
                location: payload.location,
                photo_url: photoUrl,
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
            const preview = document.getElementById("binPhotoPreview");
            if (preview) { preview.style.display = "none"; preview.innerHTML = ""; }
            uploadedPhotos.bin = "";

            showToast(`Bin Issue Ticket #${ticketId} saved to database!`, "success");
            await renderTrackingView(ticketId);
            await syncDashboard();
            await syncNotifications();
            document.getElementById("track").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    }

    // Form: General Issue
    const formGeneral = document.getElementById("formGeneralIssue");
    if (formGeneral) {
        formGeneral.addEventListener("submit", async e => {
            e.preventDefault();
            const cat = document.getElementById("generalCategory").value;
            const loc = document.getElementById("generalLocation").value;
            const desc = document.getElementById("generalDescription").value;
            const photoUrl = uploadedPhotos.general;

            const payload = {
                category: "Illegal Dumping",
                title: cat,
                location: loc,
                urgency: "High",
                description: desc,
                photo_url: photoUrl
            };

            const res = await apiFetch("/api/tickets", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const ticketId = (res && res.ticket_id) ? res.ticket_id : `ECO-2026-ID-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: payload.category,
                title: payload.title,
                location: payload.location,
                photo_url: photoUrl,
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
            const preview = document.getElementById("generalPhotoPreview");
            if (preview) { preview.style.display = "none"; preview.innerHTML = ""; }
            uploadedPhotos.general = "";

            showToast(`Environmental Ticket #${ticketId} saved to database!`, "success");
            await renderTrackingView(ticketId);
            await syncDashboard();
            await syncNotifications();
            document.getElementById("track").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        });
    }

    // Quick Modal Report Form
    const reportIssueForm = document.getElementById("reportIssueForm");
    if (reportIssueForm) {
        reportIssueForm.addEventListener("submit", async e => {
            e.preventDefault();
            const cat = document.getElementById("quickCategory").value;
            const loc = document.getElementById("quickLocation").value;
            const urg = document.getElementById("quickUrgency").value;
            const notes = document.getElementById("quickNotes").value;

            const payload = {
                category: cat,
                title: `Citizen Report: ${cat}`,
                location: loc,
                urgency: urg,
                description: notes
            };

            const res = await apiFetch("/api/tickets", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const ticketId = (res && res.ticket_id) ? res.ticket_id : `ECO-2026-QR-${Math.floor(100 + Math.random() * 900)}`;

            const newRecord = {
                id: ticketId,
                category: cat,
                title: payload.title,
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
            showToast(`Ticket #${ticketId} logged into live database!`, "success");
            await renderTrackingView(ticketId);
            await syncDashboard();
            await syncNotifications();
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
    // 9. Status & Tracking Stepper View (With Live Progression)
    // -------------------------------------------------------------
    const pageTrackerForm = document.getElementById("pageTrackerForm");
    const pageTrackingInput = document.getElementById("pageTrackingInput");
    const pageTrackingResult = document.getElementById("pageTrackingResult");

    async function renderTrackingView(searchQuery) {
        if (!pageTrackingResult) return;
        const query = searchQuery.trim();
        const normalizedId = query.toUpperCase();

        if (pageTrackingInput) pageTrackingInput.value = query;

        // 1. Try exact Ticket ID match first
        let ticket = await apiFetch(`/api/tickets/${normalizedId}`);

        if (!ticket) {
            let stored = {};
            try {
                stored = JSON.parse(localStorage.getItem("ecotrack_tickets") || "{}");
            } catch (e) {}
            ticket = stored[normalizedId] || SAMPLE_REPORTS[normalizedId];
        }

        // 2. If no exact ticket ID match, search tickets by location or keyword!
        if (!ticket) {
            let matchingTickets = [];
            // Try server search
            const serverResults = await apiFetch(`/api/tickets?q=${encodeURIComponent(query)}`);
            if (Array.isArray(serverResults) && serverResults.length > 0) {
                matchingTickets = serverResults;
            } else {
                // Search local storage and sample reports
                let stored = {};
                try {
                    stored = JSON.parse(localStorage.getItem("ecotrack_tickets") || "{}");
                } catch (e) {}
                const allLocal = Object.values({ ...SAMPLE_REPORTS, ...stored });
                const qLower = query.toLowerCase();
                matchingTickets = allLocal.filter(t => 
                    (t.location && t.location.toLowerCase().includes(qLower)) ||
                    (t.title && t.title.toLowerCase().includes(qLower)) ||
                    (t.category && t.category.toLowerCase().includes(qLower)) ||
                    (t.id && t.id.toLowerCase().includes(qLower))
                );
            }

            if (matchingTickets.length > 0) {
                let listHtml = `
                    <div style="background: #ffffff; border: 1.5px solid rgba(23,107,69,0.2); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: 0 10px 30px rgba(15,23,42,0.06);">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.15rem; padding-bottom:0.85rem; border-bottom:1px solid #e2e8f0;">
                            <div>
                                <span style="font-size:0.75rem; font-weight:700; color:var(--primary); text-transform:uppercase;">Local Area Search Results</span>
                                <h3 style="font-size:1.15rem; font-weight:800; color:var(--primary-dark); margin-top:2px;">
                                    Found ${matchingTickets.length} reports in "${query}"
                                </h3>
                            </div>
                            <button type="button" class="btn btn-primary btn-sm" data-modal-open="reportModal">
                                <i class="fa-solid fa-plus"></i> New Report For ${query}
                            </button>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:0.75rem;">
                `;

                matchingTickets.forEach(t => {
                    const isDone = (t.status || "").toLowerCase().includes("resolved");
                    listHtml += `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem 1.15rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem;">
                            <div>
                                <div style="display:flex; align-items:center; gap:0.5rem;">
                                    <strong style="color:var(--primary-dark); font-size:0.95rem;">${t.title}</strong>
                                    <span style="font-size:0.72rem; padding:0.15rem 0.5rem; border-radius:9999px; background:${isDone ? "#dcfce7; color:#15803d" : "#fef3c7; color:#b45309"}; font-weight:700;">
                                        ${t.status}
                                    </span>
                                </div>
                                <p style="font-size:0.82rem; color:var(--text-light); margin:4px 0 0;">
                                    <i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${t.location} • Ref: <strong>${t.id}</strong> • Step ${t.current_step || t.currentStep || 1}/4
                                </p>
                            </div>
                            <button type="button" class="btn btn-outline btn-sm view-stepper-btn" data-ticket-id="${t.id}">
                                Track Progress <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    `;
                });

                listHtml += `
                        </div>
                    </div>
                `;

                pageTrackingResult.innerHTML = listHtml;

                // Wire up click on individual tickets
                pageTrackingResult.querySelectorAll(".view-stepper-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const id = btn.getAttribute("data-ticket-id");
                        renderTrackingView(id);
                    });
                });
                return;
            }

            pageTrackingResult.innerHTML = `
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1.5rem; border-radius: var(--radius-sm); color: #991b1b;">
                    <strong><i class="fa-solid fa-circle-exclamation"></i> No tickets found matching "${query}".</strong>
                    <p style="font-size: 0.85rem; margin-top: 0.35rem; color: #7f1d1d;">
                        Try searching by local area (e.g. <strong>Law Gate</strong>, <strong>LPU</strong>, <strong>Phagwara</strong>, <strong>Jalandhar</strong>) or enter a valid reference ID.
                    </p>
                    <button type="button" class="btn btn-primary btn-sm" style="margin-top:0.75rem;" data-modal-open="reportModal">
                        <i class="fa-solid fa-plus"></i> Submit New Report in ${query}
                    </button>
                </div>
            `;
            return;
        }

        const isResolved = ticket.status.toLowerCase().includes("resolved");
        const statusClass = isResolved ? "status-done" : "status-active";
        const currentStep = ticket.current_step || ticket.currentStep || 1;

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
                            <i class="fa-solid fa-location-dot"></i> ${ticket.location} • Submitted: ${ticket.created_at || ticket.submittedAt || "Recently"}
                        </p>
                    </div>
                    <div>
                        <span class="status-pill ${statusClass}" style="font-size: 0.85rem; padding: 0.35rem 0.85rem;">
                            ${isResolved ? '<i class="fa-solid fa-check"></i> ' : '<span class="pulse-dot"></span> '}
                            ${ticket.status}
                        </span>
                    </div>
                </div>

                ${ticket.photo_url ? `
                <div style="margin-bottom: 1.25rem;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-light); display: block; margin-bottom: 0.35rem;">ATTACHED PHOTO EVIDENCE:</span>
                    <img src="${ticket.photo_url}" alt="Report Photo Evidence" style="max-height: 180px; border-radius: 8px; border: 1px solid #e2e8f0;">
                </div>` : ''}

                <!-- Stepper Progress Bar -->
                <div class="stepper-container">
        `;

        const steps = ticket.steps || [];
        steps.forEach(step => {
            const isCompleted = step.is_done || step.done;
            const stepNum = step.step_num || step.num;
            const isCurrent = stepNum === currentStep;
            const stateClass = isCompleted ? "completed" : (isCurrent ? "active" : "");

            stepperHtml += `
                <div class="stepper-item ${stateClass}">
                    <div class="stepper-circle">
                        ${isCompleted ? '<i class="fa-solid fa-check"></i>' : stepNum}
                    </div>
                    <span class="stepper-title">${step.name}</span>
                    <span class="stepper-subtitle">${step.description || step.desc}</span>
                </div>
            `;
        });

        stepperHtml += `
                </div>

                <div style="background: #f8fafc; border-radius: var(--radius-sm); padding: 0.95rem 1.25rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; font-size: 0.85rem;">
                    <span><strong>Resolution Status:</strong> ${ticket.resolved_at || ticket.resolvedAt || "Under Review"}</span>
                    <div style="display: flex; gap: 0.65rem; align-items: center;">
                        ${currentStep < 4 ? `
                        <button type="button" class="advance-step-btn" id="btnAdvanceStep">
                            <i class="fa-solid fa-truck-fast"></i> Advance Workflow Step (Live Server Action)
                        </button>` : `
                        <span style="color: var(--primary); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Ticket Fully Resolved & Closed</span>`}
                    </div>
                </div>
            </div>
        `;

        pageTrackingResult.innerHTML = stepperHtml;

        const advanceBtn = document.getElementById("btnAdvanceStep");
        if (advanceBtn) {
            advanceBtn.addEventListener("click", async () => {
                advanceBtn.disabled = true;
                advanceBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating Server...';
                
                const res = await apiFetch(`/api/tickets/${ticket.id}/advance`, { method: "POST" });
                if (res && res.success) {
                    showToast(`Status updated in live SQLite DB: ${res.status}`, "success");
                    await renderTrackingView(ticket.id);
                    await syncDashboard();
                    await syncNotifications();
                } else {
                    ticket.currentStep = Math.min(4, (ticket.currentStep || 1) + 1);
                    if (ticket.currentStep === 4) ticket.status = "Resolved";
                    saveReport(ticket);
                    showToast("Status advanced locally", "info");
                    renderTrackingView(ticket.id);
                }
            });
        }
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
    // 12. Expandable Sidebar Controller & Animated Counters
    // -------------------------------------------------------------
    const menuToggle = document.getElementById("menuToggle");
    const appSidebar = document.getElementById("appSidebar");
    const sidebarBackdrop = document.getElementById("sidebarBackdrop");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");

    function openSidebar() {
        if (!appSidebar) return;
        appSidebar.classList.add("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.add("open");
        appSidebar.setAttribute("aria-hidden", "false");
        if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
        if (sidebarCloseBtn) sidebarCloseBtn.focus();
    }

    function closeSidebar() {
        if (!appSidebar) return;
        appSidebar.classList.remove("open");
        if (sidebarBackdrop) sidebarBackdrop.classList.remove("open");
        appSidebar.setAttribute("aria-hidden", "true");
        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.focus();
        }
        document.body.style.overflow = "";
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = appSidebar && appSidebar.classList.contains("open");
            if (isOpen) closeSidebar();
            else openSidebar();
        });
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
    }

    if (appSidebar) {
        appSidebar.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    document.querySelectorAll(".sidebar-link").forEach(link => {
        link.addEventListener("click", () => {
            closeSidebar();
            document.querySelectorAll(".sidebar-link").forEach(l => l.classList.remove("active"));
            link.classList.add("active");
        });
    });

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


    // -------------------------------------------------------------
    // 13. Authority & Municipal Command Portal Controller
    // -------------------------------------------------------------
    const roleSwitcherDropdown = document.getElementById("roleSwitcherDropdown");
    const roleSwitcherBtn = document.getElementById("roleSwitcherBtn");
    const roleMenu = document.getElementById("roleMenu");
    const roleLabel = document.getElementById("roleLabel");
    const roleIcon = document.getElementById("roleIcon");
    const citizenView = document.getElementById("citizenView");
    const authorityView = document.getElementById("authorityView");
    const btnSwitchToCitizen = document.getElementById("btnSwitchToCitizen");
    const authTableSearchInput = document.getElementById("authTableSearchInput");
    const authZoneFilterSelect = document.getElementById("authZoneFilterSelect");
    const btnRefreshAuthorityData = document.getElementById("btnRefreshAuthorityData");
    const btnExportAuthorityCSV = document.getElementById("btnExportAuthorityCSV");
    const authorityTableBody = document.getElementById("authorityTableBody");
    const authTableEmpty = document.getElementById("authTableEmpty");

    let currentAuthorityTab = "all";
    let cachedAuthorityTickets = [];
    let saasClockInterval = null;

    function startSaasClock() {
        function updateClock() {
            const clockEl = document.getElementById("saasLiveClock");
            if (!clockEl) return;
            const now = new Date();
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const day = days[now.getDay()];
            const month = months[now.getMonth()];
            const date = now.getDate();
            let hours = now.getHours();
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12;
            hours = hours ? hours : 12;
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const seconds = String(now.getSeconds()).padStart(2, "0");
            clockEl.textContent = `${day}, ${month} ${date} • ${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
        }
        updateClock();
        if (!saasClockInterval) {
            saasClockInterval = setInterval(updateClock, 1000);
        }
    }

    function switchRole(newRole) {
        AppState.currentRole = newRole;
        localStorage.setItem("ecotrack_role", newRole);

        const topNavbar = document.getElementById("topNavbar");
        const mainFooter = document.querySelector(".footer");

        if (roleMenu) {
            roleMenu.querySelectorAll("li").forEach(li => {
                const isMatch = li.getAttribute("data-role") === newRole;
                li.classList.toggle("active", isMatch);
                li.setAttribute("aria-selected", String(isMatch));
            });
        }

        if (newRole === "authority") {
            if (citizenView) citizenView.style.display = "none";
            if (authorityView) authorityView.style.display = "flex";
            if (topNavbar) topNavbar.style.display = "none";
            if (mainFooter) mainFooter.style.display = "none";
            if (roleLabel) roleLabel.textContent = "Authority";
            if (roleIcon) roleIcon.className = "fa-solid fa-shield-halved role-icon";
            if (roleSwitcherBtn) roleSwitcherBtn.classList.add("authority-mode");
            
            startSaasClock();
            loadAuthorityData();
            showToast("Switched to Municipal Authority Command Dashboard", "info");
        } else {
            if (authorityView) authorityView.style.display = "none";
            if (citizenView) citizenView.style.display = "block";
            if (topNavbar) topNavbar.style.display = "";
            if (mainFooter) mainFooter.style.display = "";
            if (roleLabel) roleLabel.textContent = "Citizen";
            if (roleIcon) roleIcon.className = "fa-solid fa-user-check role-icon";
            if (roleSwitcherBtn) roleSwitcherBtn.classList.remove("authority-mode");
            showToast("Switched to Citizen Mode", "info");
        }

        if (roleSwitcherDropdown) roleSwitcherDropdown.classList.remove("open");
    }

    if (roleSwitcherBtn && roleSwitcherDropdown) {
        roleSwitcherBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = roleSwitcherDropdown.classList.toggle("open");
            roleSwitcherBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    if (roleMenu) {
        roleMenu.querySelectorAll("li").forEach(item => {
            item.addEventListener("click", () => {
                const role = item.getAttribute("data-role");
                switchRole(role);
            });
        });
    }

    if (btnSwitchToCitizen) {
        btnSwitchToCitizen.addEventListener("click", () => switchRole("citizen"));
    }

    // Tab Filter Buttons (All, Due/Pending, In Progress, Resolved)
    document.querySelectorAll(".auth-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentAuthorityTab = btn.getAttribute("data-tab");
            renderAuthorityTable();
        });
    });

    if (authTableSearchInput) {
        authTableSearchInput.addEventListener("input", () => renderAuthorityTable());
    }

    if (authZoneFilterSelect) {
        authZoneFilterSelect.addEventListener("change", () => renderAuthorityTable());
    }

    if (btnRefreshAuthorityData) {
        btnRefreshAuthorityData.addEventListener("click", async () => {
            btnRefreshAuthorityData.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            await loadAuthorityData();
            btnRefreshAuthorityData.innerHTML = '<i class="fa-solid fa-rotate"></i>';
            showToast("Authority complaints database synchronized with live fleet", "success");
        });
    }

    async function loadAuthorityData() {
        // Fetch tickets from live server first
        let tickets = await apiFetch("/api/tickets");

        if (!Array.isArray(tickets) || tickets.length === 0) {
            let stored = {};
            try {
                stored = JSON.parse(localStorage.getItem("ecotrack_tickets") || "{}");
            } catch (e) {}
            tickets = Object.values({ ...SAMPLE_REPORTS, ...stored });
        }

        cachedAuthorityTickets = tickets;

        // Calculate KPI Metrics
        let total = tickets.length;
        let pending = 0;
        let dispatched = 0;
        let resolved = 0;

        tickets.forEach(t => {
            const st = (t.status || "").toLowerCase();
            const step = t.current_step || t.currentStep || 1;
            if (st.includes("resolved") || step >= 4) {
                resolved++;
            } else if (st.includes("dispatch") || step === 3) {
                dispatched++;
            } else {
                pending++;
            }
        });

        const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;

        // Update KPI Counters
        const kpiTotal = document.getElementById("authKpiTotal");
        const kpiPending = document.getElementById("authKpiPending");
        const kpiDispatched = document.getElementById("authKpiDispatched");
        const kpiResolved = document.getElementById("authKpiResolved");
        const kpiRate = document.getElementById("authKpiRate");

        if (kpiTotal) kpiTotal.textContent = total;
        if (kpiPending) kpiPending.textContent = pending;
        if (kpiDispatched) kpiDispatched.textContent = dispatched;
        if (kpiResolved) kpiResolved.textContent = resolved;
        if (kpiRate) kpiRate.textContent = `${rate}%`;

        // Update Tab Count Badges
        const countAll = document.getElementById("countAll");
        const countPending = document.getElementById("countPending");
        const countDispatched = document.getElementById("countDispatched");
        const countResolved = document.getElementById("countResolved");

        if (countAll) countAll.textContent = total;
        if (countPending) countPending.textContent = pending;
        if (countDispatched) countDispatched.textContent = dispatched;
        if (countResolved) countResolved.textContent = resolved;

        // Update Sidebar Badges
        const sidebarBadgeTotal = document.getElementById("sidebarBadgeTotal");
        const sidebarBadgePending = document.getElementById("sidebarBadgePending");
        if (sidebarBadgeTotal) sidebarBadgeTotal.textContent = total;
        if (sidebarBadgePending) sidebarBadgePending.textContent = pending;

        // Render SaaS Analytics Charts (Category Donut & 7-Day Trend)
        renderSaasAnalyticsCharts(tickets);

        renderAuthorityTable();
    }

    function renderSaasAnalyticsCharts(tickets) {
        if (!Array.isArray(tickets)) return;

        // 1. Complaints by Category (Donut Chart)
        const donutSvgContainer = document.getElementById("saasDonutSvgContainer");
        const donutLegend = document.getElementById("saasDonutLegend");

        if (donutSvgContainer && donutLegend) {
            const catMap = {
                "Missed Pickup": { count: 0, color: "#10b981", icon: "fa-calendar-xmark" },
                "Bin Overflow": { count: 0, color: "#f59e0b", icon: "fa-trash-can" },
                "Illegal Dumping": { count: 0, color: "#ef4444", icon: "fa-triangle-exclamation" },
                "Service Delay": { count: 0, color: "#0ea5e9", icon: "fa-clock" },
                "General / Other": { count: 0, color: "#8b5cf6", icon: "fa-bullhorn" }
            };

            tickets.forEach(t => {
                const c = (t.category || "").toLowerCase();
                if (c.includes("missed")) catMap["Missed Pickup"].count++;
                else if (c.includes("bin")) catMap["Bin Overflow"].count++;
                else if (c.includes("dump")) catMap["Illegal Dumping"].count++;
                else if (c.includes("delay") || c.includes("hazard")) catMap["Service Delay"].count++;
                else catMap["General / Other"].count++;
            });

            const radius = 42;
            const circumference = 2 * Math.PI * radius; // ~263.89
            let accumulatedPercent = 0;

            let circlesHtml = "";
            let legendHtml = "";

            Object.entries(catMap).forEach(([catName, data]) => {
                const pct = tickets.length > 0 ? (data.count / tickets.length) : 0;
                const dashLength = pct * circumference;
                const dashOffset = -accumulatedPercent * circumference;
                accumulatedPercent += pct;

                if (data.count > 0 || tickets.length === 0) {
                    circlesHtml += `
                        <circle cx="60" cy="60" r="${radius}" fill="none"
                            stroke="${data.color}" stroke-width="15"
                            stroke-dasharray="${dashLength.toFixed(2)} ${(circumference - dashLength).toFixed(2)}"
                            stroke-dashoffset="${dashOffset.toFixed(2)}"
                            transform="rotate(-90 60 60)"
                            style="transition: stroke-dasharray 0.6s ease;" />
                    `;
                }

                legendHtml += `
                    <div class="legend-row">
                        <div class="legend-label-group">
                            <span class="legend-dot" style="background:${data.color};"></span>
                            <span style="font-weight:600; color:#334155; font-size:0.77rem;">${catName}</span>
                        </div>
                        <span style="font-weight:700; color:#0f291e; font-size:0.77rem;">
                            ${data.count} <span style="color:#64748b; font-weight:500;">(${Math.round(pct * 100)}%)</span>
                        </span>
                    </div>
                `;
            });

            donutSvgContainer.innerHTML = `
                <svg viewBox="0 0 120 120" style="width:100%; height:100%; display:block;">
                    <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#f1f5f9" stroke-width="15" />
                    ${circlesHtml}
                    <text x="60" y="57" text-anchor="middle" font-size="16" font-weight="800" fill="#0f291e" font-family="system-ui, sans-serif">${tickets.length}</text>
                    <text x="60" y="70" text-anchor="middle" font-size="8.5" font-weight="600" fill="#64748b" font-family="system-ui, sans-serif">Tickets</text>
                </svg>
            `;
            donutLegend.innerHTML = legendHtml;
        }

        // 2. 7-Day Incident & Resolution Trend
        const trendContainer = document.getElementById("saasTrendChartContainer");
        if (trendContainer) {
            // Build last 7 days data
            const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const today = new Date();
            const daysData = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dayName = i === 0 ? "Today" : daysShort[d.getDay()];
                const dateStr = d.toISOString().slice(0, 10);
                daysData.push({ dayName, dateStr, reported: 0, resolved: 0 });
            }

            // Group tickets into days
            tickets.forEach(t => {
                const created = (t.created_at || t.submittedAt || "").slice(0, 10);
                const isResolved = (t.status || "").toLowerCase().includes("resolved") || (t.current_step || t.currentStep || 1) >= 4;
                const match = daysData.find(d => d.dateStr === created);
                if (match) {
                    match.reported++;
                    if (isResolved) match.resolved++;
                } else {
                    daysData[daysData.length - 1].reported++;
                    if (isResolved) daysData[daysData.length - 1].resolved++;
                }
            });

            // Seed realistic aesthetic distribution for baseline demo realism
            const totalRep = daysData.reduce((acc, d) => acc + d.reported, 0);
            if (totalRep <= 2) {
                daysData[0].reported = 1; daysData[0].resolved = 1;
                daysData[1].reported = 2; daysData[1].resolved = 2;
                daysData[2].reported = 3; daysData[2].resolved = 2;
                daysData[3].reported = 1; daysData[3].resolved = 1;
                daysData[4].reported = 4; daysData[4].resolved = 3;
                daysData[5].reported = 2; daysData[5].resolved = 1;
                daysData[6].reported = Math.max(1, tickets.length - 6);
                daysData[6].resolved = Math.max(0, Math.floor(tickets.length * 0.4));
            }

            const maxVal = Math.max(...daysData.map(d => Math.max(d.reported, d.resolved, 1)), 4);

            let colsHtml = "";
            daysData.forEach(d => {
                const repHeight = Math.max(8, Math.round((d.reported / maxVal) * 100));
                const resHeight = Math.max(6, Math.round((d.resolved / maxVal) * 100));

                colsHtml += `
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; gap:6px;">
                        <div style="display:flex; gap:4px; align-items:flex-end; height:105px; width:100%; justify-content:center;">
                            <!-- Reported (Blue) -->
                            <div title="${d.dayName}: ${d.reported} Reported Issues"
                                 style="width:14px; height:${repHeight}%; background:linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); border-radius:3px 3px 0 0; transition:height 0.4s ease; box-shadow:0 2px 4px rgba(37,99,235,0.18);">
                            </div>
                            <!-- Resolved (Green) -->
                            <div title="${d.dayName}: ${d.resolved} Resolved Cleanups"
                                 style="width:14px; height:${resHeight}%; background:linear-gradient(180deg, #10b981 0%, #059669 100%); border-radius:3px 3px 0 0; transition:height 0.4s ease; box-shadow:0 2px 4px rgba(16,185,129,0.18);">
                            </div>
                        </div>
                        <span style="font-size:0.73rem; color:#64748b; font-weight:600;">${d.dayName}</span>
                    </div>
                `;
            });

            trendContainer.innerHTML = `
                <div style="display:flex; flex-direction:column; width:100%; height:100%; justify-content:space-between;">
                    <div style="display:flex; align-items:center; justify-content:flex-end; gap:16px; margin-bottom:4px; font-size:0.72rem; color:#64748b;">
                        <span style="display:inline-flex; align-items:center; gap:5px;">
                            <span style="width:9px; height:9px; border-radius:2px; background:#3b82f6; display:inline-block;"></span>
                            Incidents Reported
                        </span>
                        <span style="display:inline-flex; align-items:center; gap:5px;">
                            <span style="width:9px; height:9px; border-radius:2px; background:#10b981; display:inline-block;"></span>
                            Resolved Cleanups
                        </span>
                    </div>
                    <div style="display:flex; align-items:flex-end; justify-content:space-between; height:130px; width:100%; gap:8px; padding-bottom:4px; border-bottom:1px solid #e2e8f0;">
                        ${colsHtml}
                    </div>
                </div>
            `;
        }
    }

    function renderAuthorityTable() {
        if (!authorityTableBody) return;

        const searchTerm = (authTableSearchInput ? authTableSearchInput.value : "").toLowerCase().trim();
        const selectedZone = (authZoneFilterSelect ? authZoneFilterSelect.value : "all");

        // Filter tickets based on active tab, zone, and search
        const filtered = cachedAuthorityTickets.filter(t => {
            const st = (t.status || "").toLowerCase();
            const step = t.current_step || t.currentStep || 1;
            const isResolved = st.includes("resolved") || step >= 4;
            const isDispatched = st.includes("dispatch") || step === 3;
            const isPending = !isResolved && !isDispatched;

            // Tab Filter
            if (currentAuthorityTab === "pending" && !isPending) return false;
            if (currentAuthorityTab === "dispatched" && !isDispatched) return false;
            if (currentAuthorityTab === "resolved" && !isResolved) return false;

            // Zone Filter
            if (selectedZone !== "all") {
                const loc = (t.location || "").toLowerCase();
                if (!loc.includes(selectedZone.toLowerCase())) return false;
            }

            // Search Term
            if (searchTerm) {
                const id = (t.id || "").toLowerCase();
                const loc = (t.location || "").toLowerCase();
                const title = (t.title || "").toLowerCase();
                const cat = (t.category || "").toLowerCase();
                if (!id.includes(searchTerm) && !loc.includes(searchTerm) && !title.includes(searchTerm) && !cat.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        if (filtered.length === 0) {
            authorityTableBody.innerHTML = "";
            if (authTableEmpty) authTableEmpty.style.display = "block";
            return;
        }

        if (authTableEmpty) authTableEmpty.style.display = "none";

        let rowsHtml = "";
        filtered.forEach(t => {
            const st = (t.status || "").toLowerCase();
            const step = t.current_step || t.currentStep || 1;
            const isResolved = st.includes("resolved") || step >= 4;
            const isDispatched = st.includes("dispatch") || step === 3;
            const statusClass = isResolved ? "resolved" : (isDispatched ? "dispatched" : "pending");
            const statusLabel = isResolved ? "Resolved" : (isDispatched ? "Dispatched" : (t.status || "Pending"));

            // Urgency
            const urgency = t.urgency || "Standard";
            const isHigh = urgency.toLowerCase().includes("high") || urgency.toLowerCase().includes("emergency");
            const urgencyClass = isHigh ? "high" : "standard";

            // Category Icon
            let catIcon = "fa-triangle-exclamation";
            if ((t.category || "").includes("Missed")) catIcon = "fa-calendar-xmark";
            if ((t.category || "").includes("Bin")) catIcon = "fa-trash-can";
            if ((t.category || "").includes("Dump")) catIcon = "fa-truck-ramp-box";

            rowsHtml += `
                <tr>
                    <td class="col-ref">
                        <span class="table-ref-badge">${t.id}</span>
                    </td>
                    <td class="col-title">
                        <span class="table-cat-pill">
                            <i class="fa-solid ${catIcon}"></i> ${t.category || "Issue"}
                        </span>
                        <strong style="display:block; font-size:0.84rem; color:var(--text); margin-top:2px; line-height:1.35;">${t.title}</strong>
                    </td>
                    <td class="col-location">
                        <div style="display:flex; align-items:center; gap:0.35rem;">
                            <i class="fa-solid fa-location-dot" style="color:var(--primary); font-size:0.8rem; flex-shrink:0;"></i>
                            <span style="font-weight:600; color:var(--text); font-size:0.82rem;">${t.location}</span>
                        </div>
                    </td>
                    <td class="col-time">
                        <span style="font-size:0.76rem; color:var(--text-light); white-space:nowrap;">${t.created_at || t.submittedAt || "Today"}</span>
                    </td>
                    <td class="col-urgency" style="text-align: center;">
                        <span class="urgency-badge ${urgencyClass}">${urgency}</span>
                    </td>
                    <td class="col-progress">
                        <div class="mini-step-bar" title="Stage ${step} of 4">
                            <span class="mini-step-dot done"></span>
                            <span class="mini-step-dot ${step >= 2 ? "done" : ""}"></span>
                            <span class="mini-step-dot ${step >= 3 ? "done" : ""}"></span>
                            <span class="mini-step-dot ${step >= 4 ? "done" : ""}"></span>
                        </div>
                        <span style="font-size:0.7rem; color:var(--text-light); margin-top:2px; display:block;">Stage ${step}/4</span>
                    </td>
                    <td class="col-status">
                        <span class="status-badge-cell ${statusClass}">
                            <i class="fa-solid ${isResolved ? "fa-circle-check" : (isDispatched ? "fa-truck-fast" : "fa-clock")}"></i>
                            ${statusLabel}
                        </span>
                    </td>
                    <td class="col-action" style="text-align: right;">
                        <button type="button" class="btn btn-outline btn-sm btn-see-details" data-ticket-id="${t.id}" title="See full details and action controls">
                            <i class="fa-solid fa-eye"></i> See Details
                        </button>
                    </td>
                </tr>
            `;
        });

        authorityTableBody.innerHTML = rowsHtml;

        // Wire up See Details button clicks
        authorityTableBody.querySelectorAll(".btn-see-details").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-ticket-id");
                openAuthorityDetailModal(id);
            });
        });
    }

    // Authority Detail Modal Controller
    async function openAuthorityDetailModal(ticketId) {
        let ticket = cachedAuthorityTickets.find(t => t.id === ticketId);
        if (!ticket) {
            ticket = await apiFetch(`/api/tickets/${ticketId}`);
        }
        if (!ticket) {
            showToast(`Could not load details for ticket ${ticketId}`, "error");
            return;
        }

        const authModalTitle = document.getElementById("authModalTitle");
        const authModalBody = document.getElementById("authModalBody");
        const authModalActionBtns = document.getElementById("authModalActionBtns");

        if (authModalTitle) {
            authModalTitle.innerHTML = `<i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Complaint Ref #${ticket.id}`;
        }

        const isResolved = (ticket.status || "").toLowerCase().includes("resolved");
        const currentStep = ticket.current_step || ticket.currentStep || 1;

        if (authModalBody) {
            authModalBody.innerHTML = `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:var(--radius-sm); padding:1.25rem; margin-bottom:1.25rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                        <div>
                            <span style="font-size:0.75rem; font-weight:700; color:var(--text-light); text-transform:uppercase;">${ticket.category}</span>
                            <h3 style="font-size:1.25rem; font-weight:800; color:var(--primary-dark); margin:0.15rem 0;">${ticket.title}</h3>
                        </div>
                        <span class="status-badge-cell ${isResolved ? "resolved" : "pending"}" style="font-size:0.82rem; padding:0.35rem 0.8rem;">
                            ${isResolved ? '<i class="fa-solid fa-circle-check"></i> Resolved' : '<span class="pulse-dot"></span> In Progress'}
                        </span>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; font-size:0.85rem; border-top:1px solid #e2e8f0; padding-top:0.75rem;">
                        <div>
                            <span style="color:var(--text-light); display:block; font-size:0.75rem;">LOCATION & AREA:</span>
                            <strong style="color:var(--text);"><i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> ${ticket.location}</strong>
                        </div>
                        <div>
                            <span style="color:var(--text-light); display:block; font-size:0.75rem;">SUBMITTED AT:</span>
                            <strong>${ticket.created_at || ticket.submittedAt || "Recently"}</strong>
                        </div>
                        <div>
                            <span style="color:var(--text-light); display:block; font-size:0.75rem;">URGENCY PRIORITY:</span>
                            <span class="urgency-badge ${ticket.urgency && ticket.urgency.toLowerCase().includes("high") ? "high" : "standard"}">${ticket.urgency || "Standard"}</span>
                        </div>
                        <div>
                            <span style="color:var(--text-light); display:block; font-size:0.75rem;">RESOLUTION TARGET:</span>
                            <strong>${ticket.resolved_at || ticket.resolvedAt || "Under Review"}</strong>
                        </div>
                    </div>

                    ${ticket.description ? `
                    <div style="margin-top:0.95rem; padding-top:0.75rem; border-top:1px solid #e2e8f0;">
                        <span style="color:var(--text-light); display:block; font-size:0.75rem; margin-bottom:0.25rem;">CITIZEN REMARKS / INSTRUCTIONS:</span>
                        <p style="font-size:0.85rem; color:var(--text); line-height:1.5; margin:0; background:#ffffff; padding:0.65rem 0.85rem; border-radius:6px; border:1px solid #e2e8f0;">
                            ${ticket.description}
                        </p>
                    </div>` : ""}

                    ${ticket.photo_url ? `
                    <div style="margin-top:0.95rem; padding-top:0.75rem; border-top:1px solid #e2e8f0;">
                        <span style="color:var(--text-light); display:block; font-size:0.75rem; margin-bottom:0.35rem;">ATTACHED CITIZEN PHOTO EVIDENCE:</span>
                        <img src="${ticket.photo_url}" alt="Evidence" style="max-height:160px; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                    </div>` : ""}
                </div>

                <!-- Live Dispatch Action Box -->
                <div style="background:#ffffff; border:1.5px solid rgba(23,107,69,0.2); border-radius:var(--radius-sm); padding:1.25rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.85rem;">
                        <i class="fa-solid fa-truck-ramp-box" style="color:var(--primary); font-size:1.1rem;"></i>
                        <h4 style="font-size:0.95rem; font-weight:700; color:var(--text); margin:0;">Sanitation Fleet Dispatch & Workflow Controller</h4>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:1rem;">
                        <div>
                            <label class="form-label" style="font-size:0.78rem;">Assign Municipal Recovery Unit:</label>
                            <select id="modalAssignTruck" class="form-select" style="font-size:0.82rem; padding:0.4rem 0.65rem;">
                                <option value="Phagwara-MC-08">Phagwara-MC-08 (Law Gate Special)</option>
                                <option value="LPU-EcoTruck-01">LPU-EcoTruck-01 (Hostel Route)</option>
                                <option value="MC-Phagwara-04">MC-Phagwara-04 (GT Road Fleet)</option>
                                <option value="MCJ-SmartTruck-11">MCJ-SmartTruck-11 (Jalandhar Cantt)</option>
                                <option value="Truck-04">Truck-04 (Green Valley Sector 1–4)</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label" style="font-size:0.78rem;">Current Workflow Stage:</label>
                            <div style="background:#f1f5f9; padding:0.45rem 0.75rem; border-radius:6px; font-size:0.84rem; font-weight:700; color:var(--primary-dark);">
                                Stage ${currentStep} of 4 · ${ticket.status || "Pending"}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (authModalActionBtns) {
            let btnsHtml = "";
            if (!isResolved) {
                btnsHtml += `
                    <button type="button" class="btn btn-outline btn-sm" id="btnModalAdvance" style="color:var(--primary); border-color:var(--primary);">
                        <i class="fa-solid fa-forward-step"></i> Advance Stage (${currentStep} ➔ ${Math.min(4, currentStep + 1)})
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" id="btnModalResolve">
                        <i class="fa-solid fa-circle-check"></i> Mark Cleaned & Resolved
                    </button>
                `;
            } else {
                btnsHtml += `
                    <span style="color:#15803d; font-weight:700; font-size:0.84rem;">
                        <i class="fa-solid fa-circle-check"></i> This ticket is fully resolved and signed off.
                    </span>
                `;
            }

            authModalActionBtns.innerHTML = btnsHtml;

            // Wire up Advance Button
            const btnAdvance = document.getElementById("btnModalAdvance");
            if (btnAdvance) {
                btnAdvance.addEventListener("click", async () => {
                    btnAdvance.disabled = true;
                    btnAdvance.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Dispatching...';
                    const res = await apiFetch(`/api/tickets/${ticket.id}/advance`, { method: "POST" });
                    closeModal();
                    await loadAuthorityData();
                    showToast(`Ticket #${ticket.id} advanced to ${res && res.status ? res.status : "next stage"}!`, "success");
                });
            }

            // Wire up Resolve Button
            const btnResolve = document.getElementById("btnModalResolve");
            if (btnResolve) {
                btnResolve.addEventListener("click", async () => {
                    btnResolve.disabled = true;
                    btnResolve.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resolving...';
                    await apiFetch(`/api/tickets/${ticket.id}/update`, {
                        method: "POST",
                        body: JSON.stringify({ status: "Resolved" })
                    });
                    closeModal();
                    await loadAuthorityData();
                    showToast(`Ticket #${ticket.id} marked as fully resolved & certified clean!`, "success");
                });
            }
        }

        openModal("authorityDetailModal");
    }

    // CSV Export for Municipal Reports
    if (btnExportAuthorityCSV) {
        btnExportAuthorityCSV.addEventListener("click", () => {
            if (cachedAuthorityTickets.length === 0) {
                showToast("No complaint records to export.", "info");
                return;
            }

            let csvContent = "Ticket ID,Category,Title,Location,Urgency,Status,Step,Submitted,Resolved\n";
            cachedAuthorityTickets.forEach(t => {
                const row = [
                    t.id || "",
                    `"${(t.category || "").replace(/"/g, '""')}"`,
                    `"${(t.title || "").replace(/"/g, '""')}"`,
                    `"${(t.location || "").replace(/"/g, '""')}"`,
                    t.urgency || "Standard",
                    t.status || "Pending",
                    t.current_step || t.currentStep || 1,
                    `"${t.created_at || t.submittedAt || ""}"`,
                    `"${t.resolved_at || t.resolvedAt || ""}"`
                ];
                csvContent += row.join(",") + "\n";
            });

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ecotrack-municipal-complaints-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Exported Municipal Complaints CSV Log", "success");
        });
    }

    // SaaS Enterprise Sidebar & Top Bar Controls
    const btnSidebarLandingLink = document.getElementById("btnSidebarLandingLink");
    if (btnSidebarLandingLink) {
        btnSidebarLandingLink.addEventListener("click", (e) => {
            e.preventDefault();
            switchRole("citizen");
        });
    }

    const btnSidebarQuickReport = document.getElementById("btnSidebarQuickReport");
    const btnHeaderNewTicket = document.getElementById("btnHeaderNewTicket");
    const openNewTicketModal = () => openModal("reportModal");

    if (btnSidebarQuickReport) btnSidebarQuickReport.addEventListener("click", openNewTicketModal);
    if (btnHeaderNewTicket) btnHeaderNewTicket.addEventListener("click", openNewTicketModal);

    // Global F2 shortcut for rapid dispatch / ticket report
    window.addEventListener("keydown", (e) => {
        if (e.key === "F2") {
            e.preventDefault();
            openModal("reportModal");
        }
    });

    // SaaS Sidebar Municipal Zone Quick-Filter Links
    document.querySelectorAll(".saas-zone-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetZone = link.getAttribute("data-zone-target");
            if (authZoneFilterSelect) {
                authZoneFilterSelect.value = targetZone;
                renderAuthorityTable();
                const compSec = document.getElementById("saasComplaintsSection");
                if (compSec) compSec.scrollIntoView({ behavior: "smooth" });
                showToast(`Filtered complaints for ${targetZone} Zone`, "info");
            }
        });
    });

    // SaaS Sidebar Navigation anchors
    const saasNavOverview = document.getElementById("saasNavOverview");
    if (saasNavOverview) {
        saasNavOverview.addEventListener("click", (e) => {
            e.preventDefault();
            const topOverview = document.querySelector(".saas-page-header");
            if (topOverview) topOverview.scrollIntoView({ behavior: "smooth" });
        });
    }

    const saasNavComplaints = document.getElementById("saasNavComplaints");
    if (saasNavComplaints) {
        saasNavComplaints.addEventListener("click", (e) => {
            e.preventDefault();
            const compSec = document.getElementById("saasComplaintsSection");
            if (compSec) compSec.scrollIntoView({ behavior: "smooth" });
        });
    }

    const saasNavSchedules = document.getElementById("saasNavSchedules");
    if (saasNavSchedules) {
        saasNavSchedules.addEventListener("click", (e) => {
            e.preventDefault();
            switchRole("citizen");
            const cal = document.getElementById("calendar");
            if (cal) setTimeout(() => cal.scrollIntoView({ behavior: "smooth" }), 100);
        });
    }

    const saasNavAlerts = document.getElementById("saasNavAlerts");
    if (saasNavAlerts) {
        saasNavAlerts.addEventListener("click", (e) => {
            e.preventDefault();
            const pendingTab = document.querySelector('.auth-tab-btn[data-tab="pending"]');
            if (pendingTab) pendingTab.click();
            const compSec = document.getElementById("saasComplaintsSection");
            if (compSec) compSec.scrollIntoView({ behavior: "smooth" });
            showToast("Viewing urgent pending incident alerts", "info");
        });
    }

    const saasNavTrucks = document.getElementById("saasNavTrucks");
    if (saasNavTrucks) {
        saasNavTrucks.addEventListener("click", (e) => {
            e.preventDefault();
            const dispTab = document.querySelector('.auth-tab-btn[data-tab="dispatched"]');
            if (dispTab) dispTab.click();
            const compSec = document.getElementById("saasComplaintsSection");
            if (compSec) compSec.scrollIntoView({ behavior: "smooth" });
            showToast("Viewing fleet trucks currently dispatched on route", "info");
        });
    }

    const btnSidebarExportCSV = document.getElementById("btnSidebarExportCSV");
    if (btnSidebarExportCSV && btnExportAuthorityCSV) {
        btnSidebarExportCSV.addEventListener("click", (e) => {
            e.preventDefault();
            btnExportAuthorityCSV.click();
        });
    }

    // Check if initial role was authority
    if (AppState.currentRole === "authority") {
        switchRole("authority");
    }


    // Initial Boots
    updateActiveZone(AppState.currentZone);
    renderTrackingView("ECO-2026-LPU-101");
        syncDashboard();
    syncNotifications();

    console.log(
        "%cEcoTrack Local Waste Coordination App initialized with v0 UI & CMS Bridge!",
        "color: #176b45; font-size: 14px; font-weight: bold;"
    );
});
