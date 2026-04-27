/*
   app.js - основные данные и общие функции
*/

const appData = {
    currentTab: 'products',
    products: [],
    weeklyMenu: [],
    shoppingList: [],
    userHeight: null,
    userWeight: null,
    userCalories: null,
    selectedMeals: [],
    lastPrompt: null,
    lastClaudeResponse: null,
    parsedMenu: [],
    mealRatings: {},
    menuHistory: [],
    lastAIRecommendations: null,
    weekStartDate: null
};

const categories = [
    { id: 'canned', name: '🥫 Консервы', icon: '🥫' },
    { id: 'frozen', name: '❄️ Заморозки', icon: '❄️' },
    { id: 'meat', name: '🥩 Мясо и рыба', icon: '🥩' },
    { id: 'groceries', name: '🍚 Бакалея', icon: '🍚' },
    { id: 'veggies', name: '🥕 Овощи и фрукты', icon: '🥕' },
    { id: 'dairy', name: '🥛 Молочное и яйца', icon: '🥛' },
    { id: 'other', name: '🧂 Разное', icon: '🧂' }
];

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MEALS = {
    'breakfast': '🍳 Завтрак',
    'lunch': '🍲 Обед',
    'dinner': '🥗 Ужин'
};

// ============================================
// ДАТЫ
// ============================================

function getDateForDay(dayIndex) {
    if (!appData.weekStartDate) setWeekToCurrent();
    const startDate = new Date(appData.weekStartDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + dayIndex);
    return targetDate;
}

function formatDateForDay(dayIndex, format = 'short') {
    const date = getDateForDay(dayIndex);
    if (format === 'short') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    if (format === 'full') return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return date.toLocaleDateString('ru-RU');
}

function setWeekToCurrent() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    if (dayOfWeek === 0) monday.setDate(today.getDate() - 6);
    else monday.setDate(today.getDate() - (dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    appData.weekStartDate = monday.toISOString().split('T')[0];
}

function nextWeek() {
    const currentStart = new Date(appData.weekStartDate);
    currentStart.setDate(currentStart.getDate() + 7);
    appData.weekStartDate = currentStart.toISOString().split('T')[0];
    if (appData.currentTab === 'menu') showMenuTab();
}

function prevWeek() {
    const currentStart = new Date(appData.weekStartDate);
    currentStart.setDate(currentStart.getDate() - 7);
    appData.weekStartDate = currentStart.toISOString().split('T')[0];
    if (appData.currentTab === 'menu') showMenuTab();
}

function getWeekDateRange() {
    if (!appData.weekStartDate) setWeekToCurrent();
    const start = new Date(appData.weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

function getMondayFromDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function setWeekFromPicker() {
    const picker = document.getElementById('weekPicker');
    if (!picker || !picker.value) return;
    const monday = getMondayFromDate(new Date(picker.value));
    monday.setHours(0, 0, 0, 0);
    appData.weekStartDate = monday.toISOString().split('T')[0];
    if (appData.currentTab === 'menu') showMenuTab();
}

function getDateForPicker() {
    if (!appData.weekStartDate) setWeekToCurrent();
    return appData.weekStartDate;
}

function getProductsByCategory(categoryId) {
    return appData.products.filter(p => p.category === categoryId);
}

async function exportForTelegramBot() {
    const data = {
        exportDate: new Date().toISOString(),
        weekStartDate: appData.weekStartDate,
        parsedMenu: appData.parsedMenu,
        shoppingList: appData.shoppingList || [],
        products: appData.products,
        userHeight: appData.userHeight,
        userWeight: appData.userWeight,
        userCalories: appData.userCalories,
        mealRatings: appData.mealRatings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'meal-data.json';
    a.click();
}

function showTab(tabName) {
    appData.currentTab = tabName;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(
            tabName === 'products' ? 'Продукты' : 
            tabName === 'menu' ? 'Меню' : 
            tabName === 'shopping' ? 'Покупки' : 'Статистика'
        )) tab.classList.add('active');
    });
    
    if (tabName === 'products' && typeof showProductsTab === 'function') showProductsTab();
    if (tabName === 'menu' && typeof showMenuTab === 'function') { showMenuTab(); setTimeout(() => { if (appData.parsedMenu?.length && typeof displayMenu === 'function') displayMenu(appData.parsedMenu); }, 100); }
    if (tabName === 'shopping' && typeof showShoppingTab === 'function') showShoppingTab();
    if (tabName === 'stats' && typeof showStatsTab === 'function') showStatsTab();
}

// ЗАПУСК
document.addEventListener('DOMContentLoaded', async function() {
    if (typeof initApp === 'function') {
        await initApp();
    }
    
    if (appData.products.length === 0 && typeof MY_PRODUCTS !== 'undefined') {
        appData.products = MY_PRODUCTS.map((p, i) => ({ ...p, id: Date.now() + i }));
    }
    
    setWeekToCurrent();
    showTab('products');
});