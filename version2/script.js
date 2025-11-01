/* ===== Tab Navigation ===== */
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    contents.forEach(c => c.classList.add('hidden'));
    document.getElementById(target+'-tab').classList.remove('hidden');
    tabs.forEach(t => t.classList.remove('bg-blue-500','text-white'));
    tab.classList.add('bg-blue-500','text-white');
  });
});

// Mobile Menu Toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileNav = document.getElementById('mobile-nav');
const mobileNavContent = mobileNav.querySelector('div');
const mobileMenuIcon = mobileMenuButton.querySelector('svg');

mobileMenuButton.addEventListener('click', () => {
  const isOpen = !mobileNav.classList.contains('max-h-0');

  if (!isOpen) {
    // Open bottom sheet
    mobileNav.classList.remove('max-h-0');
    mobileNavContent.classList.remove('translate-y-full', 'opacity-0');
    mobileNavContent.classList.add('translate-y-0', 'opacity-100');

    // Change icon to "close"
    mobileMenuIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
    `;
  } else {
    // Close bottom sheet
    mobileNavContent.classList.remove('translate-y-0', 'opacity-100');
    mobileNavContent.classList.add('translate-y-full', 'opacity-0');
    mobileNav.classList.add('max-h-0');

    // Change icon back to hamburger
    mobileMenuIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
    `;
  }
});

// Close menu when a link is clicked
document.querySelectorAll('[data-mobile-link]').forEach(link => {
  link.addEventListener('click', () => {
    mobileNavContent.classList.remove('translate-y-0', 'opacity-100');
    mobileNavContent.classList.add('translate-y-full', 'opacity-0');
    mobileNav.classList.add('max-h-0');

    // Reset icon to hamburger
    mobileMenuIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
    `;
  });
});



/* ===== LocalStorage ===== */
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let incomes = JSON.parse(localStorage.getItem('incomes')) || [];
const USD_TO_KHR = 4000;

/* ===== Helper Functions ===== */
function saveExpenses(){ localStorage.setItem('expenses', JSON.stringify(expenses)); }
function saveIncomes(){ localStorage.setItem('incomes', JSON.stringify(incomes)); }
function formatCurrency(num, currency='USD'){
  if(currency==='USD') return '$'+num.toFixed(2);
  return num.toLocaleString()+' KHR';
}

/* ===== Home Tab ===== */
const summaryDiv = document.getElementById('summary-cards');
const expenseChartCtx = document.getElementById('expense-chart').getContext('2d');
let expenseChart;

function updateHome(){
  const totalExpense = expenses.reduce((a,b)=>a+b.amount,0);
  const totalIncome = incomes.reduce((a,b)=>a+b.amount,0);
  const balance = totalIncome + totalExpense;

  summaryDiv.innerHTML = `
    <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 class="text-gray-500 text-sm">Total Expenses</h3>
      <p class="text-2xl md:text-3xl font-semibold text-red-500">${formatCurrency(Math.abs(totalExpense))}</p>
    </div>
    <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 class="text-gray-500 text-sm">Current Balance</h3>
      <p class="text-2xl md:text-3xl font-semibold text-blue-500">${formatCurrency(balance)}</p>
    </div>
  `;

  const categories = [...new Set(expenses.map(e=>e.category))];
  const totals = categories.map(cat=>expenses.filter(e=>e.category===cat).reduce((a,b)=>a+b.amount,0));
  if(expenseChart) expenseChart.destroy();
  expenseChart = new Chart(expenseChartCtx,{
    type:'doughnut',
    data:{labels:categories,datasets:[{data:totals.map(Math.abs),backgroundColor:['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right'},title:{display:true,text:'Expenses by Category'}}}
  });
}

/* ===== Expense Tab ===== */
const expenseForm = document.getElementById('expense-form');
const expenseBody = document.getElementById('expense-body');

function renderExpenses(){
  expenseBody.innerHTML='';
  expenses.forEach(e=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="px-2 py-1">${e.date}</td>
                  <td class="px-2 py-1">${e.category}</td>
                  <td class="px-2 py-1">${e.description}</td>
                  <td class="px-2 py-1 text-red-500">${formatCurrency(Math.abs(e.amount))}</td>
                  <td class="px-2 py-1 space-x-1">
                    <button data-id="${e.id}" class="edit-expense px-2 py-1 bg-yellow-400 text-white rounded">Edit</button>
                    <button data-id="${e.id}" class="delete-expense px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>`;
    expenseBody.appendChild(tr);
  });
  attachExpenseActions();
  updateHome();
}

expenseForm.addEventListener('submit', e=>{
  e.preventDefault();
  const date=document.getElementById('expense-date').value;
  const category=document.getElementById('expense-category').value;
  const desc=document.getElementById('expense-desc').value;
  const amount=parseFloat(document.getElementById('expense-amount').value)||0;
  if(!date||!category||!desc||!amount) return;
  expenses.push({id:Date.now(),date,category,description:desc,amount:-Math.abs(amount)});
  saveExpenses();
  renderExpenses();
  expenseForm.reset();
});

function attachExpenseActions(){
  document.querySelectorAll('.delete-expense').forEach(btn=>{
    btn.addEventListener('click',()=>{ 
      const id=parseInt(btn.dataset.id); 
      expenses=expenses.filter(e=>e.id!==id); saveExpenses(); renderExpenses();
    });
  });
  document.querySelectorAll('.edit-expense').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=parseInt(btn.dataset.id);
      const e=expenses.find(x=>x.id===id);
      if(!e) return;
      document.getElementById('expense-date').value=e.date;
      document.getElementById('expense-category').value=e.category;
      document.getElementById('expense-desc').value=e.description;
      document.getElementById('expense-amount').value=Math.abs(e.amount);
      expenses=expenses.filter(x=>x.id!==id);
      saveExpenses();
      renderExpenses();
    });
  });
}

/* ===== Income Tab with Currency Conversion ===== */
const incomeForm=document.getElementById('income-form');
const incomeBody=document.getElementById('income-body');
const incomeSummary=document.getElementById('income-summary');

function renderIncome(){
  incomeBody.innerHTML='';
  let totalUSD=0;
  incomes.forEach(i=>{
    const totalKHR = i.currency==='USD' ? i.amount*USD_TO_KHR : i.amount;
    const totalInUSD = i.currency==='KHR' ? i.amount/USD_TO_KHR : i.amount;
    totalUSD += totalInUSD;

    const tr=document.createElement('tr');
    tr.innerHTML=`<td class="px-2 py-1">${i.date}</td>
                  <td class="px-2 py-1">${formatCurrency(i.amount,i.currency)}</td>
                  <td class="px-2 py-1">${formatCurrency(totalKHR,'KHR')}</td>
                  <td class="px-2 py-1">${formatCurrency(totalInUSD,'USD')}</td>
                  <td class="px-2 py-1">${i.source}</td>
                  <td class="px-2 py-1">${i.note}</td>
                  <td class="px-2 py-1 space-x-1">
                    <button data-id="${i.id}" class="edit-income px-2 py-1 bg-yellow-400 text-white rounded">Edit</button>
                    <button data-id="${i.id}" class="delete-income px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>`;
    incomeBody.appendChild(tr);
  });

  // Income summary
  incomeSummary.innerHTML=`<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <h3 class="text-gray-500 text-sm">Total Income (USD)</h3>
    <p class="text-2xl md:text-3xl font-semibold text-green-500">${formatCurrency(totalUSD,'USD')}</p>
  </div>`;

  attachIncomeActions();
}

incomeForm.addEventListener('submit',e=>{
  e.preventDefault();
  const date=document.getElementById('income-date').value;
  const amount=parseFloat(document.getElementById('income-amount').value)||0;
  const currency=document.getElementById('income-currency').value;
  const source=document.getElementById('income-source').value;
  const note=document.getElementById('income-note').value;
  if(!date||!amount||!source) return;

  incomes.push({id:Date.now(),date,amount,currency,source,note});
  saveIncomes();
  renderIncome();
  incomeForm.reset();
});

function attachIncomeActions(){
  document.querySelectorAll('.delete-income').forEach(btn=>{
    btn.addEventListener('click',()=>{ 
      const id=parseInt(btn.dataset.id); 
      incomes=incomes.filter(i=>i.id!==id); saveIncomes(); renderIncome();
    });
  });
  document.querySelectorAll('.edit-income').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id=parseInt(btn.dataset.id);
      const i = incomes.find(x=>x.id===id);
      if(!i) return;
      document.getElementById('income-date').value = i.date;
      document.getElementById('income-amount').value = i.amount;
      document.getElementById('income-currency').value = i.currency;
      document.getElementById('income-source').value = i.source;
      document.getElementById('income-note').value = i.note;
      incomes=incomes.filter(x=>x.id!==id);
      saveIncomes();
      renderIncome();
    });
  });
}

/* ===== Initial Render ===== */
renderExpenses();
renderIncome();
updateHome();