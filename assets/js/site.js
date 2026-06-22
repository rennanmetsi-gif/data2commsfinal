(function () {
    const serviceLinks = [
        ["Diagnóstico de Comunicação", "/servico-pesquisa.html"],
        ["Pesquisa Proprietária para PR", "/servico-pesquisa-pr.html"],
        ["PR Intelligence", "/servico-intelligence.html"],
        ["Assessoria de Imprensa Contínua", "/servico-assessoria.html"]
    ];

    function addSkipLink() {
        const main = document.querySelector("main");
        if (!main) return;
        if (!main.id) main.id = "conteudo-principal";

        const link = document.createElement("a");
        link.className = "skip-link";
        link.href = `#${main.id}`;
        link.textContent = "Pular para o conteúdo";
        document.body.prepend(link);
    }

    function improveNavigation() {
        const header = document.querySelector("body > header");
        if (!header) return;

        const primaryNav = header.querySelector("nav");
        if (primaryNav) {
            primaryNav.setAttribute("aria-label", "Navegação principal");
            primaryNav.querySelectorAll("a").forEach((link) => {
                const label = link.textContent.trim().toLowerCase();
                if (label === "publicações" || label === "blog") {
                    link.textContent = "Inteligência";
                }
            });
        }

        if (header.querySelector(".service-shortcuts")) return;

        const shortcuts = document.createElement("nav");
        shortcuts.className = "service-shortcuts";
        shortcuts.setAttribute("aria-label", "Acesso direto aos serviços principais");

        const label = document.createElement("span");
        label.className = "service-shortcuts-label";
        label.textContent = "Soluções";
        shortcuts.append(label);

        const currentPath = window.location.pathname.replace(/\/$/, "");
        serviceLinks.forEach(([text, href]) => {
            const link = document.createElement("a");
            link.href = href;
            link.textContent = text;
            if (currentPath.endsWith(href)) link.setAttribute("aria-current", "page");
            shortcuts.append(link);
        });

        header.append(shortcuts);
    }

    function updateFooterLanguage() {
        document.querySelectorAll("footer a").forEach((link) => {
            const label = link.textContent.trim().toLowerCase();
            if (label === "publicações" || label === "blog") {
                link.textContent = "Inteligência";
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        addSkipLink();
        improveNavigation();
        updateFooterLanguage();
    });
})();
