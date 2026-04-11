const firebaseConfig = {
  apiKey: "AIzaSyDwGfUFdm9aUzpyzOkFKbv9D4U-L6zPaRU",
  authDomain: "reading-tracker-14245.firebaseapp.com",
  projectId: "reading-tracker-14245",
  storageBucket: "reading-tracker-14245.firebasestorage.app",
  messagingSenderId: "999189023747",
  appId: "1:999189023747:web:f6a079aba3cf7c65561236",
  measurementId: "G-3KBWJGEBMC"
};

// Initialize Firebase using Compat Library
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const itemsCollection = db.collection('trackerItems');

let items = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const addNewBtn = document.getElementById('add-new-btn');
    const modal = document.getElementById('item-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const form = document.getElementById('item-form');
    
    // Form fields
    const itemIdInput = document.getElementById('item-id');
    const titleInput = document.getElementById('item-title');
    const typeSelect = document.getElementById('item-type');
    const monthSelect = document.getElementById('item-month');
    const yearInput = document.getElementById('item-year');
    const imageInput = document.getElementById('item-image');
    const progressInput = document.getElementById('item-progress');
    const statusSelect = document.getElementById('item-status');
    const statusGroup = document.getElementById('status-group');
    const modalTitle = document.getElementById('modal-title');
    const progressLabelObj = document.getElementById('progress-label');

    const itemsList = document.getElementById('items-list');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Subscribe to realtime updates
    itemsCollection.onSnapshot((snapshot) => {
        items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort items by creation time, newest first
        items.sort((a, b) => b.createdAt - a.createdAt);
        
        renderItems();
    });

    // Dynamic Label Logic
    typeSelect.addEventListener('change', () => {
        const type = typeSelect.value;
        switch(type) {
            case 'Anime': progressLabelObj.textContent = 'Episodes Completed'; break;
            case 'Manga': 
            case 'Light Novel': progressLabelObj.textContent = 'Volumes Completed'; break;
            case 'Book': progressLabelObj.textContent = 'Pages Read'; break;
            default: progressLabelObj.textContent = 'Progress';
        }
    });

    // Modal behavior
    function openModalForAdd() {
        form.reset();
        itemIdInput.value = '';
        statusGroup.style.display = 'none';
        modalTitle.textContent = 'Add New Item';
        progressLabelObj.textContent = 'Progress'; // Reset label
        modal.classList.add('show');
    }

    function openModalForEdit(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;
        
        itemIdInput.value = item.id;
        titleInput.value = item.title;
        typeSelect.value = item.type;
        monthSelect.value = item.month || '';
        yearInput.value = item.year || new Date().getFullYear();
        imageInput.value = item.imageUrl || '';
        progressInput.value = item.progress || 0;
        statusSelect.value = item.completed ? 'true' : 'false';
        
        // Trigger manual change to update progress label text
        typeSelect.dispatchEvent(new Event('change'));
        
        statusGroup.style.display = 'block';
        modalTitle.textContent = 'Edit Item';
        modal.classList.add('show');
    }

    function closeModal() {
        modal.classList.remove('show');
    }

    addNewBtn.addEventListener('click', openModalForAdd);
    closeModalBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    function renderItems() {
        itemsList.innerHTML = '';
        
        let filteredItems = items;
        if (currentFilter === 'active') {
            filteredItems = items.filter(item => !item.completed);
        } else if (currentFilter === 'completed') {
            filteredItems = items.filter(item => item.completed);
        }

        if (filteredItems.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-state">
                    <p>No items found in this section! Click "Add New" to get started.</p>
                </div>
            `;
            return;
        }

        filteredItems.forEach(item => {
            const card = document.createElement('div');
            card.className = `item-card ${item.completed ? 'completed' : ''}`;
            
            const progressLabel = getProgressLabel(item.type);
            const tagClass = item.type ? item.type.replace(/\s+/g, '').toLowerCase() : '';

            // Render cover image or placeholder
            const coverHTML = item.imageUrl 
                ? `<div class="card-cover" style="background-image: url('${escapeHTML(item.imageUrl)}')"></div>`
                : `<div class="card-cover placeholder">${escapeHTML(item.title).charAt(0).toUpperCase()}</div>`;

            card.innerHTML = `
                ${coverHTML}
                <div class="card-content">
                    <div class="item-title">${escapeHTML(item.title)}</div>
                    
                    <div class="item-meta">
                        <span class="tag ${tagClass}">${item.type}</span>
                        ${item.month && item.year ? `<span class="tag date">${item.month} ${item.year}</span>` : ''}
                        ${item.completed ? `<span class="tag completed-tag">Completed</span>` : ''}
                    </div>

                    <div class="progress-info">
                        ${progressLabel}: <b id="progress-val-${item.id}">${item.progress || 0}</b>
                    </div>
                    
                    <div class="item-actions">
                        <div class="action-group">
                            ${!item.completed ? `
                                <div class="progress-controls">
                                    <button class="icon-btn" data-action="decrease" data-id="${item.id}" title="Decrease progress">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </button>
                                    <button class="icon-btn" data-action="increase" data-id="${item.id}" title="Increase progress">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </button>
                                </div>
                            ` : '<div></div>'}
                        </div>
                        
                        <div class="action-group">
                            <button class="icon-btn" data-action="edit" data-id="${item.id}" title="Edit item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </button>
                            <button class="icon-btn ${item.completed ? 'success-btn' : ''}" data-action="toggleComplete" data-id="${item.id}" title="${item.completed ? 'Reopen' : 'Mark Complete'}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${item.completed ? 'currentColor' : '#10b981'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </button>
                            ${item.completed ? `
                                <button class="icon-btn danger-btn" data-action="delete" data-id="${item.id}" title="Delete item">
                                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            itemsList.appendChild(card);
        });
    }

    // Event delegation
    itemsList.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const item = items.find(i => i.id === id);
        if (!item) return;

        const itemRef = itemsCollection.doc(id);

        if (action === 'increase' || action === 'decrease') {
            const change = action === 'increase' ? 1 : -1;
            const newProgress = Math.max(0, (item.progress || 0) + change);
            
            const progressEl = document.getElementById(`progress-val-${id}`);
            if (progressEl) {
                progressEl.textContent = newProgress;
                const cardEl = progressEl.closest('.item-card');
                if (cardEl) {
                    cardEl.classList.remove('pulse');
                    void cardEl.offsetWidth;
                    cardEl.classList.add('pulse');
                }
            }
            
            await itemRef.update({ progress: newProgress });
        } else if (action === 'toggleComplete') {
            await itemRef.update({ completed: !item.completed });
        } else if (action === 'delete') {
            if(confirm('Are you sure you want to delete this item?')) {
                await itemRef.delete();
            }
        } else if (action === 'edit') {
            openModalForEdit(id);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = itemIdInput.value;
        const title = titleInput.value.trim();
        const type = typeSelect.value;
        const month = monthSelect.value;
        const year = parseInt(yearInput.value) || new Date().getFullYear();
        const imageUrl = imageInput.value.trim();
        const progress = parseInt(progressInput.value) || 0;
        
        if (!title || !type) return;

        if (id) {
            // Update existing
            const completed = statusSelect.value === 'true';
            await itemsCollection.doc(id).update({
                title,
                type,
                month,
                year,
                imageUrl,
                progress,
                completed
            });
        } else {
            // Add new
            const newItem = {
                title,
                type,
                month,
                year,
                imageUrl,
                progress,
                completed: false,
                createdAt: Date.now()
            };
            await itemsCollection.add(newItem);
        }
        
        closeModal();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderItems();
        });
    });

    function getProgressLabel(type) {
        switch(type) {
            case 'Anime': return 'Episodes';
            case 'Manga': return 'Volumes';
            case 'Light Novel': return 'Volumes';
            case 'Book': return 'Pages';
            default: return 'Progress';
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
