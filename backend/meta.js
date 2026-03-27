const LOTTERY_META = {
        // --- Clásicas ---
        'loteka': { name: 'Quiniela Loteka', provider: 'Loteka', type: 'Quiniela', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/quiniela.jpg' },
        'loteka_mega_chances': { name: 'Mega Chances', provider: 'Loteka', type: 'Sorteo', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/mega_chances.jpg' },
        'loteka_mega_lotto': { name: 'MegaLotto', provider: 'Loteka', type: 'Jackpot', color: '#f97316', category: 'jackpot', balls: 8, drawDays: [1, 4], schedule: '7:55 PM', logo: '/assets/images/logos/loteka/mega_lotto.png' },
        'loteka_toca_3': { name: 'Toca 3', provider: 'Loteka', type: 'Sorteo', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/toca_3.jpg' },
        'loteka_mega_chances_repartidera': { name: 'Mega Chances Repartidera', provider: 'Loteka', type: 'Sorteo', color: '#f97316', category: 'daily', time: 'night', schedule: '7:55 PM', logo: '/assets/images/logos/loteka/mega_chances_repartidera.jpg' },
        'nacional': { name: 'Gana Más', provider: 'Nacional', type: 'Quiniela', color: '#1e3a8a', category: 'daily', time: 'afternoon', schedule: '2:30 PM', logo: '/assets/images/logos/nacional/gana_mas.png?v=new2' },
        'nacional_juega_pega_mas': { name: 'Juega + Pega +', provider: 'Nacional', type: 'Sorteo', color: '#16a34a', category: 'daily', time: 'afternoon', schedule: '2:30 PM', logo: '/assets/images/logos/nacional/juega_pega_mas.png?v=new2' },
        'nacional_noche': { name: 'Nacional Noche', provider: 'Nacional', type: 'Quiniela', color: '#1e3a8a', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/nacional/nacional_noche.png?v=new2' },
        'nacional_billetes_domingo': { name: 'Billetes Domingo', provider: 'Nacional', type: 'Sorteo', color: '#115e59', category: 'daily', time: 'night', balls: 3, drawDays: [0], schedule: '6:00 PM', logo: '/assets/images/logos/nacional/billetes_domingo.png' },
        'leidsa': { name: 'Quiniela Leidsa', provider: 'LEIDSA', type: 'Quiniela', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/quiniela.png' },
        'leidsa_pega_3_mas': { name: 'Pega 3 Más', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/pega_3_mas.png' },
        'leidsa_loto_pool': { name: 'Loto Pool', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/loto_pool.png' },
        'leidsa_super_kino_tv': { name: 'Super Kino TV', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/super_kino_tv.webp' },
        'leidsa_loto': { name: 'Loto - Loto Más', provider: 'LEIDSA', type: 'Jackpot', color: '#eab308', category: 'jackpot', drawDays: [3, 6], schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/loto.png' },
        'leidsa_super_pale': { name: 'Super Palé', provider: 'LEIDSA', type: 'Sorteo', color: '#eab308', category: 'daily', time: 'night', schedule: '8:55 PM', logo: '/assets/images/logos/leidsa/super_pale.png' },
        'real': { name: 'Quiniela Real', provider: 'Real', type: 'Quiniela', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/quiniela.jpg' },
        'real_tu_fecha': { name: 'Tu Fecha Real', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/tu_fecha.png' },
        'real_pega_4': { name: 'Pega 4 Real', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/pega_4.png' },
        'real_nueva_yol': { name: 'Nueva Yol Real', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/nueva_yol.png' },
        'real_loto_pool': { name: 'Loto Pool', provider: 'Real', type: 'Sorteo', color: '#b91c1c', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/loto_pool.png' },
        'real_super_pale': { name: 'Super Palé', provider: 'Real', type: 'Sorteo', color: '#16a34a', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/real/super_pale.png' },
        'real_loto': { name: 'Loto Real', provider: 'Real', type: 'Jackpot', color: '#b91c1c', category: 'jackpot', drawDays: [2, 5], schedule: '1:00 PM', logo: '/assets/images/logos/real/loto.jpg' },

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
        'anguila_10': { name: 'Anguila (10:00 AM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'morning', schedule: '10:00 AM', logo: '/assets/images/logos/anguila/anguila.jpg' },
        'anguila_1': { name: 'Anguila (1:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'afternoon', schedule: '1:00 PM', logo: '/assets/images/logos/anguila/anguila.jpg' },
        'anguila_6': { name: 'Anguila (6:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'night', schedule: '6:00 PM', logo: '/assets/images/logos/anguila/anguila.jpg' },
        'anguila_9': { name: 'Anguila (9:00 PM)', provider: 'Anguila', type: 'Caribe', color: '#14b8a6', category: 'daily', time: 'night', schedule: '9:00 PM', logo: '/assets/images/logos/anguila/anguila.jpg' },
        'king_pick_3_dia': { name: 'Pick 3 Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_pick_4_dia': { name: 'Pick 4 Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_12': { name: 'King Lottery (12:30 PM)', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_philipsburg_dia': { name: 'Philipsburg Medio Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_loto_pool_dia': { name: 'Loto Pool Medio Día', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'morning', schedule: '12:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_pick_3_noche': { name: 'Pick 3 Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_pick_4_noche': { name: 'Pick 4 Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_7': { name: 'King Lottery (7:30 PM)', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_philipsburg_noche': { name: 'Philipsburg Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king_lottery.png' },
        'king_loto_pool_noche': { name: 'Loto Pool Noche', provider: 'King Lottery', type: 'Caribe', color: '#f59e0b', category: 'daily', time: 'night', schedule: '7:30 PM', logo: '/assets/images/logos/king_lottery.png' }

        // --- Dummy Jackpots ---
        'default': { name: 'Sorteo', provider: 'Lotería', type: 'Sorteo', color: '#374151', category: 'daily', time: 'night', schedule: '', logo: '/assets/images/logos/default.png' }
    }; module.exports = LOTTERY_META;