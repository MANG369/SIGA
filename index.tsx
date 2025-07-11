/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { html } from 'htm/preact';

// Type Definitions
type TransactionType = 'income' | 'expense';
type Currency = 'USD' | 'EUR' | 'VES';
type Transaction = {
  id: string;
  type: TransactionType;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
};

// Custom hook for localStorage persistence
function useLocalStorage(key: string, initialValue: Transaction[]): [Transaction[], (value: Transaction[]) => void] {
    const [storedValue, setStoredValue] = useState<Transaction[]>(() => {
        try {
            const item = window.localStorage.getItem(key);
            // Add initial demo data if storage is empty
            if (!item) {
                const demoData: Transaction[] = [
                    { id: crypto.randomUUID(), type: 'income', date: '2024-07-15', description: 'Servicios de consultoría', amount: 2500, currency: 'USD' },
                    { id: crypto.randomUUID(), type: 'expense', date: '2024-07-16', description: 'Suscripción a software', amount: 50, currency: 'USD' },
                    { id: crypto.randomUUID(), type: 'income', date: '2024-07-20', description: 'Venta de producto A', amount: 800, currency: 'EUR' },
                    { id: crypto.randomUUID(), type: 'expense', date: '2024-07-22', description: 'Alquiler de oficina', amount: 1200, currency: 'USD' },
                ];
                window.localStorage.setItem(key, JSON.stringify(demoData));
                return demoData;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: Transaction[]) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

// --- Components ---

function Sidebar({ currentView, setView }: { currentView: string, setView: (view: string) => void }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'income', label: 'Ingresos' },
        { id: 'expense', label: 'Egresos' },
    ];
    return html`
        <aside class="sidebar">
            <h1>SIGA</h1>
            <nav>
                <ul>
                    ${navItems.map(item => html`
                        <li>
                            <a href="#" class=${item.id === currentView ? 'active' : ''} onClick=${(e: Event) => { e.preventDefault(); setView(item.id); }}>
                                ${item.label}
                            </a>
                        </li>
                    `)}
                </ul>
            </nav>
        </aside>
    `;
}

function Dashboard({ transactions }: { transactions: Transaction[] }) {
    const { totalIncome, totalExpense, netBalance } = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        // Note: This is a simplified calculation that doesn't account for currency conversion.
        // A full implementation would require exchange rates.
        transactions.forEach(t => {
            if (t.type === 'income') totalIncome += t.amount;
            else totalExpense += t.amount;
        });
        return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
    }, [transactions]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    
    return html`
        <div>
            <h2>Dashboard</h2>
            <div class="dashboard-cards">
                <div class="card">
                    <h3>Total Ingresos (USD*)</h3>
                    <p class="amount positive">${formatCurrency(totalIncome)}</p>
                </div>
                <div class="card">
                    <h3>Total Egresos (USD*)</h3>
                    <p class="amount negative">${formatCurrency(totalExpense)}</p>
                </div>
                <div class="card">
                    <h3>Balance Neto (USD*)</h3>
                    <p class="amount ${netBalance >= 0 ? 'neutral' : 'negative'}">${formatCurrency(netBalance)}</p>
                </div>
            </div>
            <p style="color: var(--text-secondary); margin-top: 1rem; font-size: 0.9rem;">* Cifras mostradas en USD sin conversión de tasa de cambio para esta versión MVP.</p>
        </div>
    `;
}

function TransactionForm({ type, addTransaction }: { type: TransactionType, addTransaction: (t: Omit<Transaction, 'id'>) => void }) {
    const handleSubmit = (e: Event) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const newTransaction = {
            type,
            date: formData.get('date') as string,
            description: formData.get('description') as string,
            amount: parseFloat(formData.get('amount') as string),
            currency: formData.get('currency') as Currency,
        };
        if (newTransaction.date && newTransaction.description && !isNaN(newTransaction.amount)) {
            addTransaction(newTransaction);
            form.reset();
        } else {
            alert('Por favor, rellene todos los campos correctamente.');
        }
    };

    return html`
        <form class="transaction-form" onSubmit=${handleSubmit}>
            <div class="form-group full-width">
                <label for="description">Descripción</label>
                <input type="text" id="description" name="description" required />
            </div>
            <div class="form-group">
                <label for="amount">Monto</label>
                <input type="number" id="amount" name="amount" step="0.01" required />
            </div>
            <div class="form-group">
                <label for="currency">Moneda</label>
                <select id="currency" name="currency" required>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="VES">VES</option>
                </select>
            </div>
            <div class="form-group full-width">
                <label for="date">Fecha</label>
                <input type="date" id="date" name="date" required value=${new Date().toISOString().split('T')[0]} />
            </div>
            <button type="submit" class="btn-submit">Añadir ${type === 'income' ? 'Ingreso' : 'Egreso'}</button>
        </form>
    `;
}

function TransactionList({ transactions, type }: { transactions: Transaction[], type: TransactionType }) {
    const filteredTransactions = transactions.filter(t => t.type === type).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return html`
        <div class="transaction-table-wrapper">
             ${filteredTransactions.length > 0 ? html`
                <table class="transaction-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th style="text-align: right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredTransactions.map(t => html`
                            <tr key=${t.id}>
                                <td>${t.date}</td>
                                <td>${t.description}</td>
                                <td class="amount-cell ${t.type}">${new Intl.NumberFormat('es-VE', { style: 'currency', currency: t.currency }).format(t.amount)}</td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            ` : html`
                <div class="empty-state">
                    <p>No hay ${type === 'income' ? 'ingresos' : 'egresos'} registrados.</p>
                </div>
            `}
        </div>
    `;
}

function TransactionsView({ type, transactions, addTransaction }: { type: TransactionType, transactions: Transaction[], addTransaction: (t: Omit<Transaction, 'id'>) => void }) {
    const title = type === 'income' ? 'Ingresos' : 'Egresos';
    return html`
        <div>
            <h2>${title}</h2>
            <${TransactionForm} type=${type} addTransaction=${addTransaction} />
            <h3>Historial de ${title}</h3>
            <${TransactionList} transactions=${transactions} type=${type} />
        </div>
    `;
}


function App() {
  const [view, setView] = useState('dashboard');
  const [transactions, setTransactions] = useLocalStorage('siga-transactions', []);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...transaction, id: crypto.randomUUID() };
    setTransactions([...transactions, newTransaction]);
  };
  
  let currentView;
  switch(view) {
    case 'dashboard':
      currentView = html`<${Dashboard} transactions=${transactions} />`;
      break;
    case 'income':
      currentView = html`<${TransactionsView} type="income" transactions=${transactions} addTransaction=${addTransaction} />`;
      break;
    case 'expense':
        currentView = html`<${TransactionsView} type="expense" transactions=${transactions} addTransaction=${addTransaction} />`;
        break;
    default:
        currentView = html`<${Dashboard} transactions=${transactions} />`;
  }

  return html`
      <${Sidebar} currentView=${view} setView=${setView} />
      <main class="content">
        ${currentView}
      </main>
  `;
}

render(html`<${App} />`, document.getElementById('app'));