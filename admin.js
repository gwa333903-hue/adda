import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

let editingCategoryId = null;
let categoriesCache = {};
let activeItemId = null;

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
    const order = Number(document.getElementById('cat-order').value);
    
    if (editingCategoryId) {
        await updateDoc(doc(db, "categories", editingCategoryId), { name, order });
        editingCategoryId = null;
        document.getElementById('cat-submit-btn').textContent = "Add Category";
    } else {
        await addDoc(collection(db, "categories"), { name, order });
    }
    
    catForm.reset();
    loadCategories();
    loadItems();
});

async function loadCategories() {
    const list = document.getElementById('cat-list');
    const select = document.getElementById('item-category');
    const modalSelect = document.getElementById('modal-target-category');
    
    list.innerHTML = '';
    select.innerHTML = '<option value="">Select Category...</option>';
    modalSelect.innerHTML = '';
    categoriesCache = {};
    
    const snapshot = await getDocs(collection(db, "categories"));
    let categoriesList = [];
    snapshot.forEach(docSnap => {
        categoriesList.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort categories by their order number
    categoriesList.sort((a, b) => (a.order || 0) - (b.order || 0));

    categoriesList.forEach(cat => {
        categoriesCache[cat.id] = cat.name;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>[#${cat.order || 0}] <strong>${cat.name}</strong></span>
            <div class="action-buttons">
                <button class="rename-cat-btn" data-id="${cat.id}" data-name="${cat.name}" data-order="${cat.order || 0}">Rename</button>
                <button class="delete-btn" data-id="${cat.id}">Delete</button>
            </div>
        `;
        list.appendChild(li);
        
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);

        const modalOption = document.createElement('option');
        modalOption.value = cat.id;
        modalOption.textContent = cat.name;
        modalSelect.appendChild(modalOption);
    });

    document.querySelectorAll('.rename-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingCategoryId = e.target.dataset.id;
            document.getElementById('cat-name').value = e.target.dataset.name;
            document.getElementById('cat-order').value = e.target.dataset.order;
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

    document.querySelectorAll('.rename-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeItemId = e.target.dataset.id;
            document.getElementById('modal-item-name').value = e.target.dataset.name;
            document.getElementById('modal-item-price').value = e.target.dataset.price;
            document.getElementById('rename-modal').style.display = 'flex';
        });
    });

    document.querySelectorAll('.move-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeItemId = e.target.dataset.id;
            document.getElementById('modal-target-category').value = e.target.dataset.cat;
            document.getElementById('move-modal').style.display = 'flex';
        });
    });

    document.querySelectorAll('#admin-items-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await deleteDoc(doc(db, "items", e.target.dataset.id));
            loadItems();
        });
    });
}

// Modal Actions
document.getElementById('save-rename-btn').addEventListener('click', async () => {
    const name = document.getElementById('modal-item-name').value;
    const price = document.getElementById('modal-item-price').value;
    if (activeItemId && name && price) {
        await updateDoc(doc(db, "items", activeItemId), { name, price });
        document.getElementById('rename-modal').style.display = 'none';
        loadItems();
    }
});

document.getElementById('cancel-rename-btn').addEventListener('click', () => {
    document.getElementById('rename-modal').style.display = 'none';
});

document.getElementById('save-move-btn').addEventListener('click', async () => {
    const categoryId = document.getElementById('modal-target-category').value;
    if (activeItemId && categoryId) {
        await updateDoc(doc(db, "items", activeItemId), { categoryId });
        document.getElementById('move-modal').style.display = 'none';
        loadItems();
    }
});

document.getElementById('cancel-move-btn').addEventListener('click', () => {
    document.getElementById('move-modal').style.display = 'none';
});

loadCategories();
loadItems();
