// === 📦 Utility Functions ===

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

// Format currency
function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}


// === 🧮 Core App Logic ===

let transactions = loadTransactions();

const transactionList = document.getElementById('transactionList');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const totalBalance = document.getElementById('totalBalance');

const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('addTransaction');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('transactionForm');

const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');


// === 🧭 Modal Controls ===
openModalBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  form.reset();
});


// === ➕ Add Transaction ===
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value.trim();
  const note = document.getElementById('note').value.trim();
  const date = document.getElementById('date').value;

  if (!amount || !category || !date) return alert('Please fill required fields.');

  const newTx = {
    id: generateId(),
    type,
    amount,
    category,
    note,
    date
  };

  transactions.push(newTx);
  saveTransactions(transactions);
  renderTransactions();
  updateSummary();

  form.reset();
  modal.classList.add('hidden');
});


// === 🗑️ Delete Transaction ===
function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(tx => tx.id !== id);
  saveTransactions(transactions);
  renderTransactions();
  updateSummary();
}


// === 🖼️ Render Transactions ===
function renderTransactions() {
  transactionList.innerHTML = '';

  if (transactions.length === 0) {
    transactionList.innerHTML = '<li>No transactions yet.</li>';
    return;
  }

  transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // show newest first
    .forEach(tx => {
      const li = document.createElement('li');
      li.classList.add(tx.type);

      li.innerHTML = `
        <div class="tx-info">
          <span>${tx.category} ${tx.note ? `- ${tx.note}` : ''}</span>
          <small>${tx.date}</small>
        </div>
        <div>
          <span class="tx-amount">${formatCurrency(tx.amount)}</span>
          <button class="delete-btn" data-id="${tx.id}">🗑️</button>
        </div>
      `;

      transactionList.appendChild(li);
    });

  // Attach delete listeners
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.getAttribute('data-id');
      deleteTransaction(id);
    });
  });
}


// === 💰 Update Summary ===
function updateSummary() {
  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = income - expense;

  totalIncome.textContent = formatCurrency(income);
  totalExpense.textContent = formatCurrency(expense);
  totalBalance.textContent = formatCurrency(balance);
}


// === 💾 Export / Import ===

// Export all data to JSON file
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expense-data.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Import data from JSON file
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const importedData = JSON.parse(event.target.result);
      if (Array.isArray(importedData)) {
        if (confirm('Replace existing data with imported data?')) {
          transactions = importedData;
          saveTransactions(transactions);
          renderTransactions();
          updateSummary();
          alert('Data imported successfully!');
        }
      } else {
        alert('Invalid file format.');
      }
    } catch (err) {
      alert('Error reading file.');
    }
  };
  reader.readAsText(file);
});


// === 🚀 Initialize App ===
function init() {
  renderTransactions();
  updateSummary();
}

init();
