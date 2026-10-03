import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

let editingCategoryId = null;
let categoriesCache = {};
let categoriesListFull = [];
let activeItemId = null;
let activeCategoryId = null;

onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'adda@adda.com') {
        // If already logged in and visiting login.html or root, it handles auto-redirect if placed there, 
        // but here we keep the admin security check intact:
    } else if (!user && window.location.pathname.includes('admin.html')) {
        window.location.href = "login.html";
    }
});

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = "index.html");
    });
}

// Category Form
const catForm = document.getElementById('cat-form');
if (catForm) {
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
        loadCategoriesAndItems();
    });
}

async function loadCategoriesAndItems() {
    const list = document.getElementById('cat-list');
    const select = document.getElementById('item-category');
    const modalSelect = document.getElementById('modal-target-category');
    
    if (!list) return;

    list.innerHTML = '';
    if (select) select.innerHTML = '<option value="">Select Category...</option>';
    if (modalSelect) modalSelect.innerHTML = '';
    categoriesCache = {};
    categoriesListFull = [];
    
    const snapshot = await getDocs(collection(db, "categories"));
    snapshot.forEach(docSnap => {
        categoriesListFull.push({ id: docSnap.id, ...docSnap.data() });
    });

    categoriesListFull.sort((a, b) => (a.order || 0) - (b.order || 0));

    categoriesListFull.forEach(cat => {
        categoriesCache[cat.id] = cat.name;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>[#${cat.order || 0}] <strong>${cat.name}</strong></span>
            <div class="action-buttons">
                <button class="rename-cat-btn" data-id="${cat.id}" data-name="${cat.name}" data-order="${cat.order || 0}">Rename</button>
                <button class="move-cat-btn" data-id="${cat.id}" data-order="${cat.order || 0}">Move</button>
                <button class="delete-btn" data-id="${cat.id}">Delete</button>
            </div>
        `;
        list.appendChild(li);
        
        if (select) {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        }

        if (modalSelect) {
            const modalOption = document.createElement('option');
            modalOption.value = cat.id;
            modalOption.textContent = cat.name;
            modalSelect.appendChild(modalOption);
        }
    });

    // Rename Category Trigger
    document.querySelectorAll('.rename-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingCategoryId = e.target.dataset.id;
            document.getElementById('cat-name').value = e.target.dataset.name;
            document.getElementById('cat-order').value = e.target.dataset.order;
            document.getElementById('cat-submit-btn').textContent = "Update Category";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Move Category Position Trigger
    document.querySelectorAll('.move-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategoryId = e.target.dataset.id;
            document.getElementById('modal-target-position').value = e.target.dataset.order || 1;
            document.getElementById('move-cat-modal').style.display = 'flex';
        });
    });

    // Category Delete with Confirmation
    document.querySelectorAll('#cat-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const catId = e.target.dataset.id;
            if (confirm("Are you sure you want to delete this category?")) {
                await deleteDoc(doc(db, "categories", catId));
                loadCategoriesAndItems();
            }
        });
    });

    loadItems();
}

// Add Item Form
const itemForm = document.getElementById('item-form');
if (itemForm) {
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
}

async function loadItems() {
    const list = document.getElementById('admin-items-list');
    if (!list) return;
    
    list.innerHTML = '';
    const snapshot = await getDocs(collection(db, "items"));
    
    let itemsList = [];
    snapshot.forEach(docSnap => {
        itemsList.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort items category-wise based on category order
    itemsList.sort((a, b) => {
        const catA = categoriesListFull.find(c => c.id === a.categoryId);
        const catB = categoriesListFull.find(c => c.id === b.categoryId);
        const orderA = catA ? (catA.order || 0) : 999;
        const orderB = catB ? (catB.order || 0) : 999;
        return orderA - orderB;
    });

    itemsList.forEach(item => {
        const categoryName = categoriesCache[item.categoryId] || "Unassigned";
        
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div class="item-info">
                <span><strong>${item.name}</strong> [${categoryName}] - ₹${item.price}</span>
            </div>
            <div class="action-buttons">
                <button class="rename-item-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">Rename</button>
                <button class="move-item-btn" data-id="${item.id}" data-cat="${item.categoryId}">Move</button>
                <button class="delete-btn" data-id="${item.id}">Delete</button>
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

    // Item Delete with Confirmation
    document.querySelectorAll('#admin-items-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = e.target.dataset.id;
            if (confirm("Are you sure you want to delete this item?")) {
                await deleteDoc(doc(db, "items", itemId));
                loadItems();
            }
        });
    });
}

// Modal Actions
const saveRenameBtn = document.getElementById('save-rename-btn');
if (saveRenameBtn) {
    saveRenameBtn.addEventListener('click', async () => {
        const name = document.getElementById('modal-item-name').value;
        const price = document.getElementById('modal-item-price').value;
        if (activeItemId && name && price) {
            await updateDoc(doc(db, "items", activeItemId), { name, price });
            document.getElementById('rename-modal').style.display = 'none';
            loadItems();
        }
    });
}

const cancelRenameBtn = document.getElementById('cancel-rename-btn');
if (cancelRenameBtn) {
    cancelRenameBtn.addEventListener('click', () => {
        document.getElementById('rename-modal').style.display = 'none';
    });
}

const saveMoveBtn = document.getElementById('save-move-btn');
if (saveMoveBtn) {
    saveMoveBtn.addEventListener('click', async () => {
        const categoryId = document.getElementById('modal-target-category').value;
        if (activeItemId && categoryId) {
            await updateDoc(doc(db, "items", activeItemId), { categoryId });
            document.getElementById('move-modal').style.display = 'none';
            loadItems();
        }
    });
}

const cancelMoveBtn = document.getElementById('cancel-move-btn');
if (cancelMoveBtn) {
    cancelMoveBtn.addEventListener('click', () => {
        document.getElementById('move-modal').style.display = 'none';
    });
}

// Category Position Modal Actions
const saveCatMoveBtn = document.getElementById('save-cat-move-btn');
if (saveCatMoveBtn) {
    saveCatMoveBtn.addEventListener('click', async () => {
        const newOrder = Number(document.getElementById('modal-target-position').value);
        if (activeCategoryId) {
            await updateDoc(doc(db, "categories", activeCategoryId), { order: newOrder });
            document.getElementById('move-cat-modal').style.display = 'none';
            loadCategoriesAndItems();
        }
    });
}

const cancelCatMoveBtn = document.getElementById('cancel-cat-move-btn');
if (cancelCatMoveBtn) {
    cancelCatMoveBtn.addEventListener('click', () => {
        document.getElementById('move-cat-modal').style.display = 'none';
    });
}

loadCategoriesAndItems();