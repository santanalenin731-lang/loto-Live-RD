document.addEventListener('DOMContentLoaded', () => {
    // Current Time Update Logic
    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) {
        setInterval(() => {
            const now = new Date();
            timeDisplay.textContent = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }, 1000);
    }

    // Initial Hero Animation specific logic
    const heroBalls = document.querySelectorAll('.hero-ball');

    // Add Parallax to Hero Balls
    heroBalls.forEach(ball => {
        ball.addEventListener('mousemove', (e) => {
            const rect = ball.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rotateX = -(y / (rect.height / 2)) * 30;
            const rotateY = (x / (rect.width / 2)) * 30;
            ball.style.transform = `perspective(200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
            ball.style.boxShadow = `
                inset -5px -5px 12px rgba(0,0,0,0.7), 
                inset 2px 2px 6px rgba(255,255,255,0.4),
                ${-x / 2}px ${-y / 2}px 15px rgba(0,0,0,0.5)`;
        });
        ball.addEventListener('mouseleave', () => {
            ball.style.transform = `perspective(200px) rotateX(0) rotateY(0) scale(1)`;
            ball.style.boxShadow = '';
        });
    });


    const resultsContainer = document.getElementById('results-container');
    const spinner = document.getElementById('loading-spinner');
    let allLotteries = [];

    // Metadata mapping since the DB only stores the code
    const LOTTERY_META = {
        // --- Clásicas ---
        'loteka': { name: 'Quiniela Loteka', provider: 'Loteka', type: 'Quiniela', color: '#f97316', category: 'daily', time: 'night' },
        'nacional': { name: 'Gana Más', provider: 'Nacional', type: 'Quiniela', color: '#1e3a8a', category: 'daily', time: 'afternoon' },
        'nacional_noche': { name: 'Lotería Nacional', provider: 'Nacional', type: 'Quiniela', color: '#1e3a8a', category: 'daily', time: 'night' },
        'leidsa': { name: 'Quiniela Leidsa', provider: 'LEIDSA', type: 'Quiniela', color: '#eab308', category: 'daily', time: 'night' },
        'real': { name: 'Lotería Real', provider: 'Real', type: 'Quiniela', color: '#b91c1c', category: 'daily', time: 'afternoon' },

        // --- Nuevas Privadas ---
        'primera_dia': { name: 'La Primera', provider: 'La Primera', type: 'Quiniela', color: '#00aaeb', category: 'daily', time: 'morning' },
        'primera_noche': { name: 'La Primera Noche', provider: 'La Primera', type: 'Quiniela', color: '#00aaeb', category: 'daily', time: 'night' },
        'suerte_dia': { name: 'La Suerte Dominicana', provider: 'La Suerte', type: 'Quiniela', color: '#10b981', category: 'daily', time: 'afternoon' },
        'suerte_tarde': { name: 'La Suerte Tarde', provider: 'La Suerte', type: 'Quiniela', color: '#10b981', category: 'daily', time: 'afternoon' },
        'lotedom': { name: 'Quiniela LoteDom', provider: 'LoteDom', type: 'Quiniela', color: '#f43f5e', category: 'daily', time: 'afternoon' },

        // --- Americanas ---
        'ny_tarde': { name: 'New York Tarde', provider: 'USA', type: 'Internacional', color: '#6366f1', category: 'daily', time: 'afternoon' },
        'ny_noche': { name: 'New York Noche', provider: 'USA', type: 'Internacional', color: '#6366f1', category: 'daily', time: 'night' },
        'fl_dia': { name: 'Florida Día', provider: 'USA', type: 'Internacional', color: '#8b5cf6', category: 'daily', time: 'afternoon' },
        'fl_noche': { name: 'Florida Noche', provider: 'USA', type: 'Internacional', color: '#8b5cf6', category: 'daily', time: 'night' },

        // --- Caribeñas ---
        'anguila_10': { name: 'Anguila (10:00 AM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'morning' },
        'anguila_1': { name: 'Anguila (1:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'afternoon' },
        'anguila_6': { name: 'Anguila (6:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'night' },
        'anguila_9': { name: 'Anguila (9:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'night' },
        'king_12': { name: 'King Lottery (12:30 PM)', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning' },
        'king_7': { name: 'King Lottery (7:30 PM)', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night' },

        // --- Dummy Jackpots ---
        'loto_leidsa': { name: 'Loto Leidsa', provider: 'LEIDSA', type: 'Jackpot', color: '#eab308', category: 'jackpot' },
        'mega_chances': { name: 'Mega Chances', provider: 'Loteka', type: 'Jackpot', color: '#f97316', category: 'jackpot' },
        'loto_real': { name: 'Loto Real', provider: 'Real', type: 'Jackpot', color: '#b91c1c', category: 'jackpot' },
        'default': { name: 'Sorteo', provider: 'Lotería', type: 'Sorteo', color: '#374151', category: 'daily', time: 'night' }
    };

    function getMeta(code) {
        return LOTTERY_META[code] || LOTTERY_META['default'];
    }

    const EXPECTED_LOTTERIES = [
        // Mañana - Dominicana
        'primera_dia',
        // Mañana - Internacional
        'anguila_10', 'king_12',

        // Tarde - Dominicana
        'real', 'nacional', 'suerte_dia', 'lotedom', 'suerte_tarde',
        // Tarde - Internacional
        'fl_dia', 'ny_tarde', 'anguila_1',

        // Noche - Dominicana
        'loteka', 'nacional_noche', 'leidsa', 'primera_noche',
        // Noche - Internacional
        'fl_noche', 'ny_noche', 'anguila_6', 'king_7', 'anguila_9'
    ];

    const MOCK_JACKPOTS = [
        { lottery_code: 'loto_leidsa', numbers: ['15', '22', '31', '34', '36', '06'], draw_time: 'Ayer', prize: '$35 Millones' },
        { lottery_code: 'mega_chances', numbers: ['12', '45', '67', '89', '02'], draw_time: 'Ayer', prize: '$50 Millones' },
        { lottery_code: 'loto_real', numbers: ['04', '11', '19', '25', '26', '30'], draw_time: 'Ayer', prize: '$10 Millones' },
    ];

    function mergeDataWithPlaceholders(apiData) {
        return EXPECTED_LOTTERIES.map(code => {
            const found = apiData.find(d => d.lottery_code === code);
            if (found) return found;
            return {
                lottery_code: code,
                numbers: ['--', '--', '--'],
                draw_time: 'Pendiente'
            };
        });
    }

    // Fetch and render data
    fetch('http://localhost:4000/api/results/latest')
        .then(response => response.json())
        .then(data => {
            spinner.style.display = 'none';
            allLotteries = mergeDataWithPlaceholders(data);

            // Render regular lottery list
            renderLotteryCards(allLotteries);

            // Start the Hero Carousel
            startHeroCarousel();

            checkEmptyState();
            lucide.createIcons(); // Initialize icons after initial render
        })
        .catch(error => {
            console.warn("No se pudo conectar al servidor local. Mostrando datos offline...", error);

            // Still hide the spinner
            spinner.style.display = 'none';

            // Use empty array to generate placeholders for all expected lotteries
            allLotteries = mergeDataWithPlaceholders([]);
            renderLotteryCards(allLotteries);

            startHeroCarousel();

            checkEmptyState();

            // Optionally add a small toast/notice instead of fully replacing the container
            const notice = document.createElement('div');
            notice.className = 'glass-panel';
            notice.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 1rem; border-left: 4px solid var(--accent-red); background: rgba(17, 24, 39, 0.95);';
            notice.innerHTML = `<p style="margin:0; font-size:0.9rem; color:var(--text-muted);"><i data-lucide="wifi-off" style="width:16px; height:16px; margin-right:8px; vertical-align:middle;"></i>Sin conexión al servidor local</p>`;
            document.body.appendChild(notice);

            setTimeout(() => {
                notice.style.opacity = '0';
                notice.style.transition = 'opacity 0.5s ease';
                setTimeout(() => notice.remove(), 500);
            }, 5000);

            lucide.createIcons();
        });

    // Initialize WebSocket for Real-time Updates only if available
    let socket;
    try {
        socket = io('http://localhost:4000', {
            reconnectionAttempts: 3,
            timeout: 5000
        });

        socket.on('connect', () => {
            console.log('Connected to Lottery WebSocket Server');
        });

        socket.on('new_result', (data) => {
            console.log('Got new real-time result!', data);

            // In a real app we'd determine if the update is a jackpot or daily
            fetch('http://localhost:4000/api/results/latest')
                .then(res => res.json())
                .then(newData => {
                    const mergedData = mergeDataWithPlaceholders(newData);
                    allLotteries = mergedData;
                    renderLotteryCards(mergedData);
                    // We keep the jackpot in the hero, so we might not update hero here unless the jackpot itself updated
                    lucide.createIcons();
                })
                .catch(err => console.warn('Real-time sync failed (offline):', err));
        });
    } catch (err) {
        console.warn('WebSocket init failed:', err);
    }

    // Hero Carousel Logic
    let currentJackpotIndex = 0;
    let heroCarouselInterval = null;

    function startHeroCarousel() {
        if (MOCK_JACKPOTS.length === 0) return;

        // Initial render
        updateHeroSection(MOCK_JACKPOTS[currentJackpotIndex]);

        if (heroCarouselInterval) clearInterval(heroCarouselInterval);

        heroCarouselInterval = setInterval(() => {
            currentJackpotIndex = (currentJackpotIndex + 1) % MOCK_JACKPOTS.length;

            const lotteryNameNode = document.getElementById('hero-lottery-name');
            const prizeNode = document.getElementById('hero-prize');
            const heroVisualContainer = document.querySelector('.hero-visual');

            // 1. Add Exit Animation
            if (lotteryNameNode) {
                lotteryNameNode.classList.remove('carousel-enter');
                lotteryNameNode.classList.add('carousel-exit');
            }
            if (prizeNode) {
                prizeNode.classList.remove('carousel-enter');
                prizeNode.classList.add('carousel-exit');
            }
            if (heroVisualContainer) {
                heroVisualContainer.classList.remove('carousel-enter');
                heroVisualContainer.classList.add('carousel-exit');
            }

            // 2. Wait for exit, then update and animate entry
            setTimeout(() => {
                updateHeroSection(MOCK_JACKPOTS[currentJackpotIndex]);

                const newPrizeNode = document.getElementById('hero-prize');

                if (lotteryNameNode) {
                    lotteryNameNode.classList.remove('carousel-exit');
                    lotteryNameNode.classList.add('carousel-enter');
                }
                if (newPrizeNode) {
                    newPrizeNode.classList.remove('carousel-exit');
                    newPrizeNode.classList.add('carousel-enter');
                }
                if (heroVisualContainer) {
                    heroVisualContainer.classList.remove('carousel-exit');
                    heroVisualContainer.classList.add('carousel-enter');
                }
            }, 300); // 300ms matches exit animation duration
        }, 5000); // 5 seconds per slide
    }

    // Function to update the big Hero Banner
    function updateHeroSection(data) {
        if (!data || !data.numbers || data.numbers.length === 0) return;

        const meta = getMeta(data.lottery_code);

        // Update the Lottery Name Label
        const lotteryNameNode = document.getElementById('hero-lottery-name');
        if (lotteryNameNode && meta) {
            lotteryNameNode.textContent = meta.name;
            lotteryNameNode.style.opacity = '1';

            // Clean up old prize node if it exists to avoid duplications
            const existingPrize = document.getElementById('hero-prize');
            if (existingPrize) {
                existingPrize.remove();
            }

            // Add prize if it's a jackpot
            if (data.prize) {
                const prizeNode = document.createElement('div');
                prizeNode.id = 'hero-prize';
                prizeNode.style.fontSize = '2.5rem';
                prizeNode.style.color = 'var(--success-green)';
                prizeNode.style.fontWeight = '900';
                prizeNode.style.marginTop = '1rem';
                prizeNode.style.textShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
                prizeNode.textContent = data.prize;

                // Insert after the title in the hero section
                const heroTitleContainer = document.querySelector('.hero h2');
                if (heroTitleContainer) {
                    heroTitleContainer.parentNode.insertBefore(prizeNode, heroTitleContainer.nextSibling);
                }
            }
        }

        const heroVisualContainer = document.querySelector('.hero-visual');
        if (heroVisualContainer) {
            heroVisualContainer.innerHTML = ''; // Clear existing balls

            // Re-create balls for the jackpot
            data.numbers.forEach((num, index) => {
                const ball = document.createElement('div');
                ball.className = 'hero-ball';
                ball.textContent = num; // Actual winning number injected
                ball.style.animationDelay = `${index * 0.2}s`;
                // If it's the extra/powerball
                if (data.numbers.length > 5 && index === data.numbers.length - 1) {
                    ball.style.borderColor = 'rgba(206, 17, 38, 0.8)';
                    ball.style.background = 'radial-gradient(circle at 30% 30%, #5a1118, #111827)';
                } else {
                    if (index === 1) ball.style.borderColor = 'rgba(206, 17, 38, 0.5)';
                }

                // Add Parallax listener back
                ball.addEventListener('mousemove', (e) => {
                    const rect = ball.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    const rotateX = -(y / (rect.height / 2)) * 30;
                    const rotateY = (x / (rect.width / 2)) * 30;
                    ball.style.transform = `perspective(200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
                    ball.style.boxShadow = `
                        inset -5px -5px 12px rgba(0,0,0,0.7), 
                        inset 2px 2px 6px rgba(255,255,255,0.4),
                        ${-x / 2}px ${-y / 2}px 15px rgba(0,0,0,0.5)`;
                });
                ball.addEventListener('mouseleave', () => {
                    ball.style.transform = `perspective(200px) rotateX(0) rotateY(0) scale(1)`;
                    ball.style.boxShadow = '';
                });

                heroVisualContainer.appendChild(ball);
            });
        }
    }


    function buildCardHtml(lottery, meta) {
        const className = lottery.lottery_code;

        let accentColor = meta.color;

        let isJackpot = meta.category === 'jackpot';

        const ballsHtml = lottery.numbers.map((num, i) => {
            const isExtra = (!isJackpot && lottery.numbers.length > 3 && i === lottery.numbers.length - 1);
            return `<div class="ball ${isExtra ? 'extra' : ''}">${num.toString().padStart(2, '0')}</div>`;
        }).join('');

        let prevResultsHtml = '';
        if (lottery.previousResults && lottery.previousResults.length > 0 && lottery.previousResults[0] !== '--') {
            prevResultsHtml = `
                <div class="prev-results">
                    <i data-lucide="history" style="width: 14px; height: 14px;"></i>
                    Ayer: ${lottery.previousResults.map(n => n.toString().padStart(2, '0')).join(' - ')}
                </div>
            `;
        }

        const drawTimeDisplay = lottery.draw_time || 'N/A';
        const prizeDisplay = lottery.prize ? `<div class="jackpot-prize" style="color: var(--success-green); font-size: 1.1rem; font-weight: 800; margin-top: 0.5rem;">Premio: ${lottery.prize}</div>` : '';

        return `
            <div class="lottery-card glass-panel fade-in" data-lottery="${className}" style="--card-accent: ${accentColor};">
                <div class="card-header">
                    <div class="card-title-group">
                        <h3>${meta.name}</h3>
                        <span class="card-provider">${meta.provider}</span>
                        ${prizeDisplay}
                    </div>
                    <div class="card-time">
                        <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                        ${drawTimeDisplay}
                    </div>
                </div>
                <div class="card-results">
                    ${ballsHtml}
                </div>
                <div class="card-footer">
                    <span class="card-type">${meta.type}</span>
                    ${prevResultsHtml}
                </div>
            </div>
        `;
    }

    function renderLotteryCards(data) {
        // New DOM Targets
        const jackpotsSection = document.getElementById('jackpots-section');
        const dailySection = document.getElementById('daily-section');

        const jackpotsContainer = document.getElementById('jackpots-container');
        const morningContainer = document.getElementById('morning-container');
        const afternoonContainer = document.getElementById('afternoon-container');
        const nightContainer = document.getElementById('night-container');

        const groupMorning = document.getElementById('group-morning');
        const groupAfternoon = document.getElementById('group-afternoon');
        const groupNight = document.getElementById('group-night');

        // Clear containers
        jackpotsContainer.innerHTML = '';
        morningContainer.innerHTML = '';
        afternoonContainer.innerHTML = '';
        nightContainer.innerHTML = '';

        // Render Jackpots
        if (MOCK_JACKPOTS.length > 0) {
            jackpotsSection.style.display = 'block';
            MOCK_JACKPOTS.forEach((jackpot, index) => {
                const meta = getMeta(jackpot.lottery_code);
                const html = buildCardHtml(jackpot, meta);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html.trim();
                const node = tempDiv.firstChild;
                node.style.animationDelay = `${index * 0.1}s`;
                jackpotsContainer.appendChild(node);
            });
        }

        // Render Dailies
        let hasMorning = false, hasAfternoon = false, hasNight = false;

        data.forEach((lottery, index) => {
            const meta = getMeta(lottery.lottery_code);
            const html = buildCardHtml(lottery, meta);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html.trim();
            const node = tempDiv.firstChild;
            node.style.animationDelay = `${index * 0.1}s`;

            if (meta.time === 'morning') {
                morningContainer.appendChild(node);
                hasMorning = true;
            } else if (meta.time === 'afternoon') {
                afternoonContainer.appendChild(node);
                hasAfternoon = true;
            } else if (meta.time === 'night') {
                nightContainer.appendChild(node);
                hasNight = true;
            }
        });

        if (data.length > 0) {
            dailySection.style.display = 'block';
            groupMorning.style.display = hasMorning ? 'block' : 'none';
            groupAfternoon.style.display = hasAfternoon ? 'block' : 'none';
            groupNight.style.display = hasNight ? 'block' : 'none';
        }

        // Initialize 3D Parallax effect on all generated balls
        const balls = document.querySelectorAll('.ball');
        balls.forEach(ball => {
            ball.addEventListener('mousemove', (e) => {
                const rect = ball.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                const rotateX = -(y / (rect.height / 2)) * 30;
                const rotateY = (x / (rect.width / 2)) * 30;

                ball.style.transform = `perspective(200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
                ball.style.boxShadow = `
                    inset -5px -5px 10px rgba(0,0,0,0.6), 
                    inset 2px 2px 5px rgba(255,255,255,0.4),
                    ${-x / 2}px ${-y / 2}px 15px rgba(0,0,0,0.5)`;
            });

            ball.addEventListener('mouseleave', () => {
                ball.style.transform = `perspective(200px) rotateX(0) rotateY(0) scale(1)`;
                ball.style.boxShadow = ''; // Reverts to CSS default
            });
        });
    }

    // Initial filter logic (for the old layout, now applicable only to dailies if needed, but let's repurpose)
    const filterBtns = document.querySelectorAll('.filter-btn');
    const jackpotsSection = document.getElementById('jackpots-section');
    const dailySection = document.getElementById('daily-section');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                jackpotsSection.style.display = MOCK_JACKPOTS.length > 0 ? 'block' : 'none';
                renderLotteryCards(allLotteries);
            } else {
                jackpotsSection.style.display = 'none'; // Hide jackpots when filtering by specific daily provider
                const filtered = allLotteries.filter(l => getMeta(l.lottery_code).provider === filter);
                renderLotteryCards(filtered);
            }
            lucide.createIcons();
        });
    });

    // New Time Filter Logic
    const timeBtns = document.querySelectorAll('.time-btn');
    const timeGroups = {
        'morning': document.getElementById('group-morning'),
        'afternoon': document.getElementById('group-afternoon'),
        'night': document.getElementById('group-night')
    };

    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const timeFilter = btn.getAttribute('data-time');

            if (timeFilter === 'all') {
                Object.values(timeGroups).forEach(group => {
                    if (group.querySelector('.lottery-card')) {
                        group.style.display = 'block';
                    }
                });
            } else {
                Object.entries(timeGroups).forEach(([key, group]) => {
                    if (key === timeFilter && group.querySelector('.lottery-card')) {
                        group.style.display = 'block';
                    } else {
                        group.style.display = 'none';
                    }
                });
            }
        });
    });

    // Initial helper to clear empty state if data exists
    function checkEmptyState() {
        if (allLotteries.length > 0 || MOCK_JACKPOTS.length > 0) {
            const emptyState = document.querySelector('.empty-state');
            if (emptyState) emptyState.classList.remove('visible');
        }
    }

    /* ------------------------------------------------------------------------
       SPA Routing & Subpages Logic
       ------------------------------------------------------------------------ */

    function handleHashChange() {
        const hash = window.location.hash;
        const isDataCenter = hash === '#data-center';
        const isSubpage = hash.startsWith('#lottery/');

        // Hide all views first
        const viewHome = document.getElementById('view-home');
        const viewSubpage = document.getElementById('view-subpage');
        const viewDatacenter = document.getElementById('view-datacenter');

        if (viewHome) viewHome.style.display = 'none';
        if (viewSubpage) viewSubpage.style.display = 'none';
        if (viewDatacenter) viewDatacenter.style.display = 'none';

        // Update nav active states
        document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));

        if (isDataCenter) {
            if (viewDatacenter) viewDatacenter.style.display = 'block';
            const navLink = document.querySelector('.nav-links a[href="/#data-center"]');
            if (navLink) navLink.classList.add('active');
            window.scrollTo(0, 0);
            renderDataCenter(); // Call initializer for data center
        } else if (isSubpage) {
            if (viewSubpage) viewSubpage.style.display = 'block';
            window.scrollTo(0, 0);

            const pathParts = hash.split('/'); // e.g., ["#lottery", "Provider", "DrawName"]
            if (pathParts.length === 3) {
                const provider = decodeURIComponent(pathParts[1]);
                const drawName = decodeURIComponent(pathParts[2]);
                renderSubpage(provider, drawName);
            }
        } else {
            // Default: Home View
            if (viewHome) viewHome.style.display = 'block';
            const navLink = document.querySelector('.nav-links a[href="/#"]');
            if (navLink) navLink.classList.add('active');

            // Re-render lottery cards if we have data but morningContainer is empty
            const morningContainer = document.getElementById('morning-container');
            if (morningContainer && morningContainer.children.length === 0 && allLotteries.length > 0) {
                renderLotteryCards(allLotteries);
            }
        }
    }

    function renderDataCenter() {
        const heatmapContainer = document.getElementById('heatmap-container');
        if (!heatmapContainer) return;

        // Initialize only once
        if (heatmapContainer.children.length > 0) return;

        let html = '';
        for (let i = 0; i <= 99; i++) {
            let heat = Math.random();
            let bg = 'rgba(255,255,255,0.05)';
            let border = 'none';

            if (heat > 0.85) {
                bg = 'rgba(206,17,38,0.8)'; // Red Hot
                border = '1px solid var(--accent-red)';
            } else if (heat > 0.6) {
                bg = 'rgba(238,114,2,0.6)'; // Orange Warm
            } else if (heat > 0.4) {
                bg = 'rgba(0,45,98,0.5)'; // Blue cool
            }

            const numStr = i.toString().padStart(2, '0');
            html += `<div class="heatmap-cell fade-in delay-${(i % 5) + 1}" style="background: ${bg}; border: ${border};" title="Número ${numStr}: ${Math.floor(heat * 100)} salidas">
                ${numStr}
            </div>`;
        }
        heatmapContainer.innerHTML = html;
    }

    function renderSubpage(provider, drawName) {
        const container = document.getElementById('subpage-content');
        if (!container) return;

        // Find meta securely
        let meta = Object.values(LOTTERY_META).find(m => m.name === drawName);
        if (!meta) {
            meta = { name: drawName, provider: provider, type: 'diario', color: '#374151', category: 'daily' };
        }

        const mockDrawData = {
            date: new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            balls: meta.category === 'jackpot' ? ['05', '12', '24', '35', '41', '08'] : ['14', '56', '78'],
            prize: meta.category === 'jackpot' ? '$150 Millones' : null
        };

        const prizeBadge = mockDrawData.prize ? `<div class="badge" style="background: var(--accent-red); margin-left: auto;">Acumulado: ${mockDrawData.prize}</div>` : '';

        let html = `
            <button class="filter-btn mb-4" onclick="window.history.back()" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; padding: 0.5rem 1rem;">
                <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> Volver
            </button>
            <div class="subpage-header fade-in" style="border-left: 4px solid ${meta.color}">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 style="color: var(--text-primary); font-size: 2.5rem; margin-bottom: 0.5rem;">${drawName}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;"><span style="color: var(--accent-blue);">${provider}</span> • ${meta.type}</p>
                    </div>
                    ${prizeBadge}
                </div>
            </div>

            <div class="tabs mt-xl">
                <button class="tab-btn active" onclick="switchTab('tab-hoy', event)">Resultados de Hoy</button>
                <button class="tab-btn" onclick="switchTab('tab-comojugar', event)">Cómo Jugar y Premios</button>
                <button class="tab-btn" onclick="switchTab('tab-historico', event)">Histórico</button>
            </div>

            <div id="tab-hoy" class="tab-content mt-4" style="display: block;">
                <div class="glass-panel" style="padding: 2rem;">
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Sorteo de Hoy</h3>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">${mockDrawData.date}</p>
                    <div class="card-results" style="justify-content: flex-start;">
                        ${mockDrawData.balls.map(n => `<div class="ball">${n}</div>`).join('')}
                    </div>
                </div>
            </div>

            <div id="tab-comojugar" class="tab-content mt-4" style="display: none;">
                <div id="comojugar-dynamic-content">
                    <div class="glass-panel" style="padding: 2rem; display: flex; justify-content: center; align-items: center; gap: 1rem;">
                        <i data-lucide="loader-2" class="spin" style="color: var(--accent-blue);"></i> <span style="color: var(--text-muted);">Cargando información...</span>
                    </div>
                </div>
            </div>

            <div id="tab-historico" class="tab-content mt-4" style="display: none;">
                <div class="glass-panel" style="padding: 2rem;">
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Sorteos Anteriores</h3>
                    <p style="color: var(--text-muted);">El historial detallado se cargará pronto.</p>
                    <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); border-radius: 8px; margin-top: 1rem;">
                        <i data-lucide="database" style="color: var(--glass-border); width: 48px; height: 48px;"></i>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        lucide.createIcons();

        // Dynamically fetch the "Cómo Jugar" content from the /pages/providers directory
        if (meta && meta.provider) {
            // Create a normalized key like "Nacional" -> "nacional", "La Primera" -> "la_primera", "USA" -> "usa", "LEIDSA" -> "leidsa"
            const providerKey = meta.provider.toLowerCase().replace(/ /g, '_');
            fetch(`/pages/providers/${providerKey}.html`)
                .then(res => {
                    if (!res.ok) throw new Error('Provider page not found');
                    return res.text();
                })
                .then(htmlContent => {
                    const dynamicContainer = document.getElementById('comojugar-dynamic-content');
                    if (dynamicContainer) {
                        dynamicContainer.innerHTML = htmlContent;
                    }
                })
                .catch(err => {
                    const dynamicContainer = document.getElementById('comojugar-dynamic-content');
                    if (dynamicContainer) {
                        dynamicContainer.innerHTML = `
                            <div class="glass-panel" style="padding: 2rem;">
                                <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Información en Construcción</h3>
                                <p style="color: var(--text-muted);">La información sobre cómo jugar y premios para ${drawName} estará disponible próximamente.</p>
                            </div>
                        `;
                    }
                });
        }
    }

    // Global UI Helper for Subpage Tabs
    window.switchTab = function (tabId, event) {
        document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tabId).style.display = 'block';
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
    }

    // Ensure cards navigate when clicked
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.lottery-card');
        if (card) {
            // Prevent if clicking on specific inner buttons/actions inside the card later
            if (e.target.tagName.toLowerCase() === 'button') return;

            const titleElement = card.querySelector('h3');
            if (!titleElement) return;

            const titleFull = titleElement.innerText;

            const metaObj = Object.values(LOTTERY_META).find(m => m.name === titleFull);
            const provider = metaObj ? metaObj.provider : 'Nacional';

            window.location.hash = `#lottery/${encodeURIComponent(provider)}/${encodeURIComponent(titleFull)}`;
        }
    });

    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // Initialize SPA Router on Load and Hash Change
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
});
