document.addEventListener('DOMContentLoaded', function() {
    const sections = Array.from(document.querySelectorAll('.memory-section'));
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const revealFinalWishBtn = document.getElementById('revealFinalWishBtn');
    const specialHiddenMessage = document.getElementById('specialHiddenMessage');
    const currentMemoryNumSpan = document.getElementById('currentMemoryNum');
    const totalMemoriesNumSpan = document.getElementById('totalMemoriesNum');
    const floatingShapes = document.querySelectorAll('.floating-shape');
    const birthdayCardContainer = document.querySelector('.birthday-card-container');
    const body = document.body;

    let currentSectionIndex = 0;

    // Set total memories count
    totalMemoriesNumSpan.textContent = sections.length;

    // Initialize Tone.js for sound effects
    let correctClueSynth, fanfareSynth;

    // Function to trigger confetti at the center of the current section
    function triggerSectionSparkle(elementToSparkle) {
        // Defensive check: ensure elementToSparkle is a valid DOM element
        if (!elementToSparkle || typeof elementToSparkle.getBoundingClientRect !== 'function') {
            console.error("Cannot sparkle: element is not valid or getBoundingClientRect is not a function.", elementToSparkle);
            return;
        }

        const rect = elementToSparkle.getBoundingClientRect();
        // Ensure dimensions are not zero before attempting to calculate origin
        if (rect.width === 0 || rect.height === 0) {
            console.warn("Cannot sparkle: element has zero dimensions.", elementToSparkle);
            return;
        }

        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        confetti({
            particleCount: 70, // Slightly more particles for automatic sparkle
            spread: 80,
            origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            colors: ['#fbcfe8', '#bfdbfe', '#f06292', '#fee2e2'] // Match theme colors
        });
    }


    // Function to initialize Tone.js synths
    async function initializeAudio() {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Tone.js audio context started.');
        }

        // Simple synth for correct clue sound
        correctClueSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.2,
                release: 0.5
            }
        }).toDestination();

        // More complex synth for fanfare sound
        fanfareSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }
        }).toDestination();
    }

    // Call initializeAudio on first user interaction to avoid auto-play blocking
    document.body.addEventListener('click', initializeAudio, { once: true });


    function showSection(index) {
        const newActiveSection = sections[index];
        const oldActiveSection = document.querySelector('.memory-section.active');

        // Handle exit animation for the old section
        if (oldActiveSection) {
            oldActiveSection.classList.add('leaving');
            // Add a temporary, one-time event listener for animation end
            oldActiveSection.addEventListener('animationend', function handler() {
                oldActiveSection.classList.remove('active', 'leaving');
                oldActiveSection.style.display = 'none';
                // Clean up the event listener to prevent it from firing again
                oldActiveSection.removeEventListener('animationend', handler);
            }, { once: true });
        }

        // Set display to flex before adding 'active' to ensure animation plays
        newActiveSection.style.display = 'flex';
        newActiveSection.classList.add('active'); // Add 'active' for entrance animation

        // Listen for the end of the entrance animation on the new section
        // This ensures the element is fully rendered and animated before sparkling
        newActiveSection.addEventListener('animationend', function handler() {
            // Ensure this listener only runs once for the entry animation
            newActiveSection.removeEventListener('animationend', handler);
            // Now that the animation is complete and the element is rendered, trigger sparkle
            triggerSectionSparkle(newActiveSection);
        }, { once: true });


        currentSectionIndex = index;
        updateNavigationButtons();
        updateProgressIndicator();
        updateBackgroundColor(); // Update background color on section change
        
        // Hide final message if navigating away from it
        if (specialHiddenMessage.classList.contains('active')) {
            specialHiddenMessage.classList.remove('active');
            specialHiddenMessage.style.display = 'none'; // Ensure it's hidden
            revealFinalWishBtn.textContent = 'Reveal Your Ultimate Birthday Wish! 🎉';
        }

        // Scroll to top of the card when changing sections
        birthdayCardContainer.scrollTop = 0;
    }

    function updateNavigationButtons() {
        prevBtn.disabled = currentSectionIndex === 0;
        nextBtn.disabled = currentSectionIndex === sections.length - 1;

        // Hide/show the final wish button based on the current section
        if (currentSectionIndex === sections.length - 1) {
            revealFinalWishBtn.classList.remove('hidden');
        } else {
            revealFinalWishBtn.classList.add('hidden');
        }
    }

    function updateProgressIndicator() {
        currentMemoryNumSpan.textContent = currentSectionIndex + 1;
    }

    function updateBackgroundColor() {
        const newColor = sections[currentSectionIndex].dataset.bgColor || '#fce7f3'; // Fallback to default
        body.style.backgroundColor = newColor;
    }

    prevBtn.addEventListener('click', function() {
        if (currentSectionIndex > 0) {
            showSection(currentSectionIndex - 1);
            // Adjusted navigation sound
            if (correctClueSynth) correctClueSynth.triggerAttackRelease("E4", "8n");
        }
    });

    nextBtn.addEventListener('click', function() {
        if (currentSectionIndex < sections.length - 1) {
            showSection(currentSectionIndex + 1);
            // Adjusted navigation sound
            if (correctClueSynth) correctClueSynth.triggerAttackRelease("G4", "8n");
        }
    });

    revealFinalWishBtn.addEventListener('click', function() {
        if (specialHiddenMessage.classList.contains('active')) {
            specialHiddenMessage.classList.remove('active');
            specialHiddenMessage.style.display = 'none'; // Ensure it's hidden
            this.textContent = 'Reveal Your Ultimate Birthday Wish! �';
        } else {
            specialHiddenMessage.style.display = 'block'; // Set display before adding active
            specialHiddenMessage.classList.add('active');
            this.textContent = 'Hide Ultimate Birthday Wish';
            if (fanfareSynth) fanfareSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n"); // Play fanfare
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    });

    // Parallax effect on scroll
    birthdayCardContainer.addEventListener('scroll', () => {
        const scrollTop = birthdayCardContainer.scrollTop;
        floatingShapes.forEach(shape => {
            const speed = parseFloat(shape.dataset.parallaxSpeed);
            if (!isNaN(speed)) {
                shape.style.transform = `translateY(${scrollTop * speed * 0.1}px)`; // Adjust multiplier for desired effect
            }
        });
    });

    // Initial display and setup
    // Ensure the initial section is always the first one when the page loads
    // This explicitly sets the currentSectionIndex to 0 and calls showSection.
    currentSectionIndex = 0; 
    showSection(currentSectionIndex); 
});
