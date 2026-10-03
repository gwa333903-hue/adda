import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

async function loadMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';
    
    // Fetch Categories
    const catSnapshot = await getDocs(collection(db, "categories"));
    let categoriesList = [];
    catSnapshot.forEach(doc => { 
        categoriesList.push({ id: doc.id, ...doc.data() }); 
    });

    // Sort categories based on their order number
    categoriesList.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Fetch Items
    const itemSnapshot = await getDocs(collection(db, "items"));
    const items = [];
    itemSnapshot.forEach(doc => { items.push(doc.data()); });

    // Render Grouped by Sorted Category
    categoriesList.forEach(cat => {
        const catItems = items.filter(item => item.categoryId === cat.id);
        if (catItems.length === 0) return;

        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `
            <h3 class="category-title">${cat.name}</h3>
            <div class="items-list"></div>
        `;
        
        const list = section.querySelector('.items-list');
        catItems.forEach(item => {
            const formattedPrice = item.price.toString().split(',').map(p => `₹${p.trim()}`).join(' / ');
            
            list.innerHTML += `
                <div class="item-row">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">${formattedPrice}</span>
                </div>
            `;
        });
        container.appendChild(section);
    });
}

// Add main title if missing
if (!document.querySelector('.menu-title')) {
    const mainTitle = document.createElement('h1');
    mainTitle.className = 'menu-title';
    mainTitle.textContent = 'MENU';
    document.body.insertBefore(mainTitle, document.getElementById('menu-container'));
}

loadMenu();
