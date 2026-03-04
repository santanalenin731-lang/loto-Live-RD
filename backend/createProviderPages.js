const fs = require('fs');
const path = require('path');

const PROVIDERS = [
    'nacional', 'leidsa', 'loteka', 'real',
    'la_primera', 'lotedom', 'la_suerte'
];

const dir = path.join(__dirname, '../pages/providers');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

PROVIDERS.forEach(provider => {
    const filePath = path.join(dir, `${provider}.html`);
    const content = `<div class="glass-panel" style="padding: 2rem;">
    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Historia y Reglas: ${provider.toUpperCase().replace('_', ' ')}</h3>
    <div style="color: var(--text-muted); line-height: 1.6;">
        <p>
            <!-- EL USUARIO PUEDE AGREGAR SU CONTENIDO DE TEXTO HISTÓRICO AQUÍ -->
            [ESPACIO EN BLANCO PARA AGREGAR LA HISTORIA Y REGLAS DE ESTA LOTERÍA NACIONAL]
        </p>
    </div>
</div>`;

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
        console.log(`Created provider page for: ${provider}`);
    } else {
        console.log(`Provider page already exists for: ${provider}`);
    }
});
console.log('Provider pages generation done!');
