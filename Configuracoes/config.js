document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       0. LIMPEZA E EXIBIÇÃO DO NOME DO USUÁRIO (SEM NÚMEROS)
    ===================================================== */
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email') || '';
    const userRole = localStorage.getItem('userRole') || localStorage.getItem('tipo') || 'aluno';

    const roleFormatada = userRole.charAt(0).toUpperCase() + userRole.slice(1);

    // Função global/local para limpar estritamente o nome (removendo pontos e números da matrícula)
    function limparPrimeiroNome(nomeBruto, emailBruto) {
        let base = '';
        if (nomeBruto && nomeBruto.trim() !== '') {
            base = nomeBruto.trim().split(' ')[0];
        } else if (emailBruto) {
            base = emailBruto.split('@')[0].split('.')[0];
        }
        let apenasLetras = base.replace(/[^a-zA-ZÀ-ÿ]/g, '');
        if (!apenasLetras) return roleFormatada;
        return apenasLetras.charAt(0).toUpperCase() + apenasLetras.slice(1).toLowerCase();
    }

    const nomeInicial = limparPrimeiroNome('', userEmail);

    // Atualiza os elementos de texto do perfil imediatamente
    const labelRole = document.getElementById('role-usuario-label');
    const displayRole = document.getElementById('current-role-display');
    const profileTitle = document.getElementById('user-profile-title');
    const emailDisplay = document.getElementById('user-email-display');

    if (labelRole) labelRole.textContent = nomeInicial;
    if (displayRole) displayRole.textContent = nomeInicial;
    if (profileTitle) profileTitle.textContent = nomeInicial;
    if (emailDisplay) emailDisplay.textContent = userEmail || 'email@institucional.mg.gov.br';

    // Ajusta link da barra lateral
    const linkInicio = document.getElementById('link-inicio');
    if (linkInicio) {
        if (userRole === 'aluno') linkInicio.href = '/Aluno/';
        else if (userRole === 'professor') linkInicio.href = '/Professor/';
        else if (userRole === 'adm') linkInicio.href = '/adm/';
    }

    // Busca dados atualizados do backend (/usuarios.json via API)
    if (userEmail) {
        fetch(`/api/usuario?email=${encodeURIComponent(userEmail)}`)
            .then(res => res.json())
            .then(resultado => {
                if (resultado.sucesso && resultado.usuario) {
                    const usuario = resultado.usuario;
                    const nomeFinal = limparPrimeiroNome(usuario.nome, usuario.email);

                    if (labelRole) labelRole.textContent = nomeFinal;
                    if (displayRole) displayRole.textContent = nomeFinal;
                    if (profileTitle) profileTitle.textContent = nomeFinal;

                    // Restrições e Alergias se houverem na tela de config
                    const boxRestricoes = document.getElementById('box-restricoes');
                    if (boxRestricoes) {
                        boxRestricoes.textContent = usuario.restricoes || 'Nenhuma restrição cadastrada.';
                    }
                }
            })
            .catch(err => console.error('Erro ao buscar dados complementares do usuário:', err));
    }


    /* =====================================================
       1. ALTERAÇÃO DE TAMANHO DA FONTE
    ===================================================== */
    const fontButtons = document.querySelectorAll('.font-control button');

    function applyFontSize(size) {
        document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
        document.documentElement.classList.add(`font-${size}`);

        fontButtons.forEach(btn => {
            if (btn.getAttribute('data-size') === size) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        localStorage.setItem('fontSize', size);
    }

    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    applyFontSize(savedFontSize);

    fontButtons.forEach(button => {
        button.addEventListener('click', () => {
            const size = button.getAttribute('data-size');
            applyFontSize(size);
        });
    });


   /* =====================================================
       2. ALTERAÇÃO DE TEMA (CLARO / ESCURO GLOBAL)
    ===================================================== */
    const themeButtons = document.querySelectorAll('.theme-control button');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark-theme');
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }

        // Atualiza o estado visual dos botões (caso esteja na página de config)
        if (themeButtons.length > 0) {
            themeButtons.forEach((btn, index) => {
                const isDarkBtn = index === 1;
                if ((theme === 'dark' && isDarkBtn) || (theme === 'light' && !isDarkBtn)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    }

    // Carrega o tema salvo ou usa 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Evento de clique nos botões de tema (na página de configurações)
    if (themeButtons.length > 0) {
        themeButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const selectedTheme = index === 1 ? 'dark' : 'light';
                applyTheme(selectedTheme);
            });
        });
    }

});