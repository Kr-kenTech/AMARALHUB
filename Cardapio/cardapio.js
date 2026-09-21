let currentUserRole = 'ALUNO';

// Dados estruturados prontos para substituição por API no futuro
const dailyMeals = [
    {
        id: 0,
        type: "Café da Manhã",
        time: "07:30 - 08:30",
        title: "Pão na Chapa & Frutas",
        description: "Acompanha cereais, mamão e granola.",
        image: null,
        kcal: 260,
        protein: 2.5,
        carb: 15,
        badgeText: "CONTÉM GLÚTEN",
        badgeSubText: "Trigo"
    },
    {
        id: 1,
        type: "Almoço",
        time: "12:00 - 13:30",
        title: "Filé de Frango Grelhado",
        description: "Servido com arroz, feijão, salada e abacate.",
        image: null,
        kcal: 360,
        protein: 17,
        carb: 25,
        badgeText: "CONTÉM GLÚTEN",
        badgeSubText: "Leite, Soja, Aveia"
    },
    {
        id: 2,
        type: "Lanche",
        time: "15:30 - 16:30",
        title: "Mini Sanduíche Integral",
        description: "Omelete, espinafre e cenoura. Acompanha suco.",
        image: null,
        kcal: 220,
        protein: 1.5,
        carb: 27,
        badgeText: "CONTÉM GLÚTEN",
        badgeSubText: "Glúten"
    }
];

// Renderiza os cards do cardápio
function renderDailyMenu() {
    const container = document.getElementById('dailyMenuContainer');
    if (!container) return;

    container.innerHTML = dailyMeals.map(meal => `
        <div class="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
                <!-- Placeholder de Imagem -->
                <div class="h-40 w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                    ${meal.image ?
            `<img src="${meal.image}" alt="${meal.title}" class="w-full h-full object-cover">` :
            `<i class="fa-solid fa-utensils text-2xl mb-1 text-slate-300"></i>
                         <span class="text-[11px] text-slate-400">Foto do Prato</span>`
        }
                </div>

                <div class="p-4 space-y-2.5">
                    <!-- Horário -->
                    <div class="flex items-center text-xs text-slate-500 font-medium gap-1.5">
                        <i class="fa-regular fa-clock text-slate-400"></i>
                        <span class="font-bold text-slate-700">${meal.type}</span>
                        <span class="ml-auto text-slate-400">${meal.time}</span>
                    </div>

                    <!-- Título e Descrição -->
                    <div>
                        <h3 class="text-sm font-bold text-slate-900">${meal.title}</h3>
                        <p class="text-xs text-slate-500 mt-0.5 leading-normal">${meal.description}</p>
                    </div>

                    <!-- Informação Nutricional -->
                    <div class="flex items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                        <span>Kcal: ${meal.kcal}</span>
                        <span>Prot: ${meal.protein}g</span>
                        <span>Carb: ${meal.carb}g</span>
                    </div>

                    <!-- Alertas -->
                    <div class="pt-1">
                        <div class="inline-block bg-[#d92626] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                            ${meal.badgeText}
                        </div>
                        ${meal.badgeSubText ? `<p class="text-[11px] text-slate-500 font-medium mt-1">Alergênicos: <span class="text-slate-700">${meal.badgeSubText}</span></p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Alternar Perfil
function setUserRole(role) {
    currentUserRole = role;
    const btnStudent = document.getElementById('btnRoleStudent');
    const btnAdmin = document.getElementById('btnRoleAdmin');

    if (role === 'ALUNO') {
        btnStudent.className = "px-2.5 py-1 text-xs font-bold rounded-lg bg-[#1448b1] text-white";
        btnAdmin.className = "px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-200";
    } else {
        btnAdmin.className = "px-2.5 py-1 text-xs font-bold rounded-lg bg-[#1448b1] text-white";
        btnStudent.className = "px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-200";
    }
}

// Alternar abas do menu lateral
function switchTab(tabId) {
    document.querySelectorAll('main section').forEach(el => el.classList.add('hidden'));
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('nav button').forEach(btn => {
        btn.className = "w-full flex items-center gap-3 px-4 py-2.5 text-xs rounded-xl text-white hover:bg-white/10";
    });

    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.className = "w-full flex items-center gap-3 px-4 py-2.5 text-xs rounded-xl sidebar-item-active";
    }
}

// Fechar Modal
function close403Modal() {
    const modal = document.getElementById('modal403');
    if (modal) modal.classList.add('hidden');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderDailyMenu();
});