// ======================================================
// CONFIGURAÇÕES
// ======================================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT =
    process.env.PORT || 3000;

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
// ARQUIVOS ESTÁTICOS
// ======================================================

app.use(
    '/Reservas',
    express.static(
        path.join(
            __dirname,
            'Reservas'
        )
    )
);

app.use(
    '/Inicio',
    express.static(
        path.join(
            __dirname,
            'Inicio'
        )
    )
);

app.use(
    '/Login',
    express.static(
        path.join(
            __dirname,
            'Login'
        )
    )
);

app.use(
    express.static(
        __dirname,
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
// LOGIN - API
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

                erro:
                    'Acesso restrito. Utilize um e-mail institucional válido (@educacao.mg.gov.br ou @aluno.mg.gov.br).'
            });
        }


        try {

            const response =
                await fetch(
                    `${AUTH_SERVICE_URL}/internal/login`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                email,
                                password
                            })
                    }
                );


            if (!response.ok) {

                return res.status(401).json({

                    sucesso: false,

                    erro:
                        'E-mail ou senha incorretos.'
                });
            }


            return res.json({
                sucesso: true,
                mensagem:
                    'Login realizado com sucesso!'
            });

        } catch (error) {

            console.error(
                'Erro ao comunicar com Auth Service:',
                error
            );

            return res.status(500).json({

                sucesso: false,

                erro:
                    'Erro interno de comunicação.'
            });
        }
    }
);


// ======================================================
// PÁGINA DE RESERVAS
// ======================================================

app.get(
    '/reservas',
    (req, res) => {

        res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate'
        );

        res.setHeader(
            'Pragma',
            'no-cache'
        );

        res.setHeader(
            'Expires',
            '0'
        );


        const filePath =
            path.resolve(
                __dirname,
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
// GET RESERVAS
// ======================================================

app.get(
    '/api/reservas',
    async (req, res) => {

        res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate'
        );

        res.setHeader(
            'Pragma',
            'no-cache'
        );

        res.setHeader(
            'Expires',
            '0'
        );


        try {

            const response =
                await fetch(
                    `${RESERVAS_SERVICE_URL}/internal/reservas?_t=${Date.now()}`,
                    {
                        method: 'GET',
                        cache: 'no-store',
                        headers: {
                            'Cache-Control':
                                'no-cache'
                        }
                    }
                );


            const data =
                await response.json();


            return res
                .status(response.status)
                .json(data);

        } catch (error) {

            console.error(
                '[Gateway] Erro ao buscar reservas:',
                error
            );


            return res.status(500).json({

                sucesso: false,

                erro:
                    'Erro ao buscar reservas.'
            });
        }
    }
);


// ======================================================
// POST RESERVAS
// ======================================================

app.post(
    '/api/reservas',
    async (req, res) => {

        try {

            const response =
                await fetch(
                    `${RESERVAS_SERVICE_URL}/internal/reservas`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(
                                req.body
                            )
                    }
                );


            const data =
                await response.json();


            return res
                .status(response.status)
                .json(data);

        } catch (error) {

            console.error(
                '[Gateway] Erro ao criar reserva:',
                error
            );


            return res.status(500).json({

                sucesso: false,

                erro:
                    'Erro ao criar reserva.'
            });
        }
    }
);


// ======================================================
// DELETE RESERVAS
// ======================================================

app.delete(
    '/api/reservas/:id',
    async (req, res) => {

        const id =
            String(
                req.params.id
            ).trim();


        console.log(
            `[Gateway] DELETE recebido: ${id}`
        );


        try {

            const response =
                await fetch(
                    `${RESERVAS_SERVICE_URL}/internal/reservas/${encodeURIComponent(id)}`,
                    {
                        method: 'DELETE'
                    }
                );


            const data =
                await response.json();


            console.log(
                '[Gateway] Resposta do serviço:',
                data
            );


            return res
                .status(response.status)
                .json(data);

        } catch (error) {

            console.error(
                '[Gateway] Erro ao excluir reserva:',
                error
            );


            return res.status(500).json({

                sucesso: false,

                erro:
                    'Erro ao comunicar com o serviço de reservas.'
            });
        }
    }
);


// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            `[Gateway] Rodando na porta ${PORT}`
        );

        console.log(
            `[Gateway] Reservas Service: ${RESERVAS_SERVICE_URL}`
        );
    }
);