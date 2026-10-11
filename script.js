/**
 * Time Management for Productivity
 * script.js — logika utama aplikasi
 *
 * Struktur data localStorage key: "tmp_tasks"
 * Format task: {
 *   id: string,
 *   name: string,
 *   deadlineTarget: string (ISO),
 *   deadlineGrace: string (ISO),
 *   deadlineHard: string (ISO),
 *   createdAt: string (ISO),
 *   milestones: Milestone[]
 * }
 * Format milestone: {
 *   id: string,
 *   name: string,
 *   records: Record[]
 * }
 * Format record: {
 *   id: string,
 *   startTime: string (ISO),
 *   endTime: string (ISO),
 *   status: 'on-target' | 'grace' | 'overdue'
 * }
 */

'use strict';

// ============================================================
// CONSTANTS & STATE
// ============================================================

const STORAGE_KEY = 'tmp_tasks';

/** State modal sementara */
let modalState = {
  taskId: null,
  milestoneId: null,
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Buat ID unik sederhana berbasis timestamp + random
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Format ISO string ke tampilan yang mudah dibaca
 * @param {string} iso
 * @returns {string}
 */
function formatDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

/**
 * Hitung durasi dari dua ISO string dan kembalikan string ringkas
 * @param {string} startISO
 * @param {string} endISO
 * @returns {string}
 */
function formatDuration(startISO, endISO) {
  const diff = (new Date(endISO) - new Date(startISO));
  if (isNaN(diff) || diff < 0) return '-';
  const totalSeconds = Math.floor(diff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}j ${m}m ${s}d`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
}

/**
 * Konversi nilai datetime-local input ke ISO string
 * @param {string} value - nilai dari input datetime-local
 * @returns {string}
 */
function localInputToISO(value) {
  if (!value) return '';
  return new Date(value).toISOString();
}

/**
 * Konversi ISO string ke format input datetime-local (YYYY-MM-DDTHH:MM)
 * @param {string} iso
 * @returns {string}
 */
function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  // Format: YYYY-MM-DDTHH:MM
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Tentukan status berdasarkan waktu selesai dan deadline task
 * @param {string} endTimeISO - waktu selesai record
 * @param {string} deadlineTarget - deadline ideal
 * @param {string} deadlineGrace - deadline keringanan
 * @param {string} deadlineHard - deadline maksimal
 * @returns {{ status: string, label: string, colorClass: string, bgClass: string, borderClass: string }}
 */
function determineStatus(endTimeISO, deadlineTarget, deadlineGrace, deadlineHard) {
  const end = new Date(endTimeISO);
  const target = deadlineTarget ? new Date(deadlineTarget) : null;
  const grace  = deadlineGrace  ? new Date(deadlineGrace)  : null;
  const hard   = deadlineHard   ? new Date(deadlineHard)   : null;

  if (target && end <= target) {
    return { status: 'on-target', label: '✓ On Target', colorClass: 'text-green-400', bgClass: 'bg-green-900/40', borderClass: 'border-green-700' };
  }
  if (grace && end <= grace) {
    return { status: 'grace', label: '⚡ Dalam Keringanan', colorClass: 'text-yellow-400', bgClass: 'bg-yellow-900/40', borderClass: 'border-yellow-700' };
  }
  if (hard && end > hard) {
    return { status: 'overdue', label: '✗ Melewati Harus Kumpul', colorClass: 'text-red-400', bgClass: 'bg-red-900/40', borderClass: 'border-red-700' };
  }
  // Setelah target tapi grace/hard tidak di-set, atau antara grace dan hard
  if (target && end > target) {
    return { status: 'grace', label: '⚡ Dalam Keringanan', colorClass: 'text-yellow-400', bgClass: 'bg-yellow-900/40', borderClass: 'border-yellow-700' };
  }
  return { status: 'on-target', label: '✓ On Target', colorClass: 'text-green-400', bgClass: 'bg-green-900/40', borderClass: 'border-green-700' };
}

// ============================================================
// LOCALSTORAGE HELPERS
// ============================================================

/**
 * Baca semua task dari localStorage
 * @returns {Array}
 */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Simpan array task ke localStorage
 * @param {Array} tasks
 */
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Hapus satu task berdasarkan ID
 * @param {string} id
 */
function deleteTask(id) {
  const tasks = loadTasks().filter(t => t.id !== id);
  saveTasks(tasks);
}

/**
 * Hapus satu milestone dari task tertentu
 * @param {string} taskId
 * @param {string} milestoneId
 */
function deleteMilestone(taskId, milestoneId) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.milestones = task.milestones.filter(m => m.id !== milestoneId);
  saveTasks(tasks);
}

/**
 * Hapus satu record dari milestone tertentu
 * @param {string} taskId
 * @param {string} milestoneId
 * @param {string} recordId
 */
function deleteRecord(taskId, milestoneId, recordId) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const milestone = task.milestones.find(m => m.id === milestoneId);
  if (!milestone) return;
  milestone.records = milestone.records.filter(r => r.id !== recordId);
  saveTasks(tasks);
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

/**
 * Render ulang seluruh daftar task ke DOM
 */
function renderAll() {
  const tasks = loadTasks();
  const container = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');

  container.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tasks.forEach(task => {
    container.appendChild(renderTaskCard(task));
  });
}

/**
 * Buat elemen card untuk satu task
 * @param {object} task
 * @returns {HTMLElement}
 */
function renderTaskCard(task) {
  const card = document.createElement('article');
  card.className = 'bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden';
  card.setAttribute('role', 'listitem');
  card.dataset.taskId = task.id;

  card.innerHTML = `
    <!-- Header task -->
    <div class="flex items-start justify-between gap-3 p-5 pb-4">
      <div class="min-w-0">
        <h3 class="text-base font-semibold text-white truncate" title="${escHtml(task.name)}">${escHtml(task.name)}</h3>
        <p class="text-xs text-gray-500 mt-0.5">Dibuat: ${formatDateTime(task.createdAt)}</p>
      </div>
      <button
        class="btn-delete-task flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
        data-task-id="${task.id}"
        aria-label="Hapus task ${escHtml(task.name)}">
        <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>

    <!-- Tiga kolom deadline -->
    <div class="px-5 pb-4">
      <p class="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Deadline</p>
      <div class="grid grid-cols-3 gap-2">
        ${renderDeadlineCard('Target', task.deadlineTarget, 'green')}
        ${renderDeadlineCard('Keringanan', task.deadlineGrace, 'yellow')}
        ${renderDeadlineCard('Harus Kumpul', task.deadlineHard, 'red')}
      </div>
    </div>

    <!-- Milestones section -->
    <div class="border-t border-gray-800 px-5 py-4">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">Milestone</p>
        <button
          class="btn-add-milestone text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
          data-task-id="${task.id}"
          aria-label="Tambah milestone untuk task ${escHtml(task.name)}">
          + Tambah
        </button>
      </div>
      <div class="milestone-list space-y-3">
        ${task.milestones.length === 0
          ? '<p class="text-xs text-gray-600 italic">Belum ada milestone.</p>'
          : task.milestones.map(m => renderMilestoneBlock(task, m)).join('')
        }
      </div>
    </div>
  `;

  return card;
}

/**
 * Buat HTML untuk satu deadline card
 * @param {string} label
 * @param {string} isoTime
 * @param {'green'|'yellow'|'red'} color
 * @returns {string}
 */
function renderDeadlineCard(label, isoTime, color) {
  const colorMap = {
    green:  { dot: 'bg-green-400',  border: 'border-green-900', text: 'text-green-400' },
    yellow: { dot: 'bg-yellow-400', border: 'border-yellow-900', text: 'text-yellow-400' },
    red:    { dot: 'bg-red-400',    border: 'border-red-900',   text: 'text-red-400' },
  };
  const c = colorMap[color];

  if (!isoTime) {
    return `
      <div class="bg-gray-800/60 border ${c.border} rounded-xl p-2.5 flex flex-col gap-1">
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-2 h-2 rounded-full ${c.dot} flex-shrink-0" aria-hidden="true"></span>
          <span class="text-xs font-medium text-gray-400">${label}</span>
        </div>
        <span class="text-xs text-gray-600 italic">Tidak diatur</span>
      </div>`;
  }

  const d = new Date(isoTime);
  const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

  return `
    <div class="bg-gray-800/60 border ${c.border} rounded-xl p-2.5 flex flex-col gap-1">
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-2 h-2 rounded-full ${c.dot} flex-shrink-0" aria-hidden="true"></span>
        <span class="text-xs font-medium ${c.text}">${label}</span>
      </div>
      <span class="text-xs text-gray-200 font-mono leading-tight">${timeStr}</span>
      <span class="text-xs text-gray-500 leading-tight">${dateStr}</span>
    </div>`;
}

/**
 * Buat HTML untuk satu milestone dan riwayat penyelesaiannya
 * @param {object} task
 * @param {object} milestone
 * @returns {string}
 */
function renderMilestoneBlock(task, milestone) {
  const recordsHtml = milestone.records.length === 0
    ? '<p class="text-xs text-gray-600 italic mt-1">Belum ada riwayat penyelesaian.</p>'
    : `<ul class="mt-2 space-y-2" aria-label="Riwayat penyelesaian ${escHtml(milestone.name)}">
        ${milestone.records.map(r => renderRecordItem(task, milestone, r)).join('')}
       </ul>`;

  return `
    <div class="bg-gray-800/50 border border-gray-700 rounded-xl p-3" data-milestone-id="${milestone.id}">
      <!-- Milestone header -->
      <div class="flex items-center justify-between gap-2 mb-1">
        <span class="text-sm font-medium text-gray-200 truncate">${escHtml(milestone.name)}</span>
        <div class="flex items-center gap-1 flex-shrink-0">
          <!-- Tombol catat penyelesaian -->
          <button
            class="btn-record-milestone text-xs bg-brand-700/60 hover:bg-brand-600 text-brand-200 font-medium px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
            data-task-id="${task.id}"
            data-milestone-id="${milestone.id}"
            aria-label="Catat penyelesaian milestone ${escHtml(milestone.name)}">
            Catat
          </button>
          <!-- Tombol hapus milestone -->
          <button
            class="btn-delete-milestone text-gray-600 hover:text-red-400 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            data-task-id="${task.id}"
            data-milestone-id="${milestone.id}"
            aria-label="Hapus milestone ${escHtml(milestone.name)}">
            <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <!-- Riwayat -->
      ${recordsHtml}
    </div>`;
}

/**
 * Buat HTML untuk satu record penyelesaian milestone
 * @param {object} task
 * @param {object} milestone
 * @param {object} record
 * @returns {string}
 */
function renderRecordItem(task, milestone, record) {
  const st = determineStatus(record.endTime, task.deadlineTarget, task.deadlineGrace, task.deadlineHard);
  const duration = formatDuration(record.startTime, record.endTime);

  return `
    <li class="border ${st.borderClass} ${st.bgClass} rounded-lg px-3 py-2">
      <!-- Status badge -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="text-xs font-semibold ${st.colorClass}">${st.label}</span>
        <span class="text-xs text-gray-500">Durasi: <strong class="text-gray-300">${duration}</strong></span>
        <!-- Tombol hapus record -->
        <button
          class="btn-delete-record ml-auto text-gray-600 hover:text-red-400 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 rounded"
          data-task-id="${task.id}"
          data-milestone-id="${milestone.id}"
          data-record-id="${record.id}"
          aria-label="Hapus riwayat penyelesaian ini">
          <svg class="w-3 h-3 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <!-- Waktu mulai & selesai -->
      <div class="mt-1 grid grid-cols-2 gap-1">
        <div>
          <span class="text-xs text-gray-500">Mulai</span>
          <p class="text-xs text-gray-300 font-mono">${formatDateTime(record.startTime)}</p>
        </div>
        <div>
          <span class="text-xs text-gray-500">Selesai</span>
          <p class="text-xs text-gray-300 font-mono">${formatDateTime(record.endTime)}</p>
        </div>
      </div>
    </li>`;
}

// ============================================================
// ESCAPE HTML (mencegah XSS)
// ============================================================

/**
 * Escape karakter HTML berbahaya
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// FORM VALIDATION HELPER
// ============================================================

/**
 * Tampilkan pesan error inline pada sebuah input
 * @param {HTMLElement} inputEl
 * @param {string} message
 */
function showInputError(inputEl, message) {
  clearInputError(inputEl);
  inputEl.classList.add('border-red-500', 'focus:ring-red-500');
  const err = document.createElement('p');
  err.className = 'field-error text-xs text-red-400 mt-1';
  err.textContent = message;
  err.setAttribute('role', 'alert');
  inputEl.parentNode.appendChild(err);
}

/**
 * Hapus pesan error dari sebuah input
 * @param {HTMLElement} inputEl
 */
function clearInputError(inputEl) {
  inputEl.classList.remove('border-red-500', 'focus:ring-red-500');
  const existing = inputEl.parentNode.querySelector('.field-error');
  if (existing) existing.remove();
}

// ============================================================
// MODAL HELPERS
// ============================================================

/** Buka modal tambah milestone */
function openMilestoneModal(taskId) {
  modalState.taskId = taskId;
  modalState.milestoneId = null;
  document.getElementById('milestone-name').value = '';
  clearInputError(document.getElementById('milestone-name'));
  document.getElementById('modal-milestone').classList.remove('hidden');
  document.getElementById('milestone-name').focus();
}

/** Tutup modal tambah milestone */
function closeMilestoneModal() {
  document.getElementById('modal-milestone').classList.add('hidden');
  modalState.taskId = null;
}

/** Buka modal catat penyelesaian */
function openCompleteModal(taskId, milestoneId) {
  modalState.taskId = taskId;
  modalState.milestoneId = milestoneId;

  // Ambil nama milestone dari data (bukan dari DOM attribute) untuk menghindari escaped entities
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === taskId);
  const milestone = task ? task.milestones.find(m => m.id === milestoneId) : null;
  const milestoneName = milestone ? milestone.name : '';

  // Set default waktu ke sekarang untuk end, 1 jam lalu untuk start
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  document.getElementById('complete-start').value = isoToLocalInput(oneHourAgo.toISOString());
  document.getElementById('complete-end').value = isoToLocalInput(now.toISOString());
  document.getElementById('modal-complete-subtitle').textContent = `Milestone: ${milestoneName}`;

  clearInputError(document.getElementById('complete-start'));
  clearInputError(document.getElementById('complete-end'));

  document.getElementById('modal-complete').classList.remove('hidden');
  document.getElementById('complete-start').focus();
}

/** Tutup modal catat penyelesaian */
function closeCompleteModal() {
  document.getElementById('modal-complete').classList.add('hidden');
  modalState.taskId = null;
  modalState.milestoneId = null;
}

// ============================================================
// EVENT HANDLERS — TASK
// ============================================================

/** Tambah task baru dari form */
function handleAddTask() {
  const nameEl    = document.getElementById('task-name');
  const targetEl  = document.getElementById('deadline-target');
  const graceEl   = document.getElementById('deadline-grace');
  const hardEl    = document.getElementById('deadline-hard');

  let valid = true;

  // Validasi nama task wajib diisi
  if (!nameEl.value.trim()) {
    showInputError(nameEl, 'Nama task tidak boleh kosong.');
    valid = false;
  } else {
    clearInputError(nameEl);
  }

  // Validasi minimal satu deadline diisi
  if (!targetEl.value && !graceEl.value && !hardEl.value) {
    showInputError(targetEl, 'Isi setidaknya satu deadline.');
    valid = false;
  } else {
    clearInputError(targetEl);
  }

  // Validasi urutan deadline jika semua diisi
  if (targetEl.value && graceEl.value && hardEl.value) {
    const t = new Date(targetEl.value);
    const g = new Date(graceEl.value);
    const h = new Date(hardEl.value);
    if (!(t <= g && g <= h)) {
      showInputError(graceEl, 'Urutan: Target ≤ Keringanan ≤ Harus Kumpul.');
      valid = false;
    } else {
      clearInputError(graceEl);
    }
  }

  if (!valid) return;

  const newTask = {
    id: generateId(),
    name: nameEl.value.trim(),
    deadlineTarget: targetEl.value ? localInputToISO(targetEl.value) : '',
    deadlineGrace:  graceEl.value  ? localInputToISO(graceEl.value)  : '',
    deadlineHard:   hardEl.value   ? localInputToISO(hardEl.value)   : '',
    createdAt: new Date().toISOString(),
    milestones: [],
  };

  const tasks = loadTasks();
  tasks.unshift(newTask); // task terbaru di atas
  saveTasks(tasks);

  // Reset form
  nameEl.value = '';
  targetEl.value = '';
  graceEl.value = '';
  hardEl.value = '';

  renderAll();
}

// ============================================================
// EVENT HANDLERS — MILESTONE
// ============================================================

/** Simpan milestone baru dari modal */
function handleSaveMilestone() {
  const nameEl = document.getElementById('milestone-name');
  if (!nameEl.value.trim()) {
    showInputError(nameEl, 'Nama milestone tidak boleh kosong.');
    return;
  }
  clearInputError(nameEl);

  const tasks = loadTasks();
  const task = tasks.find(t => t.id === modalState.taskId);
  if (!task) { closeMilestoneModal(); return; }

  task.milestones.push({
    id: generateId(),
    name: nameEl.value.trim(),
    records: [],
  });

  saveTasks(tasks);
  closeMilestoneModal();
  renderAll();
}

// ============================================================
// EVENT HANDLERS — RECORD PENYELESAIAN
// ============================================================

/** Simpan record penyelesaian dari modal */
function handleConfirmComplete() {
  const startEl = document.getElementById('complete-start');
  const endEl   = document.getElementById('complete-end');
  let valid = true;

  if (!startEl.value) {
    showInputError(startEl, 'Waktu mulai wajib diisi.');
    valid = false;
  } else {
    clearInputError(startEl);
  }

  if (!endEl.value) {
    showInputError(endEl, 'Waktu selesai wajib diisi.');
    valid = false;
  } else {
    clearInputError(endEl);
  }

  if (valid && new Date(endEl.value) <= new Date(startEl.value)) {
    showInputError(endEl, 'Waktu selesai harus setelah waktu mulai.');
    valid = false;
  }

  if (!valid) return;

  const tasks = loadTasks();
  const task = tasks.find(t => t.id === modalState.taskId);
  if (!task) { closeCompleteModal(); return; }
  const milestone = task.milestones.find(m => m.id === modalState.milestoneId);
  if (!milestone) { closeCompleteModal(); return; }

  milestone.records.push({
    id: generateId(),
    startTime: localInputToISO(startEl.value),
    endTime:   localInputToISO(endEl.value),
  });

  saveTasks(tasks);
  closeCompleteModal();
  renderAll();
}

// ============================================================
// EVENT DELEGATION — TASK LIST
// ============================================================

/**
 * Tangani semua klik di dalam daftar task menggunakan event delegation
 * agar tidak perlu pasang listener satu per satu setiap render
 */
document.getElementById('task-list').addEventListener('click', function (e) {
  const target = e.target;

  // Hapus task
  if (target.closest('.btn-delete-task')) {
    const taskId = target.closest('.btn-delete-task').dataset.taskId;
    if (confirm('Hapus task ini beserta semua milestone dan riwayatnya?')) {
      deleteTask(taskId);
      renderAll();
    }
    return;
  }

  // Tambah milestone
  if (target.closest('.btn-add-milestone')) {
    const taskId = target.closest('.btn-add-milestone').dataset.taskId;
    openMilestoneModal(taskId);
    return;
  }

  // Catat penyelesaian milestone
  if (target.closest('.btn-record-milestone')) {
    const btn = target.closest('.btn-record-milestone');
    openCompleteModal(btn.dataset.taskId, btn.dataset.milestoneId);
    return;
  }

  // Hapus milestone
  if (target.closest('.btn-delete-milestone')) {
    const btn = target.closest('.btn-delete-milestone');
    if (confirm('Hapus milestone ini beserta riwayatnya?')) {
      deleteMilestone(btn.dataset.taskId, btn.dataset.milestoneId);
      renderAll();
    }
    return;
  }

  // Hapus record
  if (target.closest('.btn-delete-record')) {
    const btn = target.closest('.btn-delete-record');
    if (confirm('Hapus riwayat penyelesaian ini?')) {
      deleteRecord(btn.dataset.taskId, btn.dataset.milestoneId, btn.dataset.recordId);
      renderAll();
    }
    return;
  }
});

// ============================================================
// MODAL EVENT LISTENERS
// ============================================================

// Modal Tambah Milestone
document.getElementById('btn-add-task').addEventListener('click', handleAddTask);
document.getElementById('btn-save-milestone').addEventListener('click', handleSaveMilestone);
document.getElementById('btn-cancel-milestone').addEventListener('click', closeMilestoneModal);
document.getElementById('modal-backdrop').addEventListener('click', closeMilestoneModal);

// Modal Catat Penyelesaian
document.getElementById('btn-confirm-complete').addEventListener('click', handleConfirmComplete);
document.getElementById('btn-cancel-complete').addEventListener('click', closeCompleteModal);
document.getElementById('modal-complete-backdrop').addEventListener('click', closeCompleteModal);

// Tutup modal dengan tombol Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeMilestoneModal();
    closeCompleteModal();
  }
});

// Enter di form task memicu tambah task
document.getElementById('task-name').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleAddTask();
});

// Enter di modal milestone menyimpan
document.getElementById('milestone-name').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleSaveMilestone();
});

// ============================================================
// LIVE CLOCK
// ============================================================

/**
 * Perbarui tampilan jam setiap detik
 */
function updateLiveClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  document.getElementById('live-clock').textContent = timeStr;
}

// Jalankan segera dan setiap detik
updateLiveClock();
setInterval(updateLiveClock, 1000);

// ============================================================
// INIT
// ============================================================

// Render task dari localStorage saat halaman pertama kali dibuka
renderAll();
