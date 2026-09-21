require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.AUTH_PORT || 4001;
const USERS_FILE = path.join(__dirname, 'usuarios.json');

app.use(express.json());

function lerUsuarios() {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

// Função auxiliar para determinar o cargo/tipo do usuário com base no e-mail
function identificarTipoUsuario(email) {
    if (email.endsWith('@aluno.mg.gov.br')) {
        return 'aluno';
    }
    
    // Defina aqui e-mails específicos que serão administradores
    const adminsFixos = ['admin@educacao.mg.gov.br', 'suporte@educacao.mg.gov.br'];
    if (adminsFixos.includes(email)) {
        return 'adm';
    }

    // Caso termine com @educacao.mg.gov.br e não seja admin fixo, é professor
    if (email.endsWith('@educacao.mg.gov.br')) {
        return 'professor';
    }

    return null;
}

// Endpoint interno para validar credenciais de login
app.post('/internal/login', (req, res) => {
    const { email, password } = req.body;
    const usuarios = lerUsuarios();
    
    const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === password);

    if (!usuarioEncontrado) {
        return res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas.' });
    }

    const tipo = identificarTipoUsuario(email);

    return res.json({ 
        sucesso: true, 
        usuario: { 
            email: usuarioEncontrado.email,
            tipo: tipo // Retorna 'aluno', 'professor' ou 'adm'
        } 
    });
});

// Endpoint interno para buscar ou cadastrar/atualizar senha do usuário
app.post('/internal/usuarios', (req, res) => {
    const { email, password } = req.body;
    const usuarios = lerUsuarios();
    
    const index = usuarios.findIndex(u => u.email === email);
    const tipo = identificarTipoUsuario(email);
    
    if (index >= 0) {
        if (password) usuarios[index].password = password;
        if (!usuarios[index].tipo) usuarios[index].tipo = tipo;
    } else {
        usuarios.push({ email, password: password || null, tipo });
    }
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2), 'utf8');
    
    const usuarioAtualizado = usuarios.find(u => u.email === email);
    return res.json({ sucesso: true, usuario: usuarioAtualizado });
});

// ======================================================
// ENDPOINT INTERNO: GOOGLE LOGIN
// ======================================================

app.post('/internal/google-login', (req, res) => {
    const { credential, email: emailDireto } = req.body;
    let email = emailDireto;

    // Se o frontend/gateway enviou o token do Google (credential), decodificamos para extrair o e-mail
    if (!email && credential) {
        try {
            const base64Url = credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
            const payload = JSON.parse(jsonPayload);
            email = payload.email;
        } catch (err) {
            console.error('[Auth Service] Erro ao decodificar token do Google:', err);
        }
    }

    if (!email) {
        return res.status(400).json({
            sucesso: false,
            erro: 'E-mail não fornecido ou token do Google inválido.'
        });
    }

    // Identifica o tipo do usuário baseado no e-mail institucional
    const tipo = identificarTipoUsuario(email);

    if (!tipo) {
        return res.status(403).json({
            sucesso: false,
            erro: 'Acesso restrito. Utilize um e-mail institucional válido (@educacao.mg.gov.br ou @aluno.mg.gov.br).'
        });
    }

    const usuarios = lerUsuarios();
    let usuarioEncontrado = usuarios.find(u => u.email === email);

    // Se o usuário logou com Google pela primeira vez, cadastra-o automaticamente no JSON com o tipo correto
    if (!usuarioEncontrado) {
        usuarioEncontrado = {
            email,
            password: null, // Sem senha local, pois usa Google
            tipo: tipo
        };
        usuarios.push(usuarioEncontrado);
        fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2), 'utf8');
    } else if (!usuarioEncontrado.tipo) {
        // Garante que se o usuário já existia, ele ganhe o campo tipo
        usuarioEncontrado.tipo = tipo;
        fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2), 'utf8');
    }

    return res.json({
        sucesso: true,
        usuario: {
            email: usuarioEncontrado.email,
            tipo: usuarioEncontrado.tipo || tipo
        },
        mensagem: 'Login com Google autenticado com sucesso!'
    });
});

// Endpoint interno para buscar os dados completos do usuário (incluindo alergias e restrições)
app.get('/internal/usuario', (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({ sucesso: false, erro: 'E-mail não fornecido.' });
    }

    const usuarios = lerUsuarios();
    const usuarioEncontrado = usuarios.find(u => u.email === email);

    if (!usuarioEncontrado) {
        return res.status(404).json({ sucesso: false, erro: 'Usuário não encontrado.' });
    }

    // Retorna os dados do usuário, garantindo valores padrão caso não estejam preenchidos no JSON
    return res.json({
        sucesso: true,
        usuario: {
            nome: usuarioEncontrado.nome || email.split('@')[0],
            email: usuarioEncontrado.email,
            tipo: usuarioEncontrado.tipo || identificarTipoUsuario(email),
            alergias: usuarioEncontrado.alergias || [],
            restricoes: usuarioEncontrado.restricoes || ''
        }
    });
});

app.listen(PORT, () => {
    console.log(`[Auth Service] Rodando na porta ${PORT}`);
});