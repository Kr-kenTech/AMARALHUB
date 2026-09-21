/* =====================================================
   CONFIGURAÇÕES GLOBAIS DE TEMA E FONTE (TODAS AS PÁGINAS)
===================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Aplica o Tema Salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }

    // 2. Aplica o Tamanho de Fonte Salvo
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${savedFontSize}`);
});