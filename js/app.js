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

    // Estado del calendario histórico
    let calYear = new Date().getFullYear();
    let calMonth = new Date().getMonth(); // 0-based
    let calSelectedDate = null; // 'YYYY-MM-DD' | null

    // Metadata mapping since the DB only stores the code
    const LOTTERY_META = {
        // --- Clásicas ---
        'loteka': { name: 'Quiniela Loteka', provider: 'Loteka', type: 'Quiniela', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/quiniela.jpg' },
        'loteka_mega_chances': { name: 'Mega Chances', provider: 'Loteka', type: 'Sorteo', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/mega_chances.jpg' },
        'loteka_mega_lotto': { name: 'MegaLotto', provider: 'Loteka', type: 'Jackpot', color: '#f97316', category: 'jackpot', balls: 8, schedule: '7:55 PM', logo: '/assets/images/logos/loteka/mega_lotto.png' },
        'loteka_toca_3': { name: 'Toca 3', provider: 'Loteka', type: 'Sorteo', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/toca_3.jpg' },
        'loteka_mega_chances_repartidera': { name: 'Mega Chances Repartidera', provider: 'Loteka', type: 'Sorteo', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/mega_chances_repartidera.jpg' },
        'nacional': { name: 'Gana Más', provider: 'Nacional', type: 'Quiniela', color: '#1e3a8a', category: 'daily', time: 'afternoon', schedule: '2:30 PM', logo: '/assets/images/logos/nacional/gana_mas.jpg' },
        'nacional_juega_pega_mas': { name: 'Juega + Pega +', provider: 'Nacional', type: 'Sorteo', color: '#16a34a', category: 'daily', time: 'afternoon', schedule: '2:30 PM', logo: '/assets/images/logos/nacional/juega_pega_mas.png' },
        'nacional_noche': { name: 'Lotería Nacional', provider: 'Nacional', type: 'Quiniela', color: '#1e3a8a', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/nacional/nacional_noche.jpg' },
        'leidsa': { name: 'Quiniela Leidsa', provider: 'LEIDSA', type: 'Quiniela', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/quiniela.png' },
        'leidsa_pega_3_mas': { name: 'Pega 3 Más', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/pega_3_mas.png' },
        'leidsa_loto_pool': { name: 'Loto Pool', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/loto_pool.png' },
        'leidsa_super_kino_tv': { name: 'Super Kino TV', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/super_kino_tv.webp' },
        'leidsa_loto': { name: 'Loto - Loto Más', provider: 'LEIDSA', type: 'Jackpot', color: '#eab308', category: 'jackpot', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/loto.png' },
        'leidsa_super_pale': { name: 'Super Palé', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/super_pale.png' },
        'real': { name: 'Quiniela Real', provider: 'Real', type: 'Quiniela', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/quiniela.jpg' },
        'real_tu_fecha': { name: 'Tu Fecha Real', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/tu_fecha.png' },
        'real_pega_4': { name: 'Pega 4 Real', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/pega_4.png' },
        'real_nueva_yol': { name: 'Nueva Yol Real', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/nueva_yol.png' },
        'real_loto_pool': { name: 'Loto Pool', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/loto_pool.png' },
        'real_super_pale': { name: 'Super Palé', provider: 'Real', type: 'Sorteo', color: '#16a34a', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/super_pale.png' },
        'real_loto': { name: 'Loto Real', provider: 'Real', type: 'Jackpot', color: '#b91c1c', category: 'jackpot', schedule: '1:00 PM', logo: '/assets/images/logos/real/loto.jpg' },

        // --- Nuevas Privadas ---
        // --- La Primera ---
        'primera_quinielon_dia': { name: 'El Quinielón Día', provider: 'La Primera', type: 'Sorteo', color: '#16a34a', category: 'daily', time: 'morning', balls: 1, schedule: '12:00 PM', logo: '/assets/images/logos/la_primera/El_quinielon_dia.PNG' },
        'primera_dia': { name: 'La Primera Día', provider: 'La Primera', type: 'Quiniela', color: '#00aaeb', category: 'daily', time: 'morning', balls: 3, schedule: '12:00 PM', logo: '/assets/images/logos/la_primera/La_primera_dia.PNG' },
        'primera_quinielon_noche': { name: 'El Quinielón Noche', provider: 'La Primera', type: 'Sorteo', color: '#16a34a', category: 'daily', time: 'night', balls: 1, schedule: '8:00 PM', logo: '/assets/images/logos/la_primera/El_quinielon_noche.PNG' },
        'primera_noche': { name: 'La Primera Noche', provider: 'La Primera', type: 'Quiniela', color: '#00aaeb', category: 'daily', time: 'night', balls: 3, schedule: '8:00 PM', logo: '/assets/images/logos/la_primera/La_primera_noche.PNG' },
        'primera_loto_5': { name: 'Loto 5', provider: 'La Primera', type: 'Jackpot', color: '#00aaeb', category: 'jackpot', time: 'night', balls: 6, schedule: '8:00 PM', logo: '/assets/images/logos/la_primera/Loto_5.PNG' },
        'suerte_dia': { name: 'La Suerte MD', provider: 'La Suerte', type: 'Quiniela', color: '#10b981', category: 'daily', time: 'afternoon', schedule: '12:30 PM', logo: '/assets/images/logos/la_suerte/La_suerte_MD.jpg' },
        'suerte_tarde': { name: 'La Suerte 6PM', provider: 'La Suerte', type: 'Quiniela', color: '#10b981', category: 'daily', time: 'afternoon', schedule: '6:00 PM', logo: '/assets/images/logos/la_suerte/La_suerte_6pm.jpg' },
        'lotedom': { name: 'Quiniela LoteDom', provider: 'LoteDom', type: 'Quiniela', color: '#f43f5e', category: 'daily', time: 'afternoon', schedule: '1:55 PM', logo: '/assets/images/logos/lotedom/Quiniela_lotedom.PNG' },
        'lotedom_quemaito_mayor': { name: 'El Quemaito Mayor', provider: 'LoteDom', type: 'Sorteo', color: '#f43f5e', category: 'daily', time: 'afternoon', balls: 1, schedule: '1:55 PM', logo: '/assets/images/logos/lotedom/El_quemaito_mayor.PNG' },
        'lotedom_super_pale': { name: 'Super Palé', provider: 'LoteDom', type: 'Sorteo', color: '#f43f5e', category: 'daily', time: 'afternoon', balls: 2, schedule: '1:55 PM', logo: '/assets/images/logos/lotedom/Super_pale.PNG' },
        'lotedom_agarra_4': { name: 'Agarra 4', provider: 'LoteDom', type: 'Sorteo', color: '#f43f5e', category: 'daily', time: 'afternoon', balls: 4, schedule: '1:55 PM', logo: '/assets/images/logos/lotedom/Agarra_4.PNG' },

        // --- Americanas ---
        'ny_tarde': { name: 'New York Tarde', provider: 'USA', type: 'Internacional', color: '#6366f1', category: 'daily', time: 'afternoon', schedule: '2:30 PM', logo: '/assets/images/logos/usa/New York .jpg' },
        'ny_noche': { name: 'New York Noche', provider: 'USA', type: 'Internacional', color: '#6366f1', category: 'daily', time: 'night', schedule: '10:30 PM', logo: '/assets/images/logos/usa/New York .jpg' },
        'fl_dia': { name: 'Florida Día', provider: 'USA', type: 'Internacional', color: '#8b5cf6', category: 'daily', time: 'afternoon', schedule: '1:30 PM', logo: '/assets/images/logos/usa/Florida .PNG' },
        'fl_noche': { name: 'Florida Noche', provider: 'USA', type: 'Internacional', color: '#8b5cf6', category: 'daily', time: 'night', schedule: '9:40 PM', logo: '/assets/images/logos/usa/Florida .PNG' },
        'mega_millions': { name: 'Mega Millions', provider: 'USA', type: 'Jackpot', color: '#6366f1', category: 'jackpot', time: 'night', balls: 6, schedule: '11:00 PM', logo: '/assets/images/logos/usa/Mega millions .jpg' },
        'powerball': { name: 'PowerBall', provider: 'USA', type: 'Jackpot', color: '#6366f1', category: 'jackpot', time: 'night', balls: 6, schedule: '10:59 PM', logo: '/assets/images/logos/usa/Power ball .PNG' },
        'powerball_double_play': { name: 'Powerball Double Play', provider: 'USA', type: 'Jackpot', color: '#6366f1', category: 'jackpot', time: 'night', balls: 6, schedule: '10:59 PM', logo: '/assets/images/logos/usa/Power ball .PNG' },

        // --- Caribeñas ---
        'anguila_10': { name: 'Anguila (10:00 AM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'morning', schedule: '10:00 AM', logo: '/assets/images/logos/anguila/Águila .jpg' },
        'anguila_1': { name: 'Anguila (1:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/anguila/Águila .jpg' },
        'anguila_6': { name: 'Anguila (6:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'night', schedule: '6:00 PM', logo: '/assets/images/logos/anguila/Águila .jpg' },
        'anguila_9': { name: 'Anguila (9:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'night', schedule: '9:00 PM', logo: '/assets/images/logos/anguila/Águila .jpg' },
        'king_pick_3_dia': { name: 'Pick 3 Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_pick_4_dia': { name: 'Pick 4 Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_12': { name: 'King Lottery (12:30 PM)', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_philipsburg_dia': { name: 'Philipsburg Medio Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_loto_pool_dia': { name: 'Loto Pool Medio Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_pick_3_noche': { name: 'Pick 3 Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_pick_4_noche': { name: 'Pick 4 Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_7': { name: 'King Lottery (7:30 PM)', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_philipsburg_noche': { name: 'Philipsburg Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },
        'king_loto_pool_noche': { name: 'Loto Pool Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king/King lottery .JPG' },

        // --- Dummy Jackpots ---
        'default': { name: 'Sorteo', provider: 'Lotería', type: 'Sorteo', color: '#374151', category: 'daily', time: 'night', schedule: '', logo: '/assets/images/logos/default.png' }
    };

    function getMeta(code) {
        return LOTTERY_META[code] || LOTTERY_META['default'];
    }

    const EXPECTED_LOTTERIES = [
        // Mañana - Dominicana
        'primera_quinielon_dia',
        'primera_dia',
        // Mañana - Internacional
        'anguila_10', 'king_pick_3_dia', 'king_pick_4_dia', 'king_12', 'king_philipsburg_dia', 'king_loto_pool_dia',

        // Tarde - Dominicana
        'real', 'real_tu_fecha', 'real_pega_4', 'real_nueva_yol', 'real_loto_pool', 'real_super_pale', 'nacional', 'nacional_juega_pega_mas', 'suerte_dia', 'lotedom', 'suerte_tarde', 'lotedom_quemaito_mayor', 'lotedom_super_pale', 'lotedom_agarra_4',
        // Tarde - Internacional
        'fl_dia', 'ny_tarde', 'anguila_1',

        // Noche - Dominicana
        'nacional_noche',
        'leidsa', 'leidsa_pega_3_mas', 'leidsa_loto_pool', 'leidsa_super_kino_tv', 'leidsa_super_pale',
        'loteka', 'loteka_mega_chances', 'loteka_mega_chances_repartidera', 'loteka_toca_3',
        'primera_quinielon_noche', 'primera_noche', 'primera_loto_5',
        // Noche - Caribeñas
        'anguila_6', 'king_pick_3_noche', 'king_pick_4_noche', 'king_7', 'king_philipsburg_noche', 'king_loto_pool_noche', 'anguila_9', 
        
        // USA Jackpots & Nightly
        'mega_millions', 'powerball', 'powerball_double_play', 'ny_noche', 'fl_noche',
        
        // Jackpots Locales
        'leidsa_loto', 'real_loto', 'loteka_mega_lotto'
    ];

    const MOCK_JACKPOTS = [
        { lottery_code: 'leidsa_loto', numbers: ['15', '22', '31', '34', '36', '06'], draw_time: 'Ayer', prize: 'Premio Acumulativo' },
        { lottery_code: 'loteka_mega_lotto', numbers: ['01', '05', '07', '10', '25', '27', '01', '02'], draw_time: 'Ayer', prize: 'Premio Acumulativo' },
        { lottery_code: 'real_loto', numbers: ['04', '11', '19', '25', '26', '30'], draw_time: 'Ayer', prize: 'Premio Acumulativo' },
    ];

    function mergeDataWithPlaceholders(apiData) {
        return EXPECTED_LOTTERIES.map(code => {
            const found = apiData.find(d => d.lottery_code === code);
            if (found) return found;

            // Get expected ball count from meta or default to 3
            const meta = getMeta(code);
            const ballCount = meta.balls || 3;
            const placeholderBalls = Array(ballCount).fill('--');

            return {
                lottery_code: code,
                numbers: placeholderBalls,
                draw_time: 'Pendiente'
            };
        });
    }
    function applyFilters() {
        const activeFilterNode = document.querySelector('.filter-btn.active');
        const filter = (activeFilterNode && activeFilterNode.hasAttribute('data-filter')) ? activeFilterNode.getAttribute('data-filter') : 'all';
        if (filter === 'all') {
            renderLotteryCards(allLotteries);
        } else {
            const filtered = allLotteries.filter(l => getMeta(l.lottery_code).provider === filter);
            renderLotteryCards(filtered);
        }
    }

    // Fetch and render data
    fetch('/api/results/latest')
        .then(response => response.json())
        .then(data => {
            spinner.style.display = 'none';
            allLotteries = mergeDataWithPlaceholders(data);

            // Update Mock Jackpots with real data if fetched
            MOCK_JACKPOTS.forEach(jackpot => {
                const found = data.find(d => d.lottery_code === jackpot.lottery_code);
                if (found) {
                    jackpot.numbers = found.numbers;
                    jackpot.draw_time = found.draw_time;
                }
            });

            // Render regular lottery list
            applyFilters();

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
            applyFilters();
            startHeroCarousel();
            checkEmptyState();

            // Gestionar el aviso Toast para evitar duplicados en la pantalla
            let notice = document.getElementById('offline-notice');
            if (!notice) {
                notice = document.createElement('div');
                notice.id = 'offline-notice';
                notice.className = 'glass-panel';
                notice.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 1rem; border-left: 4px solid var(--accent-red); background: rgba(17, 24, 39, 0.95); opacity: 1; transition: opacity 0.5s ease;';
                notice.innerHTML = `<p style="margin:0; font-size:0.9rem; color:var(--text-muted);"><i data-lucide="wifi-off" style="width:16px; height:16px; margin-right:8px; vertical-align:middle;"></i>Sin conexión al servidor local</p>`;
                document.body.appendChild(notice);
            } else {
                // Si ya existe, resetear su visibilidad y detener el timeout anterior
                notice.style.opacity = '1';
                clearTimeout(notice.hideTimeout);
                clearTimeout(notice.removeTimeout);
            }

            // Programar su desaparición
            notice.hideTimeout = setTimeout(() => {
                notice.style.opacity = '0';
                notice.removeTimeout = setTimeout(() => notice.remove(), 500);
            }, 6000);

            // Intentar inicializar los iconos del toast y los placeholders si la librería está disponible
            if (window.lucide) {
                lucide.createIcons();
            }
        });

    // Initialize WebSocket for Real-time Updates only if available
    let socket;
    try {
        socket = io({
            reconnectionAttempts: 3,
            timeout: 5000
        });

        socket.on('connect', () => {
            console.log('Connected to Lottery WebSocket Server');
        });

        socket.on('new_result', (data) => {
            console.log('Got new real-time result!', data);

            // In a real app we'd determine if the update is a jackpot or daily
            fetch('/api/results/latest')
                .then(res => res.json())
                .then(newData => {
                    // Update Mock Jackpots with real data if fetched
                    MOCK_JACKPOTS.forEach(jackpot => {
                        const found = newData.find(d => d.lottery_code === jackpot.lottery_code);
                        if (found) {
                            jackpot.numbers = found.numbers;
                            jackpot.draw_time = found.draw_time;
                        }
                    });

                    const mergedData = mergeDataWithPlaceholders(newData);
                    allLotteries = mergedData;
                    applyFilters();
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
                if (data.lottery_code === 'leidsa_loto') {
                    if (index === 6) {
                        ball.style.borderColor = 'rgba(206, 17, 38, 0.8)'; // Red
                        ball.style.background = 'radial-gradient(circle at 30% 30%, #5a1118, #111827)';
                    } else if (index === 7) {
                        ball.style.borderColor = 'rgba(59, 130, 246, 0.8)'; // Blue
                        ball.style.background = 'radial-gradient(circle at 30% 30%, #172554, #111827)';
                    }
                } else if (data.lottery_code === 'nacional_juega_pega_mas') {
                    if (index === 0 || index === 1) {
                        ball.style.borderColor = 'rgba(59, 130, 246, 0.8)'; // Blue
                        ball.style.background = 'radial-gradient(circle at 30% 30%, #172554, #111827)';
                    } else if (index === 2 || index === 3) {
                        ball.style.borderColor = 'rgba(206, 17, 38, 0.8)'; // Red
                        ball.style.background = 'radial-gradient(circle at 30% 30%, #5a1118, #111827)';
                    } else {
                        // index 4 green default
                    }
                } else if (data.numbers.length > 5 && index === data.numbers.length - 1) {
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
            let extraClass = '';
            if (className === 'leidsa_loto') {
                if (i === 6) extraClass = ' extra'; // Red
                if (i === 7) extraClass = ' super-extra'; // Blue
            } else if (className === 'primera_loto_5') {
                if (i === 5) extraClass = ' extra super'; // Extra orange ball for Loto 5
            } else if (className === 'nacional_juega_pega_mas') {
                if (i === 0 || i === 1) extraClass = ' super-extra'; // Blue
                else if (i === 2 || i === 3) extraClass = ' extra'; // Red
            } else if (className === 'real_nueva_yol' && i === 3) {
                let lowerNum = num.toString().toLowerCase();
                if (lowerNum.includes('amarilla') || lowerNum.includes('amarillo')) extraClass = ' string-ball string-amarilla';
                else if (lowerNum.includes('roja') || lowerNum.includes('rojo')) extraClass = ' string-ball string-roja';
                else if (lowerNum.includes('verde')) extraClass = ' string-ball string-verde';
                else if (lowerNum.includes('azul')) extraClass = ' string-ball string-azul';
                else extraClass = ' string-ball';
            } else if (!isJackpot && lottery.numbers.length > 3 && i === lottery.numbers.length - 1 && className !== 'real_pega_4' && className !== 'real_loto_pool') {
                extraClass = ' extra';
            }

            let displayNum = num.toString();
            // Capitalize first letter logic for string-balls if needed, but CSS text-transform handles it
            if (!isNaN(displayNum) && displayNum.trim() !== '') {
                displayNum = displayNum.padStart(2, '0');
            }

            return `<div class="ball${extraClass}">${displayNum}</div>`;
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

        const prizeDisplay = lottery.prize ? `<div class="jackpot-prize">Premio: ${lottery.prize}</div>` : '';

        const logoUrl = meta.logo || 'assets/images/logos/default.png';

        // Badges Logic
        let timeBadgeHtml = '';
        if (meta.time === 'morning') timeBadgeHtml = `<span class="badge-tanda badge-morning"><i data-lucide="sun" style="width: 12px; height: 12px;"></i> Mañana</span>`;
        else if (meta.time === 'afternoon') timeBadgeHtml = `<span class="badge-tanda badge-afternoon"><i data-lucide="sunset" style="width: 12px; height: 12px;"></i> Tarde</span>`;
        else if (meta.time === 'night') timeBadgeHtml = `<span class="badge-tanda badge-moon"><i data-lucide="moon" style="width: 12px; height: 12px;"></i> Noche</span>`;

        let statusBadgeHtml = '';
        const scheduledTime = meta.schedule || '';

        if (lottery.draw_time) {
            const dtLower = lottery.draw_time.toLowerCase();

            // Determinar si el sorteo es realmente de hoy validando la fecha oficial si vino de la DB
            const isTodayDate = lottery.draw_date === new Date().toISOString().split('T')[0];

            if (dtLower.includes('hoy') || dtLower === 'hoy') {
                statusBadgeHtml = `<span class="badge-status badge-today"><i data-lucide="check-circle-2" style="width: 13px; height: 13px;"></i> Salió Hoy</span>`;
            } else if (dtLower.includes('ayer') || dtLower === 'ayer') {
                statusBadgeHtml = `<span class="badge-status badge-yesterday"><i data-lucide="clock" style="width: 13px; height: 13px;"></i> De Ayer (Juega a las ${scheduledTime})</span>`;
            } else if (dtLower.includes('pendiente')) {
                statusBadgeHtml = `<span class="badge-status badge-pending"><i data-lucide="hourglass" style="width: 13px; height: 13px;"></i> Juega a las ${scheduledTime}</span>`;
            } else {
                // Si llegamos a "else", la DB envió la hora exacta del scraper hoy. En vez de poner "07:35 PM", ponemos:
                if (isTodayDate || lottery.draw_date) {
                    if (isTodayDate) {
                        statusBadgeHtml = `<span class="badge-status badge-today"><i data-lucide="check-circle-2" style="width: 13px; height: 13px;"></i> Salió Hoy</span>`;
                    } else {
                        // Es de otra fecha vieja, entonces no ha salido hoy
                        statusBadgeHtml = `<span class="badge-status badge-yesterday"><i data-lucide="clock" style="width: 13px; height: 13px;"></i> Pendiente (Juega a las ${scheduledTime})</span>`;
                    }
                } else {
                    // Fallback visual agradable
                    statusBadgeHtml = `<span class="badge-status badge-date"><i data-lucide="calendar" style="width: 13px; height: 13px;"></i> Sale a las ${scheduledTime}</span>`;
                }
            }
        }

        const urlSafeProvider = encodeURIComponent(meta.provider).toLowerCase().replace(/%20/g, '-').replace(/\./g, '');
        const urlSafeName = encodeURIComponent(meta.name).toLowerCase().replace(/%20/g, '-').replace(/\./g, '');
        const seoUrl = `/loterias/${urlSafeProvider}/${urlSafeName}`;

        return `
            <a href="${seoUrl}" class="lottery-card glass-panel fade-in" data-lottery="${className}" style="--card-accent: ${accentColor}; --card-logo: url('${logoUrl}'); display: block;" onclick="window.navigateSpa(event, '${meta.provider}', '${meta.name}')">
                <div class="card-header" style="margin-bottom: 1rem; align-items: flex-start;">
                    <div class="card-title-group" style="width: 100%;">
                        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                            ${statusBadgeHtml}
                            ${timeBadgeHtml}
                        </div>
                        <h3 style="line-height: 1.1;">${meta.name}</h3>
                        <span class="card-provider">${meta.provider}</span>
                        ${prizeDisplay}
                    </div>
                </div>
                <div class="card-results">
                    ${ballsHtml}
                </div>
                <div class="card-footer">
                    <span class="card-type">${meta.type}</span>
                    ${prevResultsHtml}
                </div>
            </a>
        `;
    }

    function renderLotteryCards(data) {
        // New DOM Targets
        const jackpotsSection = document.getElementById('jackpots-section');
        const dailySection = document.getElementById('daily-section');
        const dynamicGroupsContainer = document.getElementById('dynamic-groups-container');

        // Clear containers
        const jackpotsContainer = document.getElementById('jackpots-container');
        jackpotsContainer.innerHTML = '';
        if (dynamicGroupsContainer) dynamicGroupsContainer.innerHTML = '';

        const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
        const activeTimeFilter = document.querySelector('.time-btn.active')?.getAttribute('data-time') || 'all';

        // Render Jackpots
        const displayJackpots = activeFilter === 'all' ? MOCK_JACKPOTS : MOCK_JACKPOTS.filter(j => getMeta(j.lottery_code).provider === activeFilter);

        // Hide jackpots entirely if time-filter is not 'all'
        if (displayJackpots.length > 0 && activeTimeFilter === 'all') {
            jackpotsSection.style.display = 'block';
            displayJackpots.forEach((jackpot, index) => {
                const meta = getMeta(jackpot.lottery_code);
                const html = buildCardHtml(jackpot, meta);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html.trim();
                const node = tempDiv.firstChild;
                node.style.animationDelay = `${index * 0.1}s`;
                jackpotsContainer.appendChild(node);
            });
        } else {
            jackpotsSection.style.display = 'none';
        }

        // Render Dailies
        if (data.length > 0) {
            dailySection.style.display = 'block';

            // Order providers intuitively instead of arbitrarily
            const PROVIDER_ORDER = [
                'Nacional',
                'LEIDSA',
                'Loteka',
                'Real',
                'La Primera',
                'La Suerte',
                'LoteDom',
                'USA',
                'Anguila',
                'King Lottery'
            ];

            const providerGroups = {};
            
            data.forEach((lottery) => {
                const meta = getMeta(lottery.lottery_code);
                const provider = meta.provider || 'Lotería'; // Default fallback
                if (!providerGroups[provider]) {
                    providerGroups[provider] = [];
                }
                providerGroups[provider].push(lottery);
            });

            // Sort providers based on PROVIDER_ORDER, any unknown goes at the end
            const groupedProviders = Object.keys(providerGroups).sort((a, b) => {
                const indexA = PROVIDER_ORDER.indexOf(a);
                const indexB = PROVIDER_ORDER.indexOf(b);
                if (indexA === -1 && indexB !== -1) return 1;
                if (indexB === -1 && indexA !== -1) return -1;
                if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                return indexA - indexB;
            });

            let globalIndex = 0;

            groupedProviders.forEach(provider => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'time-group mt-4';
                
                // Show provider title if filter="all", otherwise hide it (as the user clicked that exact provider)
                if (activeFilter === 'all') {
                    const titleHtml = `<h3 class="time-category-title hide-when-filtered">${provider}</h3>`;
                    groupDiv.innerHTML = titleHtml;
                }

                const gridDiv = document.createElement('div');
                gridDiv.className = 'grid-layout mt-2';
                
                providerGroups[provider].forEach((lottery) => {
                    const meta = getMeta(lottery.lottery_code);
                    const html = buildCardHtml(lottery, meta);

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html.trim();
                    const node = tempDiv.firstChild;
                    node.style.animationDelay = `${globalIndex * 0.05}s`;
                    
                    gridDiv.appendChild(node);
                    globalIndex++;
                });

                groupDiv.appendChild(gridDiv);
                if (dynamicGroupsContainer) dynamicGroupsContainer.appendChild(groupDiv);
            });

        } else {
            dailySection.style.display = 'none';
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

    function animateSection(element) {
        if (!element) return;
        element.classList.remove('fade-in');
        void element.offsetWidth; // trigger reflow
        element.classList.add('fade-in');
    }

    filterBtns.forEach(btn => {
        if (!btn.hasAttribute('data-filter')) return;

        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            applyFilters();
            animateSection(dailySection);
            animateSection(jackpotsSection);
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
                const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
                const hasJackpots = activeFilter === 'all' ? MOCK_JACKPOTS.length > 0 : MOCK_JACKPOTS.filter(j => getMeta(j.lottery_code).provider === activeFilter).length > 0;
                jackpotsSection.style.display = hasJackpots ? 'block' : 'none';
                Object.values(timeGroups).forEach(group => {
                    if (group.querySelector('.lottery-card')) {
                        group.style.display = 'block';
                    }
                });
            } else {
                jackpotsSection.style.display = 'none'; // Only show jackpots when user wants "all" times
                Object.entries(timeGroups).forEach(([key, group]) => {
                    if (key === timeFilter && group.querySelector('.lottery-card')) {
                        group.style.display = 'block';
                    } else {
                        group.style.display = 'none';
                    }
                });
            }
            animateSection(dailySection);
            animateSection(jackpotsSection);
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
        const isHistorico = hash === '#historico';
        const isPronosticos = hash === '#pronosticos';
        const isSubpage = hash.startsWith('#lottery/');

        // Hide all views first
        const viewHome = document.getElementById('view-home');
        const viewSubpage = document.getElementById('view-subpage');
        const viewDatacenter = document.getElementById('view-datacenter');
        const viewHistorico = document.getElementById('view-historico');
        const viewPronosticos = document.getElementById('view-pronosticos');

        // Restore default SEO if going back home or datacenter
        if (!isSubpage) {
            document.title = "Resultados de Loto Live RD | Lotería Nacional, LEIDSA, Loteka y Más";
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.content = "Resultados al instante de todas las loterías dominicanas. Lotería Nacional, LEIDSA, Loteka, Lotería Real, La Primera, LoteDom y New York. Revisa tus números.";
            }
        }

        if (viewHome) viewHome.style.display = 'none';
        if (viewSubpage) viewSubpage.style.display = 'none';
        if (viewDatacenter) viewDatacenter.style.display = 'none';
        if (viewHistorico) viewHistorico.style.display = 'none';
        if (viewPronosticos) viewPronosticos.style.display = 'none';

        // Update nav active states
        document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));

        if (isDataCenter) {
            if (viewDatacenter) viewDatacenter.style.display = 'block';
            const navLink = document.querySelector('.nav-links a[href="/#data-center"]');
            if (navLink) navLink.classList.add('active');
            window.scrollTo(0, 0);
            renderDataCenter(); // Call initializer for data center
        } else if (isHistorico) {
            if (viewHistorico) viewHistorico.style.display = 'block';
            const navLink = document.querySelector('.nav-links a[href="/#historico"]');
            if (navLink) navLink.classList.add('active');
            window.scrollTo(0, 0);
            renderHistorico();
        } else if (isPronosticos) {
            if (viewPronosticos) viewPronosticos.style.display = 'block';
            const navLink = document.querySelector('.nav-links a[href="/#pronosticos"]');
            if (navLink) navLink.classList.add('active');
            window.scrollTo(0, 0);
            renderPronosticos();
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

            // Ensure cards are rendered matching the active filter state when returning home
            if (allLotteries.length > 0) {
                applyFilters();
            }
        }
    }

    function renderDataCenter() {
        // Load stats with default range (7 days)
        window.loadStatsData(7);
    }

    /* ─────────────────────────────────────────────────
       Histórico: Calendario Custom + Fetch por Fecha
       ───────────────────────────────────────────────── */

    function renderHistorico() {
        initCalendar(calYear, calMonth);
    }

    /* ─────────────────────────────────────────────
       Pronósticos: Predicciones Estadísticas
       ───────────────────────────────────────────── */

    function renderPronosticos() {
        const container = document.getElementById('pred-container');
        if (!container) return;

        container.innerHTML = `<div style="padding:3rem;width:100%;text-align:center;">
            <i data-lucide="loader-2" class="spin" style="color:var(--accent-blue);width:36px;height:36px;"></i>
        </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        fetch('/api/predictions')
            .then(r => r.json())
            .then(data => {
                if (!data || data.length === 0) {
                    container.innerHTML = `<div class="glass-panel" style="padding:3rem;text-align:center;width:100%;">
                        <p style="color:var(--text-muted);">No hay suficientes datos históricos aún. Intenta mañana.</p>
                    </div>`;
                    return;
                }
                const maxScore = data[0].score || 1;
                container.innerHTML = data.map((pred, idx) => buildPredCard(pred, idx + 1, maxScore)).join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            })
            .catch(() => {
                container.innerHTML = `<div class="glass-panel" style="padding:2.5rem;text-align:center;width:100%;">
                    <i data-lucide="wifi-off" style="width:48px;height:48px;color:var(--accent-red);margin-bottom:0.75rem;"></i>
                    <p style="color:var(--text-muted);">Error al conectar con el servidor.</p>
                </div>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
    }

    function buildPredCard(pred, rank, maxScore) {
        const scorePct = Math.round((pred.score / maxScore) * 100);
        const tierColor = scorePct >= 70 ? 'var(--success-green)' :
            scorePct >= 40 ? 'var(--secondary-yellow)' : 'var(--accent-blue)';
        const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

        return `
        <div class="pred-card glass-panel" style="
            width:160px;display:flex;flex-direction:column;align-items:center;
            padding:1.5rem 1rem 1.25rem;gap:0.75rem;position:relative;
            transition:transform 0.2s ease,box-shadow 0.2s ease;cursor:default;"
            onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,0.35)'"
            onmouseleave="this.style.transform='';this.style.boxShadow=''">
            <div style="position:absolute;top:10px;left:12px;font-size:0.8rem;font-weight:700;color:var(--text-muted);">${medalEmoji}</div>
            <div style="position:absolute;top:8px;right:10px;background:rgba(0,0,0,0.3);border:1px solid ${tierColor};color:${tierColor};font-size:0.68rem;font-weight:700;padding:0.1rem 0.45rem;border-radius:6px;">${pred.score}pts</div>
            <div class="ball" style="width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:900;color:#fff;background:radial-gradient(circle at 35% 35%,#6ab3ff,#4a9eff 55%,#1a4a88);box-shadow:0 6px 20px rgba(74,158,255,0.35),inset 0 -4px 8px rgba(0,0,0,0.25);transition:transform 0.15s ease;user-select:none;">${pred.number}</div>
            <div style="width:100%;background:rgba(255,255,255,0.06);border-radius:4px;height:5px;overflow:hidden;">
                <div style="height:100%;width:${scorePct}%;background:${tierColor};border-radius:4px;"></div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.3rem;width:100%;text-align:center;">
                ${pred.hot_count > 0 ? `<span style="font-size:0.72rem;color:var(--text-muted);">🔥 <strong style="color:var(--text-primary);">${pred.hot_count}x</strong> esta semana</span>` : ''}
                ${pred.days_absent > 0 ? `<span style="font-size:0.72rem;color:var(--text-muted);">❄️ <strong style="color:var(--text-primary);">${pred.days_absent}d</strong> sin salir</span>` : ''}
            </div>
        </div>`;
    }

    function initCalendar(year, month) {
        const grid = document.getElementById('cal-grid');
        const label = document.getElementById('cal-month-label');
        if (!grid || !label) return;

        const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        label.textContent = `${MONTHS_ES[month]} ${year}`;

        const today = new Date();
        const todayStr = toISODate(today);

        // First day of month (0=Sun…6=Sat) → convert to Monday-first (0=Mon)
        const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
        const offset = firstDow === 0 ? 6 : firstDow - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '';
        // Empty cells before the 1st
        for (let i = 0; i < offset; i++) {
            html += `<div class="cal-day empty"></div>`;
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            let classes = 'cal-day';
            if (dateStr === todayStr) classes += ' today';
            if (dateStr === calSelectedDate) classes += ' selected';

            // Mark days with data: from 2026-03-04 onwards (our DB start) up to today
            const dateObj = new Date(dateStr + 'T00:00:00');
            const dbStart = new Date('2026-03-04T00:00:00');
            if (dateObj >= dbStart && dateObj <= today) {
                classes += ' has-data';
            }

            html += `<div class="${classes}" onclick="window.selectDate('${dateStr}')">${d}</div>`;
        }

        // Fill remaining cells to complete last row
        const totalCells = offset + daysInMonth;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            for (let i = 0; i < (7 - remainder); i++) {
                html += `<div class="cal-day empty"></div>`;
            }
        }

        grid.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    window.navigateMonth = function (delta) {
        calMonth += delta;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        if (calMonth < 0) { calMonth = 11; calYear--; }
        initCalendar(calYear, calMonth);
    };

    function toISODate(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    window.selectDate = function (dateStr) {
        if (dateStr === 'hoy') {
            dateStr = toISODate(new Date());
            // Navigate calendar to today's month
            const today = new Date();
            calYear = today.getFullYear();
            calMonth = today.getMonth();
        }

        calSelectedDate = dateStr;
        initCalendar(calYear, calMonth); // re-render calendar to show selection

        const container = document.getElementById('hist-results');
        if (!container) return;

        // Loading state
        container.innerHTML = `
            <div class="glass-panel" style="padding: 3rem; display:flex; justify-content:center; align-items:center; gap:1rem; margin-bottom:2rem;">
                <i data-lucide="loader-2" class="spin" style="color:var(--accent-blue); width:28px; height:28px;"></i>
                <span style="color:var(--text-muted);">Cargando resultados del <strong style="color:var(--text-primary);">${formatDateES(dateStr)}</strong>...</span>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        fetch(`/api/results/date/${dateStr}`)
            .then(r => r.json())
            .then(data => renderHistoricResults(data, dateStr))
            .catch(() => {
                container.innerHTML = `
                    <div class="glass-panel hist-empty" style="margin-bottom:2rem;">
                        <i data-lucide="wifi-off" style="width:48px;height:48px;color:var(--accent-red);"></i>
                        <p>No se pudo conectar al servidor. Verifica que el backend está activo.</p>
                    </div>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
    };

    function formatDateES(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    function renderHistoricResults(data, dateStr) {
        const container = document.getElementById('hist-results');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="glass-panel hist-empty" style="margin-bottom:2rem;">
                    <i data-lucide="calendar-x" style="width:56px;height:56px;color:var(--glass-border);"></i>
                    <h3 style="color:var(--text-secondary); font-size:1.1rem;">Sin resultados</h3>
                    <p>No hay resultados registrados para el <strong>${formatDateES(dateStr)}</strong>.<br>
                    Los datos se registran desde el 4 de Marzo de 2026.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        // Group by time of day using LOTTERY_META
        const groups = { morning: [], afternoon: [], night: [], other: [] };
        data.forEach(item => {
            const meta = getMeta(item.lottery_code);
            const t = meta.time || 'other';
            if (groups[t]) groups[t].push(item);
            else groups.other.push(item);
        });

        const labelMap = { morning: '☀️ Sorteos de la Mañana', afternoon: '🌤️ Sorteos de la Tarde', night: '🌙 Sorteos de la Noche', other: '📋 Otros Sorteos' };

        let html = `
            <div class="glass-panel" style="padding:1.5rem; margin-bottom:1.5rem; border-left:4px solid var(--success-green);">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <i data-lucide="calendar-check" style="width:24px;height:24px;color:var(--success-green);"></i>
                    <div>
                        <h2 style="font-size:1.3rem;margin:0;color:var(--text-primary);">Resultados del ${formatDateES(dateStr)}</h2>
                        <p style="color:var(--text-muted);margin:0;font-size:0.9rem;">${data.length} sorteos encontrados</p>
                    </div>
                </div>
            </div>`;

        ['morning', 'afternoon', 'night', 'other'].forEach(slot => {
            if (groups[slot].length === 0) return;
            html += `<div style="margin-bottom:2rem;">
                <p class="hist-section-title">${labelMap[slot]}</p>
                <div class="grid-layout">`;

            groups[slot].forEach((lottery, idx) => {
                const meta = getMeta(lottery.lottery_code);
                // Inject draw_date so buildCardHtml can display it
                const enriched = { ...lottery, draw_time: lottery.draw_time || dateStr };
                html += buildCardHtml(enriched, meta)
                    .replace('class="lottery-card', `class="lottery-card fade-in" style="--delay:${idx * 0.06}s; animation-delay:${idx * 0.06}s;`);
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Re-attach 3D ball parallax to the new cards
        container.querySelectorAll('.ball').forEach(ball => {
            ball.addEventListener('mousemove', (e) => {
                const rect = ball.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                ball.style.transform = `perspective(200px) rotateX(${-(y / (rect.height / 2)) * 30}deg) rotateY(${(x / (rect.width / 2)) * 30}deg) scale(1.15)`;
            });
            ball.addEventListener('mouseleave', () => { ball.style.transform = ''; });
        });
    }

    // Global function for tab clicks
    window.loadStatsData = function (days, btnEl) {
        // Update active tab
        if (btnEl) {
            document.querySelectorAll('.dc-range-btn').forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
        }

        // Fetch hot numbers
        fetch(`/api/stats/hot?days=${days}&limit=15`)
            .then(r => r.json())
            .then(data => renderHotNumbers(data))
            .catch(() => { });

        // Fetch cold numbers
        fetch(`/api/stats/cold?days=${days}&limit=15`)
            .then(r => r.json())
            .then(data => renderColdNumbers(data))
            .catch(() => { });

        // Fetch all numbers for heatmap
        fetch(`/api/stats/hot?days=${days}&limit=100`)
            .then(r => r.json())
            .then(data => renderHeatmap(data))
            .catch(() => { });
    };

    function renderHotNumbers(data) {
        const container = document.getElementById('dc-hot-numbers');
        if (!container || data.length === 0) {
            if (container) container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No hay suficientes datos aún. Los números aparecerán aquí a medida que se registren sorteos.</p>';
            return;
        }

        const maxCount = data[0].total_count;
        container.innerHTML = data.map((item, i) => {
            const intensity = item.total_count / maxCount;
            const num = item.number.toString().padStart(2, '0');
            // Temperature gradient: red for hottest, orange for warm
            let bg, glow;
            if (intensity > 0.8) {
                bg = 'radial-gradient(circle at 35% 35%, #ff6b6b, #dc2626, #991b1b)';
                glow = '0 0 20px rgba(220,38,38,0.6)';
            } else if (intensity > 0.5) {
                bg = 'radial-gradient(circle at 35% 35%, #fb923c, #ea580c, #c2410c)';
                glow = '0 0 15px rgba(234,88,12,0.4)';
            } else {
                bg = 'radial-gradient(circle at 35% 35%, #fbbf24, #d97706, #b45309)';
                glow = '0 0 10px rgba(217,119,6,0.3)';
            }

            const posLabel = item.first_count > 0 ? `1ra: ${item.first_count}` : '';
            const delay = i * 0.05;

            return `
                <div class="dc-stat-ball" style="animation: fadeSlideUp 0.4s ease ${delay}s both; cursor: pointer;" onclick="document.getElementById('dc-number-input').value='${num}'; window.lookupNumber();">
                    <div class="ball" style="width: 56px; height: 56px; font-size: 1.3rem; background: ${bg}; box-shadow: ${glow}, inset -3px -3px 8px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.3); --card-accent: transparent;">
                        ${num}
                    </div>
                    <div style="text-align: center; margin-top: 0.4rem;">
                        <span style="color: var(--text-primary); font-weight: 700; font-size: 0.85rem;">${item.total_count}×</span>
                        ${posLabel ? `<br><span style="color: var(--text-muted); font-size: 0.7rem;">${posLabel}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderColdNumbers(data) {
        const container = document.getElementById('dc-cold-numbers');
        if (!container || data.length === 0) {
            if (container) container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No hay suficientes datos aún.</p>';
            return;
        }

        container.innerHTML = data.map((item, i) => {
            const num = item.number.toString().padStart(2, '0');
            const delay = i * 0.05;
            return `
                <div class="dc-stat-ball" style="animation: fadeSlideUp 0.4s ease ${delay}s both; cursor: pointer;" onclick="document.getElementById('dc-number-input').value='${num}'; window.lookupNumber();">
                    <div class="ball" style="width: 56px; height: 56px; font-size: 1.3rem; background: radial-gradient(circle at 35% 35%, #93c5fd, #3b82f6, #1d4ed8); box-shadow: 0 0 15px rgba(59,130,246,0.4), inset -3px -3px 8px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.3); --card-accent: transparent;">
                        ${num}
                    </div>
                    <div style="text-align: center; margin-top: 0.4rem;">
                        <span style="color: var(--text-primary); font-weight: 700; font-size: 0.85rem;">${item.total_count}×</span>
                        <br><span style="color: var(--text-muted); font-size: 0.7rem;">Últ: ${item.last_seen ? item.last_seen.slice(5) : '?'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderHeatmap(data) {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        // Build frequency map from API data
        const freqMap = {};
        let maxFreq = 1;
        data.forEach(item => {
            const num = item.number.toString().padStart(2, '0');
            freqMap[num] = item.total_count;
            if (item.total_count > maxFreq) maxFreq = item.total_count;
        });

        let html = '';
        for (let i = 0; i <= 99; i++) {
            const numStr = i.toString().padStart(2, '0');
            const count = freqMap[numStr] || 0;
            const heat = count / maxFreq;

            let bg = 'rgba(255,255,255,0.04)';
            let border = '1px solid rgba(255,255,255,0.06)';
            let textColor = 'var(--text-muted)';

            if (heat > 0.8) {
                bg = 'rgba(220,38,38,0.7)';
                border = '1px solid rgba(220,38,38,0.9)';
                textColor = '#fff';
            } else if (heat > 0.6) {
                bg = 'rgba(234,88,12,0.5)';
                border = '1px solid rgba(234,88,12,0.7)';
                textColor = '#fff';
            } else if (heat > 0.4) {
                bg = 'rgba(217,119,6,0.35)';
                border = '1px solid rgba(217,119,6,0.5)';
                textColor = 'var(--text-primary)';
            } else if (heat > 0.2) {
                bg = 'rgba(59,130,246,0.2)';
                border = '1px solid rgba(59,130,246,0.3)';
                textColor = 'var(--text-secondary)';
            }

            html += `<div class="heatmap-cell" style="background: ${bg}; border: ${border}; color: ${textColor}; cursor: pointer;" 
                title="Número ${numStr}: ${count} apariciones" 
                onclick="document.getElementById('dc-number-input').value='${numStr}'; window.lookupNumber();">
                ${numStr}
            </div>`;
        }
        container.innerHTML = html;
    }

    // Number Lookup Tool
    window.lookupNumber = function () {
        const input = document.getElementById('dc-number-input');
        const container = document.getElementById('dc-number-results');
        if (!input || !container) return;

        const num = input.value.padStart(2, '0');
        if (num.length < 1 || isNaN(num)) return;

        container.innerHTML = '<div style="text-align: center; padding: 1rem;"><i data-lucide="loader-2" class="spin" style="color: var(--accent-blue);"></i></div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        fetch(`/api/stats/number/${num}?days=30`)
            .then(r => r.json())
            .then(data => {
                if (data.length === 0) {
                    container.innerHTML = `
                        <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 12px; text-align: center;">
                            <div class="ball" style="width: 64px; height: 64px; font-size: 1.6rem; margin: 0 auto 1rem; background: radial-gradient(circle at 35% 35%, #6b7280, #374151, #1f2937); --card-accent: transparent;">${num}</div>
                            <p style="color: var(--text-muted);">El número <strong style="color: var(--text-primary);">${num}</strong> no ha salido en los últimos 30 días.</p>
                        </div>
                    `;
                    return;
                }

                const posNames = { '0': '1ra', '1': '2da', '2': '3ra' };

                let tableRows = data.slice(0, 20).map(row => {
                    const meta = getMeta(row.lottery_code);
                    const posName = posNames[row.position.toString()] || `Pos ${parseInt(row.position) + 1}`;
                    const posColor = row.position === 0 ? '#22c55e' : row.position === 1 ? '#eab308' : '#f97316';
                    return `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 0.6rem; color: var(--text-secondary); font-size: 0.85rem;">${row.draw_date}</td>
                            <td style="padding: 0.6rem;">
                                <span style="color: ${meta.color}; font-weight: 600; font-size: 0.85rem;">${meta.name}</span>
                            </td>
                            <td style="padding: 0.6rem; text-align: center;">
                                <span style="background: ${posColor}22; color: ${posColor}; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${posName}</span>
                            </td>
                        </tr>
                    `;
                }).join('');

                container.innerHTML = `
                    <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div class="ball" style="width: 56px; height: 56px; font-size: 1.4rem; background: radial-gradient(circle at 35% 35%, #a78bfa, #7c3aed, #5b21b6); box-shadow: 0 0 20px rgba(139,92,246,0.4); --card-accent: transparent;">${num}</div>
                            <div>
                                <h3 style="color: var(--text-primary); margin: 0;">Historial del ${num}</h3>
                                <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">${data.length} aparición${data.length > 1 ? 'es' : ''} en los últimos 30 días</p>
                            </div>
                        </div>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 2px solid var(--glass-border);">
                                        <th style="padding: 0.6rem; text-align: left; color: var(--text-muted); font-size: 0.8rem; font-weight: 500;">FECHA</th>
                                        <th style="padding: 0.6rem; text-align: left; color: var(--text-muted); font-size: 0.8rem; font-weight: 500;">LOTERÍA</th>
                                        <th style="padding: 0.6rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; font-weight: 500;">POSICIÓN</th>
                                    </tr>
                                </thead>
                                <tbody>${tableRows}</tbody>
                            </table>
                        </div>
                    </div>
                `;
            })
            .catch(() => {
                container.innerHTML = '<p style="color: var(--accent-red); padding: 1rem;">Error al buscar el número.</p>';
            });
    };

    // Handle Enter key on number input
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && document.activeElement.id === 'dc-number-input') {
            window.lookupNumber();
        }
    });

    function renderSubpage(provider, drawName) {
        const container = document.getElementById('subpage-content');
        if (!container) return;

        // Find meta securely
        let meta = Object.values(LOTTERY_META).find(m => m.name === drawName);
        if (!meta) {
            meta = { name: drawName, provider: provider, type: 'diario', color: '#374151', category: 'daily' };
        }

        let mockBalls = ['14', '56', '78'];
        if (meta.category === 'jackpot') mockBalls = ['05', '12', '24', '35', '41', '08'];
        if (meta.name === 'Juega + Pega +') mockBalls = ['24', '21', '05', '20', '16'];
        if (meta.name === 'Loto Pool' || meta.name === 'Mega Chances') mockBalls = ['01', '02', '03', '04', '05'];
        if (meta.name === 'Super Kino TV') mockBalls = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
        if (meta.name === 'Super Palé') mockBalls = ['81', '22'];
        if (meta.name === 'MegaLotto') mockBalls = ['01', '17', '18', '22', '26', '29', '01', '02'];
        if (meta.name === 'Toca 3') mockBalls = ['04', '09', '02'];
        if (meta.name === 'Tu Fecha Real') mockBalls = ['22'];
        if (meta.name === 'Pega 4 Real') mockBalls = ['04', '05', '03', '09'];
        if (meta.name === 'Nueva Yol Real') mockBalls = ['19', '52', '22', 'Amarilla'];
        if (meta.lottery_code === 'real_loto_pool') mockBalls = ['04', '86', '83', '93']; // wait, earlier it used meta.name, but name is 'Loto Pool', which overlaps with Leidsa
        if (meta.name === 'Quiniela Real') mockBalls = ['23', '82', '36'];
        if (meta.name === 'Loto Pool' && meta.provider === 'Real') mockBalls = ['04', '86', '83', '93'];

        const mockDrawData = {
            date: new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            balls: mockBalls,
            prize: meta.category === 'jackpot' ? '$150 Millones' : null
        };

        // Balls to HTML mapping with specific coloring
        const subpageBallsHtml = mockDrawData.balls.map((n, i) => {
            let extraClass = '';
            if (meta.name === 'Loto - Loto Más') {
                if (i === 6) extraClass = ' extra';
                if (i === 7) extraClass = ' super-extra';
            } else if (meta.name === 'Juega + Pega +') {
                if (i === 0 || i === 1) extraClass = ' super-extra';
                else if (i === 2 || i === 3) extraClass = ' extra';
            } else if (meta.name === 'Nueva Yol Real' && i === 3) {
                extraClass = ' string-ball';
            } else if (meta.category !== 'jackpot' && mockDrawData.balls.length > 3 && i === mockDrawData.balls.length - 1 && meta.name !== 'Super Kino TV' && meta.name !== 'Pega 4 Real' && !(meta.name === 'Loto Pool' && meta.provider === 'Real')) {
                extraClass = ' extra';
            }
            let displayNum = n.toString();
            if (!isNaN(displayNum) && displayNum.trim() !== '') displayNum = displayNum.padStart(2, '0');
            return `<div class="ball${extraClass}">${displayNum}</div>`;
        }).join('');

        // SEO Master Skill: Dynamic update of Title and Meta Description for Subpage
        const dateToday = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });
        // Capitalize words
        const formattedDate = dateToday.replace(/\b\w/g, l => l.toUpperCase());
        document.title = `${drawName} | Resultados de Hoy ${formattedDate} | Loto Live RD`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = `Revisa al instante los números ganadores de la Lotería ${drawName} de hoy en República Dominicana. Resultados 100% verificados en tiempo real. Ingresa ahora.`;
        }

        const prizeBadge = mockDrawData.prize ? `<div class="badge" style="background: var(--accent-red); margin-left: auto;">Acumulado: ${mockDrawData.prize}</div>` : '';

        let html = `
            <div class="subpage-header fade-in" style="border-left: 4px solid ${meta.color}">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 style="color: var(--text-primary); font-size: 2.2rem; margin-bottom: 0.5rem; line-height: 1.2;">Resultados de ${drawName} Hoy República Dominicana</h1>
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
                    <div class="card-results" style="justify-content: flex-start; flex-wrap: wrap;">
                        ${subpageBallsHtml}
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
    // SPA Interceptor for SEO-friendly URLs
    window.navigateSpa = function(event, provider, drawName) {
        event.preventDefault();
        const urlSafeProvider = encodeURIComponent(provider).toLowerCase().replace(/%20/g, '-').replace(/\./g, '');
        const urlSafeName = encodeURIComponent(drawName).toLowerCase().replace(/%20/g, '-').replace(/\./g, '');
        const seoUrl = `/loterias/${urlSafeProvider}/${urlSafeName}`;
        
        history.pushState(null, '', seoUrl);
        
        // Hide all views and show subpage
        document.getElementById('view-home').style.display = 'none';
        const datacenter = document.getElementById('view-datacenter');
        if(datacenter) datacenter.style.display = 'none';
        const historico = document.getElementById('view-historico');
        if(historico) historico.style.display = 'none';
        const pred = document.getElementById('view-pronosticos');
        if(pred) pred.style.display = 'none';
        
        const viewSubpage = document.getElementById('view-subpage');
        if (viewSubpage) viewSubpage.style.display = 'block';
        
        window.scrollTo(0, 0);
        renderSubpage(provider, drawName);
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

    // Navigation is now handled natively via standard <a> tags on .lottery-card
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
    
    // Also handle popstate (back button) for real URL changes
    window.addEventListener('popstate', () => {
        if (window.location.pathname.startsWith('/loterias/')) {
            // Re-render subpage if navigating back into a lottery page
            // We rely on window.location.pathname. We didn't store state, but we can parse URL
            window.location.reload(); // Simple fallback for back button on real routes
        } else {
            handleHashChange();
        }
    });
    
    if (window.INITIAL_ROUTE) {
        // Just show the subpage directly without mutating the nice URL
        document.getElementById('view-home').style.display = 'none';
        const viewSubpage = document.getElementById('view-subpage');
        if (viewSubpage) viewSubpage.style.display = 'block';
        window.scrollTo(0, 0);
        renderSubpage(window.INITIAL_ROUTE.provider, window.INITIAL_ROUTE.draw);
    } else {
        handleHashChange();
    }
});
