import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (!user || user.email !== 'adda@adda.com') {
        window.location.href = "login.html";
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

const catForm = document.getElementById('cat-form');
catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cat-name').value;
    await addDoc(collection(db, "categories"), { name });
    catForm.reset();
    loadCategories();
});

async function loadCategories() {
    const list = document.getElementById('cat-list');
    const select = document.getElementById('item-category');
    list.innerHTML = '';
    select.innerHTML = '<option value="">Select Category...</option>';
    
    const snapshot = await getDocs(collection(db, "categories"));
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const li = document.createElement('li');
        li.innerHTML = `<span>${data.name}</span> <button class="delete-btn" data-id="${docSnap.id}">Delete</button>`;
        list.appendChild(li);
        
        const option = document.createElement('option');
        option.value = docSnap.id;
        option.textContent = data.name;
        select.appendChild(option);
    });

    document.querySelectorAll('#cat-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await deleteDoc(doc(db, "categories", e.target.dataset.id));
            loadCategories();
        });
    });
}

const itemForm = document.getElementById('item-form');
itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('add-item-btn');
    btn.textContent = "Adding...";
    btn.disabled = true;

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
    } finally {
        btn.textContent = "Add Item";
        btn.disabled = false;
    }
});

async function loadItems() {
    const list = document.getElementById('admin-items-list');
    list.innerHTML = '';
    const snapshot = await getDocs(collection(db, "items"));
    
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div class="item-info">
                <span><strong>${data.name}</strong> - ₹${data.price}</span>
            </div>
            <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
        `;
        list.appendChild(div);
    });

    document.querySelectorAll('#admin-items-list .delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            await deleteDoc(doc(db, "items", e.target.dataset.id));
            loadItems();
        });
    });
}

loadCategories();
loadItems();
