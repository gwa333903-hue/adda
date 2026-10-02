import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

async function loadMenu() {
    const container = document.getElementById('menu-container');
    
    // Fetch Categories
    const catSnapshot = await getDocs(collection(db, "categories"));
    const categories = {};
    catSnapshot.forEach(doc => { categories[doc.id] = doc.data().name; });

    // Fetch Items
    const itemSnapshot = await getDocs(collection(db, "items"));
    const items = [];
    itemSnapshot.forEach(doc => { items.push(doc.data()); });

    // Render Grouped by Category in text layout
    for (const [catId, catName] of Object.entries(categories)) {
        const catItems = items.filter(item => item.categoryId === catId);
        if (catItems.length === 0) continue;

        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `
            <h3 class="category-title">${catName}</h3>
            <div class="items-list"></div>
        `;
        
        const list = section.querySelector('.items-list');
        catItems.forEach(item => {
            list.innerHTML += `
                <div class="item-row">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">₹${item.price}</span>
                </div>
            `;
        });
        container.appendChild(section);
    }
}

// Add a main title above the columns
const mainTitle = document.createElement('h1');
mainTitle.className = 'menu-title';
mainTitle.textContent = 'MENU';
document.body.insertBefore(mainTitle, document.getElementById('menu-container'));

loadMenu();
