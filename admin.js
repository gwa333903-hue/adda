import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

let editingCategoryId = null;
let editingItemId = null;
let categoriesCache = {};

onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== 'adda@adda.com') {
        window.location.href = "login.html";
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

// Category Form Submission (Add or Edit)
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
            <div>
                <button class="edit-cat-btn" data-id="${docSnap.id}" data-name="${data.name}">Edit</button>
                <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
            </div>
        `;
        list.appendChild(li);
        
        const option = document.createElement('option');
        option.value = docSnap.id;
        option.textContent = data.name;
        select.appendChild(option);
    });

    // Edit Category Listeners
    document.querySelectorAll('.edit-cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingCategoryId = e.target.dataset.id;
            document.getElementById('cat-name').value = e.target.dataset.name;
            document.getElementById('cat-submit-btn').textContent = "Update Category";
        });
    });

    // Delete Category Listeners
    document.querySelectorAll('#cat-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Are you sure you want to delete this category?")) {
                await deleteDoc(doc(db, "categories", e.target.dataset.id));
                loadCategories();
                loadItems();
            }
        });
    });
}

// Item Form Submission (Add or Edit)
const itemForm = document.getElementById('item-form');
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('add-item-btn');
    
    const categoryId = document.getElementById('item-category').value;
    const name = document.getElementById('item-name').value;
    const price = document.getElementById('item-price').value;

    try {
        if (editingItemId) {
            await updateDoc(doc(db, "items", editingItemId), { categoryId, name, price });
            editingItemId = null;
            btn.textContent = "Add Item";
        } else {
            await addDoc(collection(db, "items"), { categoryId, name, price });
        }
        itemForm.reset();
        loadItems();
    } catch (err) {
        console.error(err);
        alert("Operation failed.");
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
            <div>
                <button class="edit-item-btn" data-id="${docSnap.id}" data-cat="${data.categoryId}" data-name="${data.name}" data-price="${data.price}">Edit</button>
                <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });

    // Edit Item Listeners
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editingItemId = e.target.dataset.id;
            document.getElementById('item-category').value = e.target.dataset.cat;
            document.getElementById('item-name').value = e.target.dataset.name;
            document.getElementById('item-price').value = e.target.dataset.price;
            document.getElementById('add-item-btn').textContent = "Update Item";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Delete Item Listeners
    document.querySelectorAll('#admin-items-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await deleteDoc(doc(db, "items", e.target.dataset.id));
            loadItems();
        });
    });
}

loadCategories();
loadItems();
