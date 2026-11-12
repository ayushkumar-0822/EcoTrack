
/* =========================================
   ECOTRACK — MAIN JAVASCRIPT
========================================= */

// Wait until the HTML is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------
    // 1. MOBILE NAVIGATION
    // -------------------------------------

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", () => {

            const isOpen = navLinks.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", isOpen);

            menuToggle.innerHTML = isOpen
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';

        });


        // Close menu when a navigation link is clicked
        navLinks.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navLinks.classList.remove("open");

                menuToggle.setAttribute("aria-expanded", "false");

                menuToggle.innerHTML =
                    '<i class="fa-solid fa-bars"></i>';

            });

        });

    }


    // -------------------------------------
    // 2. ACTIVE NAVIGATION LINK
    // -------------------------------------

    const sections = document.querySelectorAll("main section[id]");
    const navigationLinks = document.querySelectorAll(".nav-link");

    const observerOptions = {
        root: null,
        threshold: 0.25
    };

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

    }, observerOptions);


    sections.forEach(section => {
        sectionObserver.observe(section);
    });


    // -------------------------------------
    // 3. ANIMATED STATISTICS
    // -------------------------------------

    const counters = document.querySelectorAll("[data-count]");

    const counterObserver = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                const counter = entry.target;

                const target = Number(counter.dataset.count);

                const duration = 1600;

                let startTime = null;


                function animateCounter(timestamp) {

                    if (!startTime) {
                        startTime = timestamp;
                    }

                    const progress = Math.min(
                        (timestamp - startTime) / duration,
                        1
                    );

                    // Smooth ease-out effect
                    const easedProgress = 1 - Math.pow(1 - progress, 4);

                    const currentValue = Math.floor(
                        easedProgress * target
                    );

                    counter.textContent =
                        currentValue.toLocaleString("en-IN");

                    if (progress < 1) {

                        requestAnimationFrame(animateCounter);

                    } else {

                        counter.textContent =
                            target.toLocaleString("en-IN");

                    }

                }


                requestAnimationFrame(animateCounter);

                counterObserver.unobserve(counter);

            }

        });

    }, {
        threshold: 0.5
    });


    counters.forEach(counter => {
        counterObserver.observe(counter);
    });


    // -------------------------------------
    // 4. SMOOTH SCROLLING
    // -------------------------------------

    document.querySelectorAll('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const targetId = link.getAttribute("href");

            if (targetId === "#") {
                return;
            }

            const targetElement = document.querySelector(targetId);

            if (targetElement) {

                event.preventDefault();

                targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    // -------------------------------------
    // 5. REVEAL ANIMATIONS
    // -------------------------------------

    const revealElements = document.querySelectorAll(
        ".service-card, .step-item, .stat-card"
    );

    revealElements.forEach(element => {

        element.style.opacity = "0";

        element.style.transform = "translateY(20px)";

        element.style.transition =
            "opacity 0.6s ease, transform 0.6s ease";

    });


    const revealObserver = new IntersectionObserver(entries => {

        entries.forEach((entry, index) => {

            if (entry.isIntersecting) {

                const element = entry.target;

                element.style.transitionDelay = `${index * 70}ms`;

                element.style.opacity = "1";

                element.style.transform = "translateY(0)";

                revealObserver.unobserve(element);

            }

        });

    }, {
        threshold: 0.15
    });


    revealElements.forEach(element => {
        revealObserver.observe(element);
    });


    // -------------------------------------
    // 6. CONSOLE MESSAGE
    // -------------------------------------

    console.log(
        "%cEcoTrack initialized successfully!",
        "color: #176b45; font-size: 16px; font-weight: bold;"
    );

});
