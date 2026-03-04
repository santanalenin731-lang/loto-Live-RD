const fs = require('fs');
const path = require('path');

const LOTTERIES = [
    'nacional_ganamas', 'nacional_noche', 'nacional_juega_pega_mas', 'nacional_billetes', 'nacional_zodiaco',
    'leidsa_pega_3_mas', 'leidsa_loto_pool', 'leidsa_super_kino_tv', 'leidsa_quiniela', 'leidsa_loto',
    'loteka_quiniela', 'loteka_mega_chances', 'loteka_mega_chances_repartidera', 'loteka_toca_3', 'loteka_mega_lotto',
    'real_quiniela', 'real_loto', 'real_tu_fecha', 'real_pega_4',
    'primera_dia', 'primera_noche',
    'lotedom_quiniela', 'lotedom_zodiaco', 'lotedom_super_pale',
    'suerte_dia', 'suerte_tarde',
    'loto_pool'
];

const dir = path.join(__dirname, '../pages');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

LOTTERIES.forEach(code => {
    const filePath = path.join(dir, `${code}.html`);
    const content = `<div class="glass-panel" style="padding: 2rem;">
    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Información sobre ${code.replace(/_/g, ' ')}</h3>
    <p style="color: var(--text-muted);">
        <!-- EL USUARIO PUEDE AGREGAR SU CONTENIDO HTML AQUÍ -->
        [ESPACIO EN BLANCO PARA AGREGAR REGLAS Y PREMIOS DE ESTA LOTERÍA]
    </p>
</div>`;

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(`Created page for: ${code}`);
    } else {
        console.log(`Page already exists for: ${code}`);
    }
});
console.log('Done!');
