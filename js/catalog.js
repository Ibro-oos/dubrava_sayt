const DATA_URL = 'json/data.json';
const productGrid = document.getElementById('product-grid');
const detailSection = document.getElementById('detail-section');
const detailCard = document.getElementById('detail-card');
const closeBtn = document.getElementById('close-btn');
const countText = document.getElementById('count');

let productsData = [];

async function loadProduct() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

        productsData = await response.json();
        countText.textContent = `Найдено товаров: ${productsData.length}`;
        renderProductsList(productsData);
    } catch (error) {
        console.error('Ошибка JSON', error);
        productGrid.innerHTML = '<p style="color: red;">Error!</p>';
    }
}

function renderProductsList(products) {
    productGrid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
            <div class="category">${product.category}</div>
            <h3>${product.name}</h3>
            <div class="product-price">
                <span class="price">${product.price.toLocaleString('ru-RU')} ₽</span>
            </div>
        </div>
        `;
        card.addEventListener('click', () => showProductDetail(product.id));
        productGrid.appendChild(card);
    });
}

/* Пометка: модалка */

function showProductDetail(product_id) {
    const product = productsData.find(p => p.id === product_id);
    if (!product) return;

    const specsList = Object.entries(product.specs)
        .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
        .join('');

    detailCard.innerHTML = `
    <div class="detail-layout">
        <h2>${product.name}</h2>
        <img src="${product.image}" alt="${product.name}" class="detail-img">
        <p class="detail-desc">${product.description}</p>
        <div class="detail-specs">
            <strong>Характеристики</strong>
            <ul style="margin-top: 10px">${specsList}</ul>
        </div>
        <p class="product-price" style="font-size: 1.5rem;">${product.price.toLocaleString('ru-RU')} ₽</p>
    </div>
    `;

    detailSection.classList.remove('hidden');
    document.body.classList.add('no-scroll'); // блокируем прокрутку страницы
}

function closeProductDetail() {
    detailSection.classList.add('hidden');
    document.body.classList.remove('no-scroll'); // возвращаем прокрутку
}

closeBtn.addEventListener('click', closeProductDetail);
detailSection.addEventListener('click', (e) => {
    if (e.target === detailSection) closeProductDetail();
});

document.addEventListener('DOMContentLoaded', loadProduct);