require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const filePath = path.resolve(__dirname, 'Inicio', 'inicio.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Erro ao carregar a página inicial.');
        } else {
            res.send(data);
        }
    });
});

app.get('/login', (req, res) => {
    const filePath = path.resolve(__dirname, 'Login', 'login.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Erro ao carregar a página de login.');
        } else {
            res.send(data);
        }
    });
});

// Rota de Login tradicional que delega a checagem para o Microsserviço de Auth
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    const dominiosPermitidos = ['@educacao.mg.gov.br', '@aluno.mg.gov.br'];
    const ehValido = dominiosPermitidos.some(dominio => email && email.endsWith(dominio));

    if (!ehValido) {
        return res.status(403).json({ 
            sucesso: false, 
            erro: 'Acesso restrito. Utilize um e-mail institucional válido (@educacao.mg.gov.br ou @aluno.mg.gov.br).' 
        });
    }
    
    try {
        const response = await fetch(`${AUTH_SERVICE_URL}/internal/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const resultado = await response.json();

        if (!response.ok) {
            return res.status(401).json({ 
                sucesso: false, 
                erro: 'E-mail ou senha incorretos, ou você ainda não cadastrou uma senha (faça login com o Google primeiro).' 
            });
        }

        return res.json({ sucesso: true, mensagem: 'Login realizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao comunicar com o Auth Service:', error);
        return res.status(500).json({ sucesso: false, erro: 'Erro interno de comunicação.' });
    }
});

// Rota para salvar a senha criada pelo aluno no primeiro acesso via Google
app.post('/api/definir-senha', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        await fetch(`${AUTH_SERVICE_URL}/internal/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        res.send(`
            <script>
                alert('Senha cadastrada com sucesso! Agora você já pode entrar por e-mail e senha.');
                window.location.href = '/login';
            </script>
        `);
    } catch (error) {
        console.error('Erro ao salvar senha:', error);
        res.status(500).send('Erro ao salvar senha.');
    }
});

// Rota de Callback do Google
app.post('/auth/google/callback', async (req, res) => {
    try {
        const token = req.body.credential;
        
        if (!token) {
            return res.status(400).send('Token não recebido do Google.');
        }

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        
        const emailDoUsuario = payload.email || ''; 
        const dominiosPermitidos = ['@educacao.mg.gov.br', '@aluno.mg.gov.br'];
        const ehValido = dominiosPermitidos.some(dominio => emailDoUsuario.endsWith(dominio));

        if (!ehValido) {
            return res.status(403).send(`
                <script>
                    alert('Acesso negado! O e-mail utilizado (${emailDoUsuario}) não pertence à rede estadual de Minas Gerais.');
                    window.location.href = '/login';
                </script>
            `);
        }

        // Consulta o microsserviço de autenticação para verificar se o usuário existe
        const authResponse = await fetch(`${AUTH_SERVICE_URL}/internal/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailDoUsuario })
        });
        const dadosUser = await authResponse.json();

        // Se o usuário já existe e já tem senha cadastrada, entra direto
        if (dadosUser.usuario && dadosUser.usuario.password) {
            return res.send(`
                <script>
                    alert('Login realizado com sucesso!');
                    window.location.href = '/Inicio/inicio.html';
                </script>
            `);
        }

        // Caso contrário, exibe a tela para cadastrar a senha pela 1ª vez
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Criar Senha - AmaralHub</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #f4f6f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
                    input { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                    button { background: #0056b3; color: white; border: none; padding: 10px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold; }
                    button:hover { background: #004494; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Primeiro Acesso</h2>
                    <p>Olá! Seu e-mail institucional foi validado com sucesso.</p>
                    <p style="font-size: 14px; color: #555;">Crie uma senha pessoal para conseguir fazer login por texto nas próximas vezes.</p>
                    <form action="/api/definir-senha" method="POST">
                        <input type="hidden" name="email" value="${emailDoUsuario}">
                        <input type="password" name="password" placeholder="Digite sua nova senha" required>
                        <button type="submit">Salvar Senha e Concluir</button>
                    </form>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Erro ao processar o login do Google:', error);
        res.status(500).send('Erro interno ao processar o login.');
    }
});

app.listen(PORT, () => {
    console.log(`[Web Service / Gateway] Rodando na porta ${PORT}`);
});