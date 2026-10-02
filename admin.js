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
    const modalSelect = document.getElementById('modal-target-category');
    
    list.innerHTML = '';
    select.innerHTML = '<option value="">Select Category...</option>';
    modalSelect.innerHTML = '';
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

        const modalOption = document.createElement('option');
        modalOption.value = docSnap.id;
        modalOption.textContent = data.name;
        modalSelect.appendChild(modalOption);
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

    // Rename Item Modal Trigger
    document.querySelectorAll('.rename-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeItemId = e.target.dataset.id;
            document.getElementById('modal-item-name').value = e.target.dataset.name;
            document.getElementById('modal-item-price').value = e.target.dataset.price;
            document.getElementById('rename-modal').style.display = 'flex';
        });
    });

    // Move Item Modal Trigger
    document.querySelectorAll('.move-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeItemId = e.target.dataset.id;
            document.getElementById('modal-target-category').value = e.target.dataset.cat;
            document.getElementById('move-modal').style.display = 'flex';
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
