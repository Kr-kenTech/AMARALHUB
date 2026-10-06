let currentUserRole = 'ALUNO';

// Dados com textos, imagens e nutrientes baseados na imagem
const dailyMeals = [
    {
        id: 0,
        type: "Café da Manhã",
        time: "07:30 - 08:30",
        title: "Pão na Chapa & Frutas",
        description: "Pão na chapa & frutas, cereais, mamão e granola. Pão na chapa & frutas, pão na chapa & frutas.",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=600",
        kcal: 260,
        protein: 2.5,
        carb: 15,
        badgeText: "CONTÉM GLÚTEN",
        badgeIcon: "fa-solid fa-wheat-awn",
        badgeSubText: "Trigo"
    },
    {
        id: 1,
        type: "Almoço",
        time: "12:00 - 13:30",
        title: "Filé de Frango Grelhado",
        description: "Filé de frango grelhado, arroz, feijão, salada, salada e abacate. Filé de Frango grelhado.",
        image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=600",
        kcal: 360,
        protein: 17,
        carb: 25,
        badgeText: "CONTÉM GLÚTEN",
        badgeIcon: "fa-solid fa-wheat-awn",
        badgeSubText: "Trigo, Aveia"
    },
    {
        id: 2,
        type: "Lanche",
        time: "15:30 - 16:30",
        title: "Mini Sanduíche Integral",
        description: "Mini sanduíche integral, de omelete, integral, e espinafre com cenoura e água de tariana.",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=600",
        kcal: 220,
        protein: 1.5,
        carb: 27,
        badgeText: "Alergênico Detectado: Glúten",
        badgeIcon: "fa-solid fa-wheat-awn",
        badgeSubText: null,
        isAlertBadge: true
    }
];

// Renderiza os cards do cardápio exatamente iguais ao design
function renderDailyMenu() {
    const container = document.getElementById('dailyMenuContainer');
    if (!container) return;

    container.innerHTML = dailyMeals.map(meal => `
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
                <!-- Imagem do Prato -->
                <div class="h-44 w-full bg-slate-100 overflow-hidden">
                    <img src="${meal.image}" alt="${meal.title}" class="w-full h-full object-cover">
                </div>

                <div class="p-5 space-y-3">
                    <!-- Horário e Tipo -->
                    <div class="flex items-center text-xs text-slate-500 font-semibold gap-1">
                        <i class="fa-regular fa-clock text-slate-400"></i>
                        <span class="text-slate-800 font-bold">${meal.type}</span>
                        <span class="ml-auto text-slate-400 font-normal">${meal.time}</span>
                    </div>

                    <!-- Título e Descrição -->
                    <div>
                        <h3 class="text-sm font-extrabold text-slate-900">${meal.title}</h3>
                        <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">${meal.description}</p>
                    </div>

                    <!-- Informação Nutricional -->
                    <div class="flex items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                        <i class="fa-regular fa-droplet text-slate-400 text-xs"></i>
                        <span>Kcal: ${meal.kcal}</span>
                        <span>Prot: ${meal.protein}</span>
                        <span>Cart: ${meal.carb}</span>
                    </div>

                    <!-- Alertas e Alergênicos -->
                    <div class="pt-1 space-y-1.5">
                        <div class="inline-flex items-center gap-1.5 bg-[#d92626] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                            <i class="${meal.badgeIcon}"></i>
                            <span>${meal.badgeText}</span>
                        </div>
                        ${meal.badgeSubText ? `
                            <p class="text-[11px] text-slate-500 font-medium">
                                Alergênico Detectado: <span class="text-slate-700">${meal.badgeSubText}</span>
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Alternar abas do menu lateral
function switchTab(tabId) {
    document.querySelectorAll('main section').forEach(el => el.classList.add('hidden'));
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    document.querySelectorAll('nav button').forEach(btn => {
        btn.className = "w-full flex items-center gap-3 px-4 py-2.5 text-xs text-white hover:bg-white/10 rounded-xl";
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