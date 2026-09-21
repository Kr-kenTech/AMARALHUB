// ======================================================
// CONFIGURAÇÕES
// ======================================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL =
    process.env.AUTH_SERVICE_URL ||
    'http://localhost:4001';

const RESERVAS_SERVICE_URL =
    process.env.RESERVAS_SERVICE_URL ||
    'http://localhost:4002';


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ======================================================
// ARQUIVOS ESTÁTICOS (Com ajuste de diretório '..')
// ======================================================

app.use(
    '/Reservas',
    express.static(
        path.join(
            __dirname,
            '..',
            'Reservas'
        )
    )
);

app.use(
    '/Inicio',
    express.static(
        path.join(
            __dirname,
            '..',
            'Inicio'
        )
    )
);

app.use(
    '/Login',
    express.static(
        path.join(
            __dirname,
            '..',
            'Login'
        )
    )
);


app.use(
    '/relatorios',
    express.static(path.join(__dirname, '..', 'relatorios'))
);

app.use(
    '/configuracoes',
    express.static(path.join(__dirname, '..', 'configurações'), { index: 'config.html' })
);

// ======================================================
// ARQUIVOS ESTÁTICOS PARA OS PERFIS
// ======================================================

app.use(
    '/Aluno',
    express.static(path.join(__dirname, '..', 'Aluno'), { index: 'index.html' })
);

app.use(
    '/Professor',
    express.static(path.join(__dirname, '..', 'Professor'), { index: 'index.html' })
);

app.use(
    '/adm',
    express.static(path.join(__dirname, '..', 'adm'), { index: 'index.html' })
);

// Arquivos estáticos globais
app.use(
    express.static(
        path.join(__dirname, '..'),
        {
            extensions: [
                'png',
                'jpg',
                'css',
                'js'
            ]
        }
    )
);


// ======================================================
// PÁGINA INICIAL
// ======================================================

app.get(
    '/',
    (req, res) => {
        const filePath =
            path.resolve(
                __dirname,
                '..',
                'Inicio',
                'inicio.html'
            );

        fs.readFile(
            filePath,
            'utf8',
            (err, data) => {
                if (err) {
                    return res
                        .status(404)
                        .send(
                            'Erro ao carregar a página inicial.'
                        );
                }
                res.send(data);
            }
        );
    }
);


// ======================================================
// LOGIN
// ======================================================

app.get(
    '/login',
    (req, res) => {
        const filePath =
            path.resolve(
                __dirname,
                '..',
                'Login',
                'login.html'
            );

        fs.readFile(
            filePath,
            'utf8',
            (err, data) => {
                if (err) {
                    return res
                        .status(404)
                        .send(
                            'Erro ao carregar a página de login.'
                        );
                }
                res.send(data);
            }
        );
    }
);


// ======================================================
// LOGIN - API (Comum / Formulário)
// ======================================================

app.post(
    '/api/login',
    async (req, res) => {
        const {
            email,
            password
        } = req.body;

        const dominiosPermitidos = [
            '@educacao.mg.gov.br',
            '@aluno.mg.gov.br'
        ];

        const ehValido =
            dominiosPermitidos.some(
                dominio =>
                    email &&
                    email.endsWith(dominio)
            );

        if (!ehValido) {
            return res.status(403).json({
                sucesso: false,
                erro: 'Acesso restrito. Utilize um e-mail institucional válido (@educacao.mg.gov.br ou @aluno.mg.gov.br).'
            });
        }

        try {
            const response =
                await fetch(
                    `${AUTH_SERVICE_URL}/internal/login`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );

            const data = await response.json();

            if (!response.ok || !data.sucesso) {
                return res.status(401).json({
                    sucesso: false,
                    erro: data.erro || 'E-mail ou senha incorretos.'
                });
            }

            return res.json({
                sucesso: true,
                usuario: data.usuario,
                mensagem: 'Login realizado com sucesso!'
            });

        } catch (error) {
            console.error(
                'Erro ao comunicar com Auth Service:',
                error
            );

            return res.status(500).json({
                sucesso: false,
                erro: 'Erro interno de comunicação.'
            });
        }
    }
);


// ======================================================
// GOOGLE LOGIN - API (Gateway Proxy & Redirecionamento por Tipo)
// ======================================================

app.post(
    '/auth/google/callback',
    async (req, res) => {
        try {
            const response = await fetch(
                `${AUTH_SERVICE_URL}/internal/google-login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(req.body)
                }
            );

            const data = await response.json();

            if (!response.ok || !data.sucesso) {
                return res.status(response.status).send(`
                    <script>
                        alert("${data.erro || 'Erro ao realizar login com o Google.'}");
                        window.location.href = '/login';
                    </script>
                `);
            }

            const tipoUsuario = data.usuario.tipo;
            const emailUsuario = data.usuario.email; // Captura o e-mail retornado
            let destino = '/reservas'; 

            if (tipoUsuario === 'aluno') {
                destino = '/Aluno/';
            } else if (tipoUsuario === 'professor') {
                destino = '/Professor/';
            } else if (tipoUsuario === 'adm') {
                destino = '/adm/';
            }

            // Injeta o e-mail e o perfil no localStorage via script no navegador e redireciona
            return res.send(`
                <script>
                    localStorage.setItem('userEmail', "${emailUsuario}");
                    localStorage.setItem('userRole', "${tipoUsuario}");
                    window.location.href = "${destino}";
                </script>
            `);

        } catch (error) {
            console.error(
                '[Gateway] Erro ao comunicar com Auth Service para Google login:',
                error
            );

            return res.status(500).send(`
                <script>
                    alert("Erro interno de comunicação com o serviço de autenticação do Google.");
                    window.location.href = '/login';
                </script>
            `);
        }
    }
);

// ======================================================
// CONFIGURAÇÕES - ROTA EXPLICITA
// ======================================================

app.get(
    '/configuracoes',
    (req, res) => {
        const filePath =
            path.resolve(
                __dirname,
                '..',
                'configurações', // Ou 'configuracoes' dependendo de como renomeou a pasta
                'config.html'
            );

        fs.readFile(
            filePath,
            'utf8',
            (err, data) => {
                if (err) {
                    return res
                        .status(404)
                        .send('Erro ao carregar a página de configurações.');
                }
                res.send(data);
            }
        );
    }
);

// ======================================================
// PÁGINA DE RESERVAS (Fallback Geral)
// ======================================================

app.get(
    '/reservas',
    (req, res) => {
        res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const filePath =
            path.resolve(
                __dirname,
                '..',
                'Reservas',
                'reservas.html'
            );

        fs.readFile(
            filePath,
            'utf8',
            (err, data) => {
                if (err) {
                    return res
                        .status(404)
                        .send(
                            'Erro ao carregar a página de reservas.'
                        );
                }
                res.send(data);
            }
        );
    }
);


// ======================================================
// GET / POST / DELETE DE RESERVAS
// ======================================================

app.get(
    '/api/reservas',
    async (req, res) => {
        try {
            const response =
                await fetch(
                    `${RESERVAS_SERVICE_URL}/internal/reservas?_t=${Date.now()}`,
                    { method: 'GET', cache: 'no-store' }
                );
            const data = await response.json();
            return res.status(response.status).json(data);
        } catch (error) {
            return res.status(500).json({ sucesso: false, erro: 'Erro ao buscar reservas.' });
        }
    }
);

app.post(
    '/api/reservas',
    async (req, res) => {
        try {
            const response =
                await fetch(
                    `${RESERVAS_SERVICE_URL}/internal/reservas`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(req.body)
                    }
                );
            const data = await response.json();
            return res.status(response.status).json(data);
        } catch (error) {
            return res.status(500).json({ sucesso: false, erro: 'Erro ao criar reserva.' });
        }
    }
);

app.delete(
    '/api/reservas/:id',
    async (req, res) => {
        const id = String(req.params.id).trim();
        try {
            const response =
                await fetch(
                    `${RESERVAS_SERVICE_URL}/internal/reservas/${encodeURIComponent(id)}`,
                    { method: 'DELETE' }
                );
            const data = await response.json();
            return res.status(response.status).json(data);
        } catch (error) {
            return res.status(500).json({ sucesso: false, erro: 'Erro ao comunicar com o serviço de reservas.' });
        }
    }
);

// ======================================================
// ROTA DE API PARA BUSCAR DADOS DO USUÁRIO
// ======================================================

app.get(
    '/api/usuario',
    async (req, res) => {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ sucesso: false, erro: 'E-mail não fornecido.' });
        }

        try {
            const response = await fetch(
                `${AUTH_SERVICE_URL}/internal/usuario?email=${encodeURIComponent(email)}`,
                { method: 'GET' }
            );
            const data = await response.json();
            return res.status(response.status).json(data);
        } catch (error) {
            console.error('[Gateway] Erro ao buscar dados do usuário:', error);
            return res.status(500).json({ sucesso: false, erro: 'Erro ao buscar dados do usuário.' });
        }
    }
);

// ======================================================
// ROTA DE API PARA ATUALIZAR DADOS DO USUÁRIO
// ======================================================

app.put(
    '/api/usuario',
    async (req, res) => {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ sucesso: false, erro: 'E-mail não fornecido.' });
        }

        try {
            const response = await fetch(
                `${AUTH_SERVICE_URL}/internal/usuario`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(req.body)
                }
            );
            const data = await response.json();
            return res.status(response.status).json(data);
        } catch (error) {
            console.error('[Gateway] Erro ao atualizar dados do usuário:', error);
            return res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar dados do usuário.' });
        }
    }
);

// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(
    PORT,
    () => {
        console.log(`[Gateway] Rodando na porta ${PORT}`);
        console.log(`[Gateway] Reservas Service: ${RESERVAS_SERVICE_URL}`);
    }
);