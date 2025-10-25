// ===============================
// 📦 Utility Functions
// ===============================

// Generate unique ID
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Load transactions from localStorage
function loadTransactions() {
  const data = localStorage.getItem('transactions');
  return data ? JSON.parse(data) : [];
}

// Save transactions to localStorage
function saveTransactions(transactions) {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}


// Updated formatter
function formatCurrency(amount, currency = 'USD') {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
}

// === 📅 Monthly Export Prompt ===
function checkMonthlyExportPrompt() {
  const today = new Date();
  // const firstDay = today.getDate() === 1;
  const firstDay = true; // For testing purposes, always true
  const lastPromptMonth = localStorage.getItem('lastExportPrompt');
  const currentMonth = `${today.getFullYear()}-${today.getMonth()+1}`;

  if (firstDay && lastPromptMonth !== currentMonth) {
    document.getElementById('monthlyExportModal').classList.remove('hidden');
    localStorage.setItem('lastExportPrompt', currentMonth);
  }
}

// Call on page load
checkMonthlyExportPrompt();

// Handle modal buttons
document.getElementById('exportLastMonthBtn').addEventListener('click', () => {
  exportTransactionsOfPreviousMonth(); // function for filtering & exporting
  document.getElementById('monthlyExportModal').classList.add('hidden');
});

document.getElementById('cancelLastMonthBtn').addEventListener('click', () => {
  document.getElementById('monthlyExportModal').classList.add('hidden');
});

// Function to export only last month's transactions
function exportTransactionsOfPreviousMonth() {
  const today = new Date();
  const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthNum = prevMonth.getMonth();
  const prevYear = prevMonth.getFullYear();

  const lastMonthTx = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === prevMonthNum && txDate.getFullYear() === prevYear;
  });

  if (lastMonthTx.length === 0) return alert('No transactions for last month.');

  // Excel export logic (Blob + a download)
  const ws = XLSX.utils.json_to_sheet(lastMonthTx);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Previous Month Transactions');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${prevYear}-${prevMonthNum + 1}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}



// ===============================
// 🧮 Core Variables
// ===============================

let transactions = loadTransactions();

const transactionList = document.getElementById('transactionList');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const totalBalance = document.getElementById('totalBalance');

const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('addTransaction');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('transactionForm');
const themeBtn = document.getElementById('themeBtn');


// ===============================
// 🌙 Theme Controls
// ===============================

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark', savedTheme === 'dark');
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.body.classList.contains('dark');
  themeBtn.textContent = isDark ? '☀️' : '🌙';
}

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  updateThemeIcon();
});

// Initialize theme on page load
applySavedTheme();


// ===============================
// 🪟 Modal Controls
// ===============================

openModalBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  form.reset();
});

// ===============================
// ➕ Add Transaction
// ===============================

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const currency = document.getElementById('currency').value.trim();
  const category = document.getElementById('category').value.trim();
  const note = document.getElementById('note').value.trim() ? document.getElementById('note').value.trim() : 'N/A';
  const date = document.getElementById('date').value;
  const paymentMethod = document.getElementById('paymentMethod').value.trim();
  const tagsInput = document.getElementById('tags').value.trim();
  const receiptUrl = document.getElementById('receiptUrl').value.trim();

  // Validation
  if (!amount || !category || !date || !currency) {
    alert('⚠️ Please fill all required fields.');
    return;
  }

  const newTx = {
    id: generateId(),
    type,
    amount,
    currency,
    category,
    note,
    date,
    paymentMethod,
    tagsInput,
    receiptUrl,
    createdAt: new Date().toISOString()
  };

  // Add to the **top** of transactions array
  transactions.unshift(newTx);
  saveTransactions(transactions);
  renderTransactions();
  updateSummary();

  form.reset();
  modal.classList.add('hidden');
});



// ===============================
// 🗑️ Delete Transaction
// ===============================

function deleteTransaction(id) {
  if (!confirm('🗑️ Delete this transaction?')) return;
  transactions = transactions.filter(tx => tx.id !== id);
  saveTransactions(transactions);
  renderTransactions();
  updateSummary();
}


// ===============================
// 🖼️ Render Transactions
// ===============================

function renderTransactions() {
  transactionList.innerHTML = '';

  if (transactions.length === 0) {
    transactionList.innerHTML = '<li class="empty-msg">No transactions yet.</li>';
    return;
  }

  transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(tx => {
      const li = document.createElement('li');
      li.classList.add('tx-card', tx.type);

      const emoji = tx.type === 'income' ? '💵' : '💸';
      const sign = tx.type === 'income' ? '+' : '-';
      const currencySymbol = tx.currency === 'USD' ? '$' : (tx.currency === 'KHR' ? '៛' : '');

      const categoryEmojiMap = {
        "Housing": "🏠",
        "Transportation": "🚗",
        "Food": "🍔",
        "Health & Medical": "💊",
        "Savings & Investments": "💰",
        "Personal": "🧑",
        "Entertainment & Leisure": "🎬",
        "Miscellaneous": "📦",
        "Other": "❓"
      };

      
      const categoryEmoji = categoryEmojiMap[tx.category] || "❓";

      li.innerHTML = `
        <div class="tx-left">
          <div class="tx-icon">${emoji}</div>
          <div class="tx-details">
            <span class="tx-category">${categoryEmoji} ${tx.category}</span>
            ${tx.note ? `<span class="tx-note"> ${tx.note}</span>` : ''}
            <small class="tx-date">${tx.date}</small>
            <small class="tx-meta">
              ${tx.paymentMethod ? `💳 ${tx.paymentMethod}` : ''}
              ${tx.tags?.length ? `🏷️ ${tx.tags.join(', ')}` : ''}
            </small>
            ${tx.receiptUrl ? `<a href="${tx.receiptUrl}" target="_blank" class="tx-receipt">🧾 View Receipt</a>` : ''}
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${tx.type}">${sign}${currencySymbol}${tx.amount}</span>
          <button class="delete-btn" title="Delete" data-id="${tx.id}">🗑️</button>
        </div>
      `;


      transactionList.appendChild(li);
    });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      deleteTransaction(id);
    });
  });
}


// ===============================
// 💰 Update Summary
// ===============================

function maskIncome(value) {
  const str = value.toString();
  if (str.length <= 2) return '*'.repeat(str.length);
  return str.slice(0, 2) + '*'.repeat(str.length - 2);
}


function updateSummary() {
  const USD_RATE = 4000; 

  function toUSD(tx) {
    if (tx.currency === 'KHR') return tx.amount / USD_RATE;
    return tx.amount;
  }

  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + toUSD(tx), 0);

  const expense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + toUSD(tx), 0);

  const balance = income - expense;

  totalIncome.textContent = formatCurrency(income, 'USD');
  totalExpense.textContent = formatCurrency(expense, 'USD');
  totalBalance.textContent = formatCurrency(balance, 'USD');
}


// ===============================
// 💾 Export / Import (Excel)
// ===============================

const exportBtn = document.createElement('button');
exportBtn.textContent = '⬇️ Export Excel';
exportBtn.className = 'btn-secondary';
document.querySelector('.footer').appendChild(exportBtn);

exportBtn.addEventListener('click', () => {
  if (transactions.length === 0) return alert('No data to export');

  const ws = XLSX.utils.json_to_sheet(transactions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expense-data.xlsx';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
});


const importFile = document.createElement('input');
importFile.type = 'file';
importFile.accept = '.xlsx, .xls';
importFile.style.display = 'none';
document.body.appendChild(importFile);

importFile.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const imported = XLSX.utils.sheet_to_json(sheet);

    if (Array.isArray(imported)) {
      if (confirm('Replace existing data with imported Excel data?')) {
        transactions = imported;
        saveTransactions(transactions);
        renderTransactions();
        updateSummary();
        alert('✅ Data imported successfully!');
      }
    } else {
      alert('❌ Invalid Excel format.');
    }
  };
  reader.readAsArrayBuffer(file);
});

const clearBtn = document.getElementById('clearBtn');

clearBtn.addEventListener('click', () => {
  if (transactions.length === 0) {
    alert('No transactions to clear.');
    return;
  }

  // Step 1: Ask if user wants to export first
  const exportFirst = confirm('Do you want to export transactions before clearing?');
  if (exportFirst) {
    if (transactions.length > 0) {
      // Trigger export programmatically
      exportBtn.click();
      alert('Please check your downloaded file before clearing.');
    }
  }

  // Step 2: Ask for final confirmation
  const confirmClear = confirm('Are you sure you want to clear all transactions? This cannot be undone.');
  if (!confirmClear) return;

  // Step 3: Clear data
  transactions = [];
  saveTransactions(transactions);
  renderTransactions();
  updateSummary();

  alert('All transactions cleared.');
});


const importBtn = document.createElement('button');
importBtn.textContent = '⬆️ Import Excel';
importBtn.className = 'btn-secondary';
document.querySelector('.footer').appendChild(importBtn);
importBtn.addEventListener('click', () => importFile.click());


// ===============================
// 🚀 Initialize App
// ===============================

function init() {
  renderTransactions();
  updateSummary();
}

init();
