document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       1. ALTERAÇÃO DE TAMANHO DA FONTE (CORRIGIDO)
    ===================================================== */
    const fontButtons = document.querySelectorAll('.font-control button');

    function applyFontSize(size) {
        // Remove classes de tamanho anteriores da raiz <html>
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');

        // Adiciona a classe selecionada
        document.documentElement.classList.add(`font-${size}`);

        // Atualiza a aparência do botão ativo
        fontButtons.forEach(btn => {
            if (btn.getAttribute('data-size') === size) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Grava no armazenamento local do navegador
        localStorage.setItem('fontSize', size);
    }

    // Aplica o tamanho salvo ou usa o 'medium' como padrão
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    applyFontSize(savedFontSize);

    // Evento de clique para trocar a fonte
    fontButtons.forEach(button => {
        button.addEventListener('click', () => {
            const size = button.getAttribute('data-size');
            applyFontSize(size);
        });
    });


    /* =====================================================
       2. ALTERAÇÃO DE TEMA (CLARO / ESCURO)
    ===================================================== */
    const themeButtons = document.querySelectorAll('.theme-control button');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Atualiza o estado visual dos botões
        themeButtons.forEach((btn, index) => {
            const isDarkBtn = index === 1;
            if ((theme === 'dark' && isDarkBtn) || (theme === 'light' && !isDarkBtn)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        localStorage.setItem('theme', theme);
    }

    // Carrega o tema salvo ou usa 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Evento de clique nos botões de tema
    themeButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const selectedTheme = index === 1 ? 'dark' : 'light';
            applyTheme(selectedTheme);
        });
    });

});