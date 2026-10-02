import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

async function loadMenu() {
    const container = document.getElementById('menu-container');
        const catSnapshot = await getDocs(collection(db, "categories"));
            const categories = {};
                catSnapshot.forEach(doc => { categories[doc.id] = doc.data().name; });

                    const itemSnapshot = await getDocs(collection(db, "items"));
                        const items = [];
                            itemSnapshot.forEach(doc => { items.push(doc.data()); });

                                for (const [catId, catName] of Object.entries(categories)) {
                                        const catItems = items.filter(item => item.categoryId === catId);
                                                if (catItems.length === 0) continue;

                                                        const section = document.createElement('div');
                                                                section.className = 'category-section';
                                                                        section.innerHTML = `<h3 class="category-title">${catName}</h3><div class="items-grid"></div>`;
                                                                                
                                                                                        const grid = section.querySelector('.items-grid');
                                                                                                catItems.forEach(item => {
                                                                                                            grid.innerHTML += `
                                                                                                                            <div class="item-card">
                                                                                                                                                <img src="${item.imageUrl}" alt="${item.name}">
                                                                                                                                                                    <h4 class="item-name">${item.name}</h4>
                                                                                                                                                                                        <p class="item-price">₹${item.price}</p>
                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                    `;
                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                    container.appendChild(section);
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                        loadMenu();
                                                                                                                                                                                                                                        