document.addEventListener('DOMContentLoaded', () => {
    // 1. Radar Interativo de Sinais
    const panel = document.querySelector('.home-intelligence-panel');
    if (panel) {
        const readout = panel.querySelector('[data-home-signal-readout]');
        const nodes = [...panel.querySelectorAll('.home-signal-node')];

        panel.addEventListener('pointermove', event => {
            const rect = panel.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            panel.style.setProperty('--signal-grid-x', `${x * -0.018}px`);
            panel.style.setProperty('--signal-grid-y', `${y * -0.018}px`);
            panel.style.setProperty('--signal-core-x', `${x * 0.026}px`);
            panel.style.setProperty('--signal-core-y', `${y * 0.026}px`);
            panel.style.setProperty('--signal-light-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
            panel.style.setProperty('--signal-light-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
        });

        let activeIndex = 0;
        let holdUntil = 0;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const activate = (node, manual = false) => {
            activeIndex = Math.max(0, nodes.indexOf(node));
            nodes.forEach(item => item.classList.toggle('is-active', item === node));
            if (readout) readout.textContent = node.dataset.signal;
            if (manual) holdUntil = Date.now() + 4200;
        };

        nodes.forEach(node => {
            node.addEventListener('mouseenter', () => activate(node, true));
            node.addEventListener('focus', () => activate(node, true));
            node.addEventListener('click', () => activate(node, true));
        });

        if (!prefersReducedMotion && nodes.length > 1) {
            panel.classList.add('is-cycling');
            window.setInterval(() => {
                if (Date.now() < holdUntil) return;
                activeIndex = (activeIndex + 1) % nodes.length;
                activate(nodes[activeIndex]);
            }, 2600);
        }
    }

    // 2. Formulário de Contato
    const form = document.getElementById('contactForm');
    const msg = document.getElementById('msg-contact');
    if (form && msg) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-contact');
            if (btn) btn.textContent = 'Enviando...';
            setTimeout(() => {
                form.reset();
                form.classList.add('hidden');
                msg.classList.remove('hidden');
            }, 500);
        });
    }
});
