/**
 * Social Media Content Tracker - Main Application
 * Updated to use GET requests for all operations (CORS-friendly)
 */

// Global state
let allData = [];
let filteredData = [];
let currentEditRow = null;

// ===================================
// API Functions (Using GET for all operations)
// ===================================

async function fetchData() {
    showLoading(true);
    try {
        const response = await fetch(CONFIG.API_URL);
        const result = await response.json();

        if (result.success) {
            allData = result.data || [];
            filteredData = [...allData];
            updateStats(result.stats);
            renderData();
            populateAccountFilter();
        } else {
            showToast('Gagal memuat data: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Error: Tidak dapat terhubung ke server', 'error');

        // Show demo data for testing without backend
        if (CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            showDemoMode();
        }
    } finally {
        showLoading(false);
    }
}

// CREATE - Using GET with action=create
async function createPost(data) {
    try {
        // Build URL with query parameters
        const params = new URLSearchParams({
            action: 'create',
            apiKey: CONFIG.API_KEY,
            ...data
        });

        const url = `${CONFIG.API_URL}?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            showToast('Data berhasil disimpan!', 'success');
            fetchData();
            showPage('dashboard');
            document.getElementById('post-form').reset();
        } else {
            showToast('Gagal menyimpan: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Create error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// UPDATE - Using GET with action=update
async function updatePost(data) {
    try {
        const params = new URLSearchParams({
            action: 'update',
            apiKey: CONFIG.API_KEY,
            ...data
        });

        const url = `${CONFIG.API_URL}?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            showToast('Data berhasil diupdate!', 'success');
            closeModal();
            fetchData();
        } else {
            showToast('Gagal update: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// DELETE - Using GET with action=delete
async function deletePost(rowIndex) {
    try {
        const params = new URLSearchParams({
            action: 'delete',
            apiKey: CONFIG.API_KEY,
            _rowIndex: rowIndex
        });

        const url = `${CONFIG.API_URL}?${params.toString()}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            showToast('Data berhasil dihapus!', 'success');
            closeDeleteModal();
            fetchData();
        } else {
            showToast('Gagal hapus: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// ===================================
// UI Rendering Functions
// ===================================

function renderData() {
    const tableBody = document.getElementById('data-table-body');
    const cardsContainer = document.getElementById('data-cards');
    const emptyState = document.getElementById('empty-state');

    if (filteredData.length === 0) {
        tableBody.innerHTML = '';
        cardsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Render table rows
    tableBody.innerHTML = filteredData.map(row => `
    <tr>
      <td>${formatDate(row.post_Date)}</td>
      <td><span class="badge">${row.post_Type || '-'}</span></td>
      <td>${row.post_Akun || '-'}</td>
      <td class="truncate">
        <a href="${row.post_URL}" target="_blank" rel="noopener">${shortenUrl(row.post_URL)}</a>
      </td>
      <td class="truncate">
        ${row.post_Sumber ? `<a href="${row.post_Sumber}" target="_blank" rel="noopener">${shortenUrl(row.post_Sumber)}</a>` : '-'}
      </td>
      <td>${row.post_Likes || 0}</td>
      <td>${row.ID_Karyawan || '-'}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-icon" onclick="openEditModal(${row._rowIndex})" title="Edit">✏️</button>
        <button class="btn btn-danger btn-icon" onclick="openDeleteModal(${row._rowIndex})" title="Hapus">🗑️</button>
      </td>
    </tr>
  `).join('');

    // Render mobile cards
    cardsContainer.innerHTML = filteredData.map(row => `
    <div class="data-card-item">
      <div class="data-card-header">
        <div>
          <div class="data-card-title">${row.post_Akun || 'Unknown'}</div>
          <span class="badge">${row.post_Type || '-'}</span>
        </div>
        <div class="data-card-meta">${formatDate(row.post_Date)}</div>
      </div>
      <div class="data-card-body">
        <div class="data-card-field">
          <strong>Likes:</strong> ${row.post_Likes || 0}
        </div>
        <div class="data-card-field">
          <strong>By:</strong> ${row.ID_Karyawan || '-'}
        </div>
      </div>
      <div class="data-card-field mt-sm">
        <a href="${row.post_URL}" target="_blank" rel="noopener" class="truncate" style="display:block">${shortenUrl(row.post_URL)}</a>
      </div>
      <div class="data-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="openEditModal(${row._rowIndex})" style="flex:1">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${row._rowIndex})" style="flex:1">🗑️ Hapus</button>
      </div>
    </div>
  `).join('');
}

function updateStats(stats) {
    if (!stats) return;

    document.getElementById('stat-total').textContent = formatNumber(stats.totalPosts);
    document.getElementById('stat-likes').textContent = formatNumber(stats.totalLikes);
    document.getElementById('stat-accounts').textContent = formatNumber(stats.uniqueAccounts);

    // Count today's posts
    const today = new Date().toDateString();
    const todayCount = allData.filter(row => {
        const postDate = new Date(row.post_Date);
        return postDate.toDateString() === today;
    }).length;
    document.getElementById('stat-today').textContent = formatNumber(todayCount);
}

function populateAccountFilter() {
    const select = document.getElementById('filter-akun');
    const accounts = [...new Set(allData.map(row => row.post_Akun).filter(Boolean))];

    select.innerHTML = '<option value="">Semua Akun</option>' +
        accounts.map(acc => `<option value="${acc}">${acc}</option>`).join('');
}

// ===================================
// Navigation & Pages
// ===================================

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`page-${pageName}`).classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    // Set default date for form
    if (pageName === 'form') {
        document.getElementById('inp-date').valueAsDate = new Date();
    }
}

// ===================================
// Modal Functions
// ===================================

function openEditModal(rowIndex) {
    currentEditRow = allData.find(row => row._rowIndex === rowIndex);
    if (!currentEditRow) return;

    document.getElementById('edit-row-index').value = rowIndex;
    document.getElementById('edit-karyawan').value = currentEditRow.ID_Karyawan || '';
    document.getElementById('edit-type').value = currentEditRow.post_Type || 'IGPOST';
    document.getElementById('edit-akun').value = currentEditRow.post_Akun || '';
    document.getElementById('edit-url').value = currentEditRow.post_URL || '';
    document.getElementById('edit-sumber').value = currentEditRow.post_Sumber || '';
    document.getElementById('edit-likes').value = currentEditRow.post_Likes || '';
    document.getElementById('edit-comments').value = currentEditRow.post_Comments || '';

    // Set date
    if (currentEditRow.post_Date) {
        const date = new Date(currentEditRow.post_Date);
        if (!isNaN(date)) {
            document.getElementById('edit-date').valueAsDate = date;
        }
    }

    document.getElementById('edit-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('edit-modal').classList.remove('active');
    currentEditRow = null;
}

function saveEdit() {
    const data = {
        _rowIndex: document.getElementById('edit-row-index').value,
        ID_Karyawan: document.getElementById('edit-karyawan').value,
        post_Date: document.getElementById('edit-date').value,
        post_Type: document.getElementById('edit-type').value,
        post_Akun: document.getElementById('edit-akun').value,
        post_URL: document.getElementById('edit-url').value,
        post_Sumber: document.getElementById('edit-sumber').value,
        post_Likes: document.getElementById('edit-likes').value,
        post_Comments: document.getElementById('edit-comments').value
    };

    updatePost(data);
}

function openDeleteModal(rowIndex) {
    document.getElementById('delete-row-index').value = rowIndex;
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
}

function confirmDelete() {
    const rowIndex = parseInt(document.getElementById('delete-row-index').value);
    deletePost(rowIndex);
}

// ===================================
// Toast Notifications
// ===================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ===================================
// Helper Functions
// ===================================

function showLoading(show) {
    document.getElementById('loading-state').style.display = show ? 'flex' : 'none';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function shortenUrl(url) {
    if (!url) return '-';
    try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname.substring(0, 20) + '...';
    } catch {
        return url.substring(0, 30) + '...';
    }
}

function filterData() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const accountFilter = document.getElementById('filter-akun').value;

    filteredData = allData.filter(row => {
        const matchSearch = !searchTerm ||
            (row.post_Akun && row.post_Akun.toLowerCase().includes(searchTerm)) ||
            (row.post_URL && row.post_URL.toLowerCase().includes(searchTerm)) ||
            (row.ID_Karyawan && row.ID_Karyawan.toLowerCase().includes(searchTerm)) ||
            (row.post_Caption && row.post_Caption.toLowerCase().includes(searchTerm));

        const matchAccount = !accountFilter || row.post_Akun === accountFilter;

        return matchSearch && matchAccount;
    });

    renderData();
}

function showDemoMode() {
    showToast('Demo Mode: Hubungkan ke Google Apps Script untuk data live', 'warning');

    // Show demo data
    allData = [
        { _rowIndex: 1, post_Date: new Date(), post_Type: 'IGPOST', post_Akun: '@demo_account', post_URL: 'https://instagram.com/p/demo', post_Sumber: 'https://instagram.com/source', post_Likes: 150, ID_Karyawan: '@admin' },
        { _rowIndex: 2, post_Date: new Date(), post_Type: 'IGREELS', post_Akun: '@demo_account', post_URL: 'https://instagram.com/reel/demo', post_Sumber: '', post_Likes: 500, ID_Karyawan: '@admin' }
    ];
    filteredData = [...allData];

    updateStats({
        totalPosts: 2,
        totalLikes: 650,
        uniqueAccounts: 1,
        postTypes: { IGPOST: 1, IGREELS: 1 }
    });

    renderData();
    populateAccountFilter();
}

// ===================================
// Form Submission
// ===================================

function handleFormSubmit(e) {
    e.preventDefault();

    const data = {
        ID_Karyawan: document.getElementById('inp-karyawan').value,
        post_Date: document.getElementById('inp-date').value,
        post_Type: document.getElementById('inp-type').value,
        post_Akun: document.getElementById('inp-akun').value,
        post_URL: document.getElementById('inp-url').value,
        post_Sumber: document.getElementById('inp-sumber').value || '',
        post_Pengiklan: document.getElementById('inp-pengiklan').value || '',
        post_Likes: document.getElementById('inp-likes').value || '',
        post_Comments: document.getElementById('inp-comments').value || '',
        inp_location: document.getElementById('inp-location').value || '',
        post_Caption: document.getElementById('inp-caption').value || '',
        post_Image_v1: document.getElementById('inp-image1').value || '',
        post_Image_v2: document.getElementById('inp-image2').value || ''
    };

    // Check if API is configured
    if (CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        showToast('Konfigurasikan API_URL di config.js terlebih dahulu', 'error');
        return;
    }

    createPost(data);
}

// ===================================
// Counter Input Functions
// ===================================

function adjustCounter(inputId, delta) {
    const input = document.getElementById(inputId);
    let value = parseInt(input.value) || 0;
    value = Math.max(0, value + delta);
    input.value = value;
}

// Form preview update
function updateFormPreview() {
    const akun = document.getElementById('inp-akun').value || '@username';
    const type = document.getElementById('inp-type').value || 'Post';

    document.getElementById('preview-account').textContent = akun;
    document.getElementById('preview-type').textContent = type.replace('IG', '');
}

// ===================================
// Geolocation Functions
// ===================================

function getLocation() {
    const btn = document.getElementById('btn-location');
    const input = document.getElementById('inp-location');

    if (!navigator.geolocation) {
        showToast('Browser tidak mendukung lokasi', 'error');
        return;
    }

    btn.textContent = '⏳';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            // Format: Lat, Long
            input.value = `${lat.toFixed(6)}, ${long.toFixed(6)}`;

            btn.textContent = '📍';
            btn.disabled = false;
            showToast('Lokasi berhasil diambil!', 'success');
        },
        (error) => {
            console.error('Location error:', error);
            let msg = 'Gagal ambil lokasi';
            if (error.code === 1) msg = 'Izin lokasi ditolak';
            if (error.code === 2) msg = 'Lokasi tidak tersedia';
            if (error.code === 3) msg = 'Koneksi timeout';

            showToast(msg, 'error');
            btn.textContent = '📍';
            btn.disabled = false;
        }
    );
}

// ===================================
// Event Listeners
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            showPage(item.dataset.page);
        });
    });

    // Form submission
    document.getElementById('post-form').addEventListener('submit', handleFormSubmit);

    // Search and filter
    document.getElementById('search-input').addEventListener('input', filterData);
    document.getElementById('filter-akun').addEventListener('change', filterData);

    // Form preview updates
    document.getElementById('inp-akun').addEventListener('input', updateFormPreview);
    document.getElementById('inp-type').addEventListener('change', updateFormPreview);

    // Geolocation
    const btnLocation = document.getElementById('btn-location');
    if (btnLocation) {
        btnLocation.addEventListener('click', getLocation);
    }

    // Refresh button
    document.getElementById('btn-refresh').addEventListener('click', fetchData);

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Initial load
    fetchData();
});
