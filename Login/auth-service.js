require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.AUTH_PORT || 4001;
const USERS_FILE = path.join(__dirname, '..', 'usuarios.json');

app.use(express.json());

function lerUsuarios() {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

// Endpoint interno para validar credenciais de login
app.post('/internal/login', (req, res) => {
    const { email, password } = req.body;
    const usuarios = lerUsuarios();
    
    const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === password);

    if (!usuarioEncontrado) {
        return res.status(401).json({ sucesso: false, erro: 'Credenciais inválidas.' });
    }

    return res.json({ sucesso: true, usuario: { email: usuarioEncontrado.email } });
});

// Endpoint interno para buscar ou cadastrar/atualizar senha do usuário
app.post('/internal/usuarios', (req, res) => {
    const { email, password } = req.body;
    const usuarios = lerUsuarios();
    
    const index = usuarios.findIndex(u => u.email === email);
    
    if (index >= 0) {
        if (password) usuarios[index].password = password;
    } else {
        usuarios.push({ email, password: password || null });
    }
    
    fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2), 'utf8');
    
    const usuarioAtualizado = usuarios.find(u => u.email === email);
    return res.json({ sucesso: true, usuario: usuarioAtualizado });
});

app.listen(PORT, () => {
    console.log(`[Auth Service] Rodando na porta ${PORT}`);
});