import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

let editingCategoryId = null;
let categoriesCache = {};

onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== 'adda@adda.com') {
        window.location.href = "login.html";
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

// Category Form
const catForm = document.getElementById('cat-form');
catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    
    if (editingCategoryId) {
        await updateDoc(doc(db, "categories", editingCategoryId), { name });
        editingCategoryId = null;
        document.getElementById('cat-submit-btn').textContent = "Add Category";
    } else {
        await addDoc(collection(db, "categories"), { name });
    }
    
    catForm.reset();
    loadCategories();
    loadItems();
});

async function loadCategories() {
    const list = document.getElementById('cat-list');
    const select = document.getElementById('item-category');
    list.innerHTML = '';
    select.innerHTML = '<option value="">Select Category...</option>';
    categoriesCache = {};
    
    const snapshot = await getDocs(collection(db, "categories"));
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        categoriesCache[docSnap.id] = data.name;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${data.name}</span>
            <div class="action-buttons">
                <button class="rename-cat-btn" data-id="${docSnap.id}" data-name="${data.name}">Rename</button>
                <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
            </div>
        `;
        list.appendChild(li);
        
        const option = document.createElement('option');
        option.value = docSnap.id;
        option.textContent = data.name;
        select.appendChild(option);
    });

    document.querySelectorAll('.rename-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingCategoryId = e.target.dataset.id;
            document.getElementById('cat-name').value = e.target.dataset.name;
            document.getElementById('cat-submit-btn').textContent = "Update Category";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    document.querySelectorAll('#cat-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Delete this category?")) {
                await deleteDoc(doc(db, "categories", e.target.dataset.id));
                loadCategories();
                loadItems();
            }
        });
    });
}

// Add Item Form
const itemForm = document.getElementById('item-form');
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoryId = document.getElementById('item-category').value;
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;

    try {
        await addDoc(collection(db, "items"), { categoryId, name, price });
        itemForm.reset();
        loadItems();
    } catch (err) {
        console.error(err);
        alert("Failed to add item.");
    }
});

async function loadItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '';
    const snapshot = await getDocs(collection(db, "items"));
    
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const categoryName = categoriesCache[data.categoryId] || "Unassigned";
        
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div class="item-info">
                <span><strong>${data.name}</strong> [${categoryName}] - ₹${data.price}</span>
            </div>
            <div class="action-buttons">
                <button class="rename-item-btn" data-id="${docSnap.id}" data-name="${data.name}" data-price="${data.price}">Rename</button>
                <button class="move-item-btn" data-id="${docSnap.id}" data-cat="${data.categoryId}">Move</button>
                <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });

    // Rename Item (Prompt-based for name & price)
    document.querySelectorAll('.rename-item-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const currentName = e.target.dataset.name;
            const currentPrice = e.target.dataset.price;

            const newName = prompt("Enter new item name:", currentName);
            if (newName === null) return;
            const newPrice = prompt("Enter new price (e.g. 10 or 10,20):", currentPrice);
            if (newPrice === null) return;

            await updateDoc(doc(db, "items", id), { name: newName, price: newPrice });
            loadItems();
        });
    });

    // Move Item to another Category
    document.querySelectorAll('.move-item-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const currentCat = e.target.dataset.cat;

            let catOptions = "";
            for (const [idKey, nameVal] of Object.entries(categoriesCache)) {
                catOptions += `${idKey}: ${nameVal}\n`;
            }

            const targetCategoryName = prompt("Choose a category to move to:\n" + Object.values(categoriesCache).join(", "));
            if (!targetCategoryName) return;

            const targetEntry = Object.entries(categoriesCache).find(([k, v]) => v.toLowerCase() === targetCategoryName.toLowerCase());
            
            if (targetEntry) {
                await updateDoc(doc(db, "items", id), { categoryId: targetEntry[0] });
                loadItems();
            } else {
                alert("Category not found! Please type the exact category name.");
            }
        });
    });

    // Delete Item
    document.querySelectorAll('#admin-items-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await deleteDoc(doc(db, "items", e.target.dataset.id));
            loadItems();
        });
    });
}

loadCategories();
loadItems();
