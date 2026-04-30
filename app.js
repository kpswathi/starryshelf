const firebaseConfig = {
  apiKey: "AIzaSyDwGfUFdm9aUzpyzOkFKbv9D4U-L6zPaRU",
  authDomain: "reading-tracker-14245.firebaseapp.com",
  projectId: "reading-tracker-14245",
  storageBucket: "reading-tracker-14245.firebasestorage.app",
  messagingSenderId: "999189023747",
  appId: "1:999189023747:web:f6a079aba3cf7c65561236",
  measurementId: "G-3KBWJGEBMC"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const itemsCollection = db.collection('trackerItems');

let items = [];
let currentTab = 'Books';
let chartInstance = null;

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
    const durationValInput = document.getElementById('item-duration-val');
    const durationUnitSelect = document.getElementById('item-duration-unit');
    const ratingInput = document.getElementById('item-rating');
    const statusSelect = document.getElementById('item-status');
    const statusGroup = document.getElementById('status-group');
    const modalTitle = document.getElementById('modal-title');
    const progressLabelObj = document.getElementById('progress-label');
    const stars = document.querySelectorAll('#star-rating span');

    const itemsList = document.getElementById('items-list');
    const statsView = document.getElementById('stats-view');
    const controlsBar = document.getElementById('controls-bar');
    const sortSelect = document.getElementById('sort-select');
    const filterStatusSelect = document.getElementById('filter-status-select');
    const filterCategorySelect = document.getElementById('filter-category-select');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Subscribe to realtime updates
    itemsCollection.onSnapshot((snapshot) => {
        items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        
        // Map old data to new schema for backward compatibility display
        items = items.map(item => {
            if (item.type === 'Book') item.type = 'Books';
            if (item.type === 'Light Novel') item.type = 'Light Novels';
            return item;
        });

        renderItems();
        if (currentTab === 'Stats') renderStats();
    });

    function getProgressLabel(type) {
        switch(type) {
            case 'Books': return 'Pages';
            case 'Manga': 
            case 'Light Novels': return 'Volumes';
            case 'Anime': 
            case 'TV Shows': 
            case 'Podcasts': return 'Episodes';
            default: return 'Progress';
        }
    }

    typeSelect.addEventListener('change', () => {
        progressLabelObj.textContent = getProgressLabel(typeSelect.value);
    });

    // Star rating logic
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const val = parseInt(e.target.dataset.value);
            ratingInput.value = val;
            updateStarsUI(val);
        });
    });

    function updateStarsUI(val) {
        stars.forEach(s => {
            if (parseInt(s.dataset.value) <= val) {
                s.classList.add('star-active');
            } else {
                s.classList.remove('star-active');
            }
        });
    }

    function openModalForAdd() {
        form.reset();
        itemIdInput.value = '';
        statusGroup.style.display = 'none';
        modalTitle.textContent = 'Add New Item';
        progressLabelObj.textContent = 'Progress';
        ratingInput.value = 0;
        updateStarsUI(0);
        modal.classList.add('show');
    }

    function openModalForEdit(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;
        
        itemIdInput.value = item.id;
        titleInput.value = item.title;
        typeSelect.value = item.type || '';
        monthSelect.value = item.month || '';
        yearInput.value = item.year || new Date().getFullYear();
        imageInput.value = item.imageUrl || '';
        progressInput.value = item.progress || 0;
        durationValInput.value = item.durationVal || '';
        durationUnitSelect.value = item.durationUnit || 'days';
        ratingInput.value = item.rating || 0;
        updateStarsUI(item.rating || 0);
        statusSelect.value = item.completed ? 'true' : 'false';
        
        if(typeSelect.value) typeSelect.dispatchEvent(new Event('change'));
        
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
        if (e.target === modal) closeModal();
    });

    // Tabs logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            
            if (currentTab === 'Stats') {
                itemsList.style.display = 'none';
                controlsBar.style.display = 'none';
                statsView.style.display = 'block';
                renderStats();
            } else {
                itemsList.style.display = 'grid';
                controlsBar.style.display = 'flex';
                statsView.style.display = 'none';
                
                if (currentTab === 'Status') {
                    filterCategorySelect.style.display = 'block';
                } else {
                    filterCategorySelect.style.display = 'none';
                }
                
                renderItems();
            }
        });
    });

    // Sort and Filter logic
    sortSelect.addEventListener('change', renderItems);
    filterStatusSelect.addEventListener('change', renderItems);
    filterCategorySelect.addEventListener('change', renderItems);

    function renderItems() {
        itemsList.innerHTML = '';
        
        let filteredItems = [...items];
        
        // Tab Filtering
        if (currentTab === 'Shows') {
            filteredItems = filteredItems.filter(i => i.type === 'Anime' || i.type === 'TV Shows');
        } else if (currentTab !== 'Status' && currentTab !== 'Stats' && currentTab !== 'all') {
            filteredItems = filteredItems.filter(i => i.type === currentTab);
        }

        // Status filter from controls
        const statusVal = filterStatusSelect.value;
        if (statusVal === 'active') {
            filteredItems = filteredItems.filter(i => !i.completed);
        } else if (statusVal === 'completed') {
            filteredItems = filteredItems.filter(i => i.completed);
        }

        // Category filter from controls (only active in Status tab usually)
        if (currentTab === 'Status') {
            const catVal = filterCategorySelect.value;
            if (catVal !== 'all') {
                filteredItems = filteredItems.filter(i => i.type === catVal);
            }
        }

        // Sorting
        const sortVal = sortSelect.value;
        if (sortVal === 'newest') {
            filteredItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        } else if (sortVal === 'oldest') {
            filteredItems.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        } else if (sortVal === 'year-desc') {
            filteredItems.sort((a, b) => (b.year || 0) - (a.year || 0));
        } else if (sortVal === 'year-asc') {
            filteredItems.sort((a, b) => (a.year || 0) - (b.year || 0));
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

            const coverHTML = item.imageUrl 
                ? `<div class="card-cover" style="background-image: url('${escapeHTML(item.imageUrl)}')"></div>`
                : `<div class="card-cover placeholder">${escapeHTML(item.title).charAt(0).toUpperCase()}</div>`;

            // Render Stars
            let starsHTML = '';
            if (item.rating > 0) {
                starsHTML = `<div class="item-rating">${'&#9733;'.repeat(item.rating)}${'&#9734;'.repeat(5 - item.rating)}</div>`;
            }

            // Render Duration
            let durationHTML = '';
            if (item.durationVal) {
                durationHTML = `<div class="item-duration">Time Taken: ${item.durationVal} ${item.durationUnit}</div>`;
            }

            card.innerHTML = `
                ${coverHTML}
                <div class="card-content">
                    <div class="item-title">${escapeHTML(item.title)}</div>
                    ${starsHTML}
                    
                    <div class="item-meta">
                        <span class="tag ${tagClass}">${item.type}</span>
                        ${item.month && item.year ? `<span class="tag date">${item.month} ${item.year}</span>` : ''}
                        ${item.completed ? `<span class="tag completed-tag">Completed</span>` : ''}
                    </div>

                    <div class="progress-info">
                        ${progressLabel}: <b id="progress-val-${item.id}">${item.progress || 0}</b>
                        ${durationHTML}
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
        const durationVal = parseInt(durationValInput.value) || null;
        const durationUnit = durationUnitSelect.value;
        const rating = parseInt(ratingInput.value) || 0;
        const completed = statusSelect.value === 'true';
        
        if (!title || !type) return;

        if (completed && !durationVal) {
            alert('Please enter the Time Taken for completed items.');
            return;
        }

        if (id) {
            await itemsCollection.doc(id).update({
                title, type, month, year, imageUrl, progress, 
                durationVal, durationUnit, rating, completed
            });
        } else {
            const newItem = {
                title, type, month, year, imageUrl, progress,
                durationVal, durationUnit, rating,
                completed: false, // New items default to active unless they immediately edit status. Wait, status isn't shown on Add.
                createdAt: Date.now()
            };
            // If they can set completed on add, we use completed, but it's hidden on add.
            await itemsCollection.add(newItem);
        }
        
        closeModal();
    });

    function renderStats() {
        const ctx = document.getElementById('progressChart');
        
        const progressByMonth = {};
        items.forEach(item => {
            if (!item.month || !item.year) return;
            const key = `${item.month} ${item.year}`;
            progressByMonth[key] = (progressByMonth[key] || 0) + (item.progress || 0);
        });

        const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const sortedKeys = Object.keys(progressByMonth).sort((a, b) => {
            const [mA, yA] = a.split(' ');
            const [mB, yB] = b.split(' ');
            if (yA !== yB) return parseInt(yA) - parseInt(yB);
            return monthsOrder.indexOf(mA) - monthsOrder.indexOf(mB);
        });

        const labels = sortedKeys;
        const data = sortedKeys.map(k => progressByMonth[k]);

        if (chartInstance) chartInstance.destroy();
        
        if(ctx) {
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels.length ? labels : ['No Data'],
                    datasets: [{
                        label: 'Total Progress Activity',
                        data: data.length ? data : [0],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#e2e8f0' } }
                    },
                    scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        const heatmap = document.getElementById('heatmap');
        if (heatmap) {
            heatmap.innerHTML = '';
            const cells = 365;
            const activityCount = new Array(cells).fill(0);
            const now = Date.now();
            const dayMs = 1000 * 60 * 60 * 24;
            
            items.forEach(item => {
                if (!item.createdAt) return;
                const diffDays = Math.floor((now - item.createdAt) / dayMs);
                if (diffDays >= 0 && diffDays < cells) {
                    const index = cells - 1 - diffDays;
                    // using progress to determine activity intensity
                    activityCount[index] += (item.progress || 1);
                }
            });

            for (let i = 0; i < cells; i++) {
                const cell = document.createElement('div');
                cell.className = 'heatmap-cell';
                let level = 0;
                const count = activityCount[i];
                if (count > 0 && count <= 5) level = 1;
                else if (count > 5 && count <= 20) level = 2;
                else if (count > 20 && count <= 50) level = 3;
                else if (count > 50) level = 4;
                
                cell.setAttribute('data-level', level);
                if (count > 0) cell.title = `Activity level: ${count}`;
                heatmap.appendChild(cell);
            }
        }
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.toString().replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
    
    // Initial fetch triggers render
});
