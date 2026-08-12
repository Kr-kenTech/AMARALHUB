require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Essencial para ler os dados enviados pelo Google

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

app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    
    const dominiosPermitidos = ['@educacao.mg.gov.br', '@aluno.mg.gov.br'];
    const ehValido = dominiosPermitidos.some(dominio => email && email.endsWith(dominio));

    if (!ehValido) {
        return res.status(403).json({ 
            sucesso: false, 
            erro: 'Acesso restrito. Utilize um e-mail institucional válido (@educacao.mg.gov.br ou @aluno.mg.gov.br).' 
        });
    }
    
    return res.status(401).json({ sucesso: false, erro: 'E-mail ou senha inválidos.' });
});

app.post('/auth/google/callback', (req, res) => {
    try {
        const token = req.body.credential;
        
        if (!token) {
            return res.status(400).send('Token não recebido do Google.');
        }

        // Decodifica o token JWT do Google nativamente no Node.js
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

        res.send(`Login institucional realizado com sucesso! Bem-vindo(a), ${emailDoUsuario}`);
        
    } catch (error) {
        console.error('Erro ao decodificar o token do Google:', error);
        res.status(500).send('Erro interno ao processar o login.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso em: http://localhost:${PORT}`);
});