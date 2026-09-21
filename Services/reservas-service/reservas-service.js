const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.RESERVAS_PORT || 4002;

// reservas-service.js está dentro de /Reservas
// reservas.json está na pasta anterior
const RESERVAS_FILE = path.join(
    __dirname,
    '..',
    'reservas.json'
);

app.use(express.json());


// ======================================================
// LER RESERVAS
// ======================================================

function lerReservas() {

    if (!fs.existsSync(RESERVAS_FILE)) {
        return [];
    }

    try {

        const conteudo =
            fs.readFileSync(
                RESERVAS_FILE,
                'utf8'
            );

        if (!conteudo.trim()) {
            return [];
        }

        const dados =
            JSON.parse(conteudo);

        // Caso o JSON seja um array
        if (Array.isArray(dados)) {
            return dados;
        }

        // Caso o JSON seja:
        // { "reservas": [...] }
        if (Array.isArray(dados.reservas)) {
            return dados.reservas;
        }

        return [];

    } catch (erro) {

        console.error(
            '[Reservas Service] Erro ao ler reservas.json:',
            erro
        );

        return [];
    }
}


// ======================================================
// SALVAR RESERVAS
// ======================================================

function salvarReservas(reservas) {

    fs.writeFileSync(
        RESERVAS_FILE,
        JSON.stringify(
            reservas,
            null,
            2
        ),
        'utf8'
    );
}


// ======================================================
// GET - TODAS AS RESERVAS
// ======================================================

app.get(
    '/internal/reservas',
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

        try {

            const reservas =
                lerReservas();

            return res.json({
                sucesso: true,
                reservas
            });

        } catch (erro) {

            console.error(
                '[Reservas Service] Erro no GET:',
                erro
            );

            return res.status(500).json({
                sucesso: false,
                erro: 'Erro ao buscar reservas.'
            });
        }
    }
);


// ======================================================
// POST - CRIAR RESERVAS
// ======================================================

app.post(
    '/internal/reservas',
    (req, res) => {

        const {
            categoria,
            data,
            horarios,
            professor,
            descricao
        } = req.body;


        // ----------------------------------------------
        // VALIDAÇÃO
        // ----------------------------------------------

        if (
            !categoria ||
            !data ||
            !Array.isArray(horarios) ||
            horarios.length === 0
        ) {

            return res.status(400).json({
                sucesso: false,
                erro:
                    'Preencha todos os campos obrigatórios e selecione ao menos um horário.'
            });
        }


        // ----------------------------------------------
        // NÃO PERMITIR DATA PASSADA
        // ----------------------------------------------

        const hojeStr =
            new Date()
                .toISOString()
                .split('T')[0];

        if (data < hojeStr) {

            return res.status(400).json({
                sucesso: false,
                erro:
                    'Não é permitido realizar reservas para datas passadas.'
            });
        }


        // ----------------------------------------------
        // LER RESERVAS ATUAIS
        // ----------------------------------------------

        const reservas =
            lerReservas();


        // ----------------------------------------------
        // VERIFICAR DUPLICIDADES
        // ----------------------------------------------

        const duplicados = [];

        for (const horario of horarios) {

            const conflito =
                reservas.find(
                    reserva =>

                        String(
                            reserva.categoria
                        )
                            .trim()
                            .toLowerCase()
                        ===
                        String(categoria)
                            .trim()
                            .toLowerCase()

                        &&

                        String(reserva.data)
                        ===
                        String(data)

                        &&

                        String(reserva.horario)
                            .trim()
                        ===
                        String(horario)
                            .trim()
                );


            if (conflito) {
                duplicados.push(horario);
            }
        }


        if (duplicados.length > 0) {

            return res.status(400).json({

                sucesso: false,

                duplicados,

                erro:
                    `Os seguintes horários já estão reservados para ${categoria}: ${duplicados.join(', ')}.`
            });
        }


        // ----------------------------------------------
        // CRIAR NOVAS RESERVAS
        // ----------------------------------------------

        const novasReservas = [];

        for (const horario of horarios) {

            const novaReserva = {

                id:
                    `${Date.now()}-${Math.floor(
                        Math.random() * 100000
                    )}`,

                categoria:
                    String(categoria).trim(),

                data:
                    String(data).trim(),

                horario:
                    String(horario).trim(),

                professor:
                    professor
                        ? String(professor).trim()
                        : 'Professor',

                descricao:
                    descricao
                        ? String(descricao).trim()
                        : ''
            };

            novasReservas.push(
                novaReserva
            );
        }


        // ----------------------------------------------
        // SALVAR
        // ----------------------------------------------

        reservas.push(
            ...novasReservas
        );

        salvarReservas(
            reservas
        );


        console.log(
            `[Reservas Service] ${novasReservas.length} reserva(s) criada(s).`
        );


        return res.json({

            sucesso: true,

            mensagem:
                'Reservas realizadas com sucesso!',

            reservas:
                novasReservas
        });
    }
);


// ======================================================
// DELETE - EXCLUIR RESERVA
// ======================================================

app.delete(
    '/internal/reservas/:id',
    (req, res) => {

        const id =
            String(
                req.params.id
            ).trim();


        console.log(
            `[Reservas Service] DELETE recebido para ID: ${id}`
        );


        try {

            const reservas =
                lerReservas();


            console.log(
                `[Reservas Service] Total antes: ${reservas.length}`
            );


            const novasReservas =
                reservas.filter(
                    reserva =>
                        String(
                            reserva.id
                        ).trim()
                        !==
                        id
                );


            // ------------------------------------------
            // NÃO ENCONTROU
            // ------------------------------------------

            if (
                novasReservas.length ===
                reservas.length
            ) {

                console.log(
                    `[Reservas Service] Reserva ${id} não encontrada.`
                );

                return res.status(404).json({

                    sucesso: false,

                    erro:
                        'Reserva não encontrada.'
                });
            }


            // ------------------------------------------
            // SALVAR NOVA LISTA
            // ------------------------------------------

            salvarReservas(
                novasReservas
            );


            console.log(
                `[Reservas Service] Reserva ${id} excluída com sucesso.`
            );

            console.log(
                `[Reservas Service] Total depois: ${novasReservas.length}`
            );


            return res.json({

                sucesso: true,

                mensagem:
                    'Reserva removida com sucesso!',

                id: id
            });

        } catch (erro) {

            console.error(
                '[Reservas Service] Erro ao excluir:',
                erro
            );

            return res.status(500).json({

                sucesso: false,

                erro:
                    'Erro interno ao excluir a reserva.'
            });
        }
    }
);


// ======================================================
// INICIAR SERVIÇO
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            `[Reservas Service] Rodando na porta ${PORT}`
        );

        console.log(
            `[Reservas Service] Arquivo: ${RESERVAS_FILE}`
        );
    }
);