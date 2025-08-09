
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, DollarSign, Calendar, Tag, Filter, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Main App Component
const App = () => {
    // State for expenses, initialized from localStorage
    const [expenses, setExpenses] = useState(() => {
        try {
            const savedExpenses = localStorage.getItem('expenses');
            return savedExpenses ? JSON.parse(savedExpenses) : [];
        } catch (error) {
            console.error("Error parsing expenses from localStorage", error);
            return [];
        }
    });

    // State for managing form visibility and editing mode
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [isChartVisible, setIsChartVisible] = useState(false);

    // Persist expenses to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('expenses', JSON.stringify(expenses));
        } catch (error) {
            console.error("Error saving expenses to localStorage", error);
        }
    }, [expenses]);

    // Handlers for expense operations
    const addExpense = (expense) => {
        setExpenses([...expenses, { ...expense, id: Date.now(), paid: false }]);
        setIsFormOpen(false);
    };

    const updateExpense = (updatedExpense) => {
        setExpenses(expenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
        setEditingExpense(null);
        setIsFormOpen(false);
    };

    const deleteExpense = (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            setExpenses(expenses.filter(exp => exp.id !== id));
        }
    };

    const togglePaid = (id) => {
        setExpenses(expenses.map(exp => exp.id === id ? { ...exp, paid: !exp.paid } : exp));
    };

    // Form handlers
    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };
    const handleAddNew = () => {
        setEditingExpense(null);
        setIsFormOpen(true);
    };
    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingExpense(null);
    };
    
    // Get unique years from expenses for the filter dropdown
    const availableYears = ['All', ...Array.from(new Set(expenses.map(exp => new Date(exp.dueDate).getFullYear()))).sort((a, b) => b - a)];

    // Filter expenses based on all active filters
    const filteredExpenses = expenses.filter(expense => {
        if (!expense.dueDate) return false;
        const expenseDate = new Date(expense.dueDate);
        const expenseMonth = expenseDate.getMonth();
        const expenseYear = expenseDate.getFullYear();

        const categoryMatch = categoryFilter === 'All' || expense.category === categoryFilter;
        const yearMatch = yearFilter === 'All' || expenseYear === parseInt(yearFilter);
        const monthMatch = monthFilter === 'All' || expenseMonth === parseInt(monthFilter);

        return categoryMatch && yearMatch && monthMatch;
    });

    // Calculate summary data
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const paidExpenses = filteredExpenses.filter(exp => exp.paid).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const unpaidExpenses = totalExpenses - paidExpenses;

    const categories = ['All', 'Utilities', 'Credit Card', 'Groceries', 'Rent/Mortgage', 'Transportation', 'Entertainment', 'Other'];

    return (
        <div className="bg-gray-100 min-h-screen font-sans text-gray-800 flex flex-col">
            <main className="flex-grow">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                    <Header onAddNew={handleAddNew} />
                    <Summary total={totalExpenses} paid={paidExpenses} unpaid={unpaidExpenses} />
                    <FilterControls
                        categories={categories}
                        activeCategoryFilter={categoryFilter}
                        onCategoryFilterChange={setCategoryFilter}
                        availableYears={availableYears}
                        selectedYear={yearFilter}
                        onYearChange={setYearFilter}
                        selectedMonth={monthFilter}
                        onMonthChange={setMonthFilter}
                    />

                    <div className="text-center mb-6">
                        <button
                            onClick={() => setIsChartVisible(!isChartVisible)}
                            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-colors flex items-center mx-auto"
                        >
                            <BarChart2 size={20} className="mr-2" />
                            {isChartVisible ? 'Hide Visualization' : 'Show Visualization'}
                        </button>
                    </div>

                    {isChartVisible && <ExpenseChart expenses={filteredExpenses} />}

                    {isFormOpen && (
                        <ExpenseForm
                            onAdd={addExpense}
                            onUpdate={updateExpense}
                            onClose={handleCloseForm}
                            existingExpense={editingExpense}
                            categories={categories.filter(c => c !== 'All')}
                        />
                    )}

                    <ExpenseList
                        expenses={filteredExpenses}
                        onEdit={handleEdit}
                        onDelete={deleteExpense}
                        onTogglePaid={togglePaid}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
};

// Header Component
const Header = ({ onAddNew }) => (
    <header className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-700">Expense Tracker</h1>
        <button
            onClick={onAddNew}
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
            <Plus size={20} className="mr-2" />
            Add Expense
        </button>
    </header>
);

// Summary Component
const Summary = ({ total, paid, unpaid }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Total Expenses" amount={total} color="bg-blue-500" icon={<DollarSign />} />
        <SummaryCard title="Paid" amount={paid} color="bg-green-500" icon={<CheckCircle />} />
        <SummaryCard title="Remaining" amount={unpaid} color="bg-red-500" icon={<Clock />} />
    </div>
);

// Summary Card Component
const SummaryCard = ({ title, amount, color, icon }) => (
    <div className={`${color} text-white p-4 rounded-lg shadow-lg flex items-center`}>
        <div className="mr-4 text-3xl opacity-75">{icon}</div>
        <div>
            <p className="text-lg font-semibold">{title}</p>
            <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
        </div>
    </div>
);

// Filter Controls Component
const FilterControls = ({
    categories, activeCategoryFilter, onCategoryFilterChange,
    availableYears, selectedYear, onYearChange,
    selectedMonth, onMonthChange
}) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                <div className="flex items-center">
                    <Filter size={20} className="mr-2 text-gray-500" />
                    <h3 className="text-md font-semibold text-gray-600">FILTERS:</h3>
                </div>
                {/* Year Filter */}
                <select
                    value={selectedYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                >
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>

                {/* Month Filter */}
                <select
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                >
                    <option value="All">All Months</option>
                    {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                </select>
            </div>
            <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => onCategoryFilterChange(category)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            activeCategoryFilter === category
                                ? 'bg-blue-500 text-white shadow'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Expense Chart Component
const ExpenseChart = ({ expenses }) => {
    const chartData = expenses.reduce((acc, expense) => {
        const { category, amount } = expense;
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) return acc;
        const existingCategory = acc.find(item => item.name === category);
        if (existingCategory) {
            existingCategory.value += numericAmount;
        } else {
            acc.push({ name: category, value: numericAmount });
        }
        return acc;
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#19D4FF', '#FF4560'];

    if (chartData.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center text-gray-500">
                <h2 className="text-2xl font-bold mb-4 text-gray-700">Spending by Category</h2>
                <p>No data to display for the current filters.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Spending by Category</h2>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                if (percent === 0) return null;
                                return (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


// Expense Form Component
const ExpenseForm = ({ onAdd, onUpdate, onClose, existingExpense, categories }) => {
    const [name, setName] = useState(existingExpense?.name || '');
    const [amount, setAmount] = useState(existingExpense?.amount || '');
    const [dueDate, setDueDate] = useState(existingExpense?.dueDate || '');
    const [category, setCategory] = useState(existingExpense?.category || categories[0]);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amount || !dueDate || !category) {
            setError('All fields are required.');
            return;
        }
        if (parseFloat(amount) <= 0) {
            setError('Amount must be greater than zero.');
            return;
        }
        setError('');
        const expenseData = { name, amount, dueDate, category };
        if (existingExpense) {
            onUpdate({ ...existingExpense, ...expenseData });
        } else {
            onAdd(expenseData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center">{existingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField icon={<Edit size={20} />} type="text" placeholder="Expense Name (e.g., Electricity Bill)" value={name} onChange={e => setName(e.target.value)} />
                    <InputField icon={<DollarSign size={20} />} type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
                    <InputField icon={<Calendar size={20} />} type="date" placeholder="Due Date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                           <Tag size={20} />
                        </div>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full flex justify-center items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        <Save size={20} className="mr-2" />
                        {existingExpense ? 'Save Changes' : 'Add Expense'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Reusable Input Field Component
const InputField = ({ icon, ...props }) => (
    <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
        </div>
        <input {...props} className="w-full pl-10 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
    </div>
);


// Expense List Component
const ExpenseList = ({ expenses, onEdit, onDelete, onTogglePaid }) => (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-4">Your Expenses</h2>
        {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expenses found for the selected filters.</p>
        ) : (
            <div className="space-y-4">
                {expenses.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(expense => (
                    <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onTogglePaid={onTogglePaid}
                    />
                ))}
            </div>
        )}
    </div>
);

// Expense Item Component
const ExpenseItem = ({ expense, onEdit, onDelete, onTogglePaid }) => {
    const isPastDue = !expense.paid && new Date(expense.dueDate) < new Date();
    const itemBg = expense.paid ? 'bg-green-50' : isPastDue ? 'bg-red-50' : 'bg-white';
    const borderColor = expense.paid ? 'border-green-300' : isPastDue ? 'border-red-300' : 'border-gray-200';

    return (
        <div className={`${itemBg} border-l-4 ${borderColor} p-4 rounded-r-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between transition-colors`}>
            <div className="flex-grow mb-4 sm:mb-0">
                <div className="flex items-center mb-2">
                    <span className={`font-bold text-lg ${expense.paid ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {expense.name}
                    </span>
                    <span className="ml-3 bg-gray-200 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{expense.category}</span>
                </div>
                <p className={`text-xl font-semibold ${expense.paid ? 'text-green-600' : 'text-blue-600'}`}>
                    ${parseFloat(expense.amount).toFixed(2)}
                </p>
                <p className={`text-sm ${isPastDue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    Due: {new Date(expense.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onTogglePaid(expense.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center transition-colors ${
                        expense.paid
                            ? 'bg-yellow-400 hover:bg-yellow-500 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                >
                    {expense.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                </button>
                <button onClick={() => onEdit(expense)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"><Edit size={20} /></button>
                <button onClick={() => onDelete(expense.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"><Trash2 size={20} /></button>
            </div>
        </div>
    );
};

// Footer Component
const Footer = () => (
    <footer className="bg-gray-200 text-center p-4 mt-8">
        <p className="text-sm text-gray-600">
            &copy; 2025 Sudeep Shrestha | v1.2.0
        </p>
    </footer>
);


export default App;
