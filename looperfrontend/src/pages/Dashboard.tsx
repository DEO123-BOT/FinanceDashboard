import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

interface Transaction {
  _id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  user_id: string;
  status: 'Paid' | 'Pending';
}

function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [month, setMonth] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [user, setUser] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [groupByWeek, setGroupByWeek] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem('dashboard-darkmode');
      if (stored) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sidebar navigation
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'analytics' | 'wallet' | 'messages' | 'settings'>('dashboard');

  const navigate = useNavigate();
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#00c49f', '#ffb6b9'];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dashboard-darkmode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dashboard-darkmode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : res.data.transactions || [];
        setTransactions(data);
        setFiltered(data);
      } catch (err) {
        setError('Failed to load transactions');
      }
    };
    fetchTransactions();
  }, []);

  useEffect(() => {
    let result = [...transactions];

    if (month) result = result.filter((t) => new Date(t.date).getMonth() + 1 === Number(month));
    if (status) result = result.filter((t) => t.status === status);
    if (category) result = result.filter((t) => t.category === category);
    if (user) result = result.filter((t) => t.user_id === user);
    if (minAmount) result = result.filter((t) => t.amount >= parseFloat(minAmount));
    if (maxAmount) result = result.filter((t) => t.amount <= parseFloat(maxAmount));
    if (startDate) result = result.filter((t) => new Date(t.date) >= new Date(startDate));
    if (endDate) result = result.filter((t) => new Date(t.date) <= new Date(endDate));

    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter((t) =>
        t.user_id?.toLowerCase().includes(s) ||
        t.status?.toLowerCase().includes(s) ||
        t.category?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s) ||
        t.amount.toString().includes(s) ||
        new Date(t.date).toLocaleDateString().toLowerCase().includes(s)
      );
    }

    setCurrentPage(1);
    setFiltered(result);
  }, [
    month, status, category, user, minAmount, maxAmount,
    startDate, endDate, transactions, search
  ]);

  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const exportToCSV = () => {
    const header = 'User ID,Status,Date,Amount,Category,Description\n';
    const rows = filtered
      .map((t) => {
        const date = new Date(t.date).toISOString().split('T')[0];
        return `${t.user_id},${t.status},${date},${t.amount},${t.category || 'N/A'},${t.description || '-'}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category)));
  const uniqueUsers = Array.from(new Set(transactions.map((t) => t.user_id)));

  const getWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay();
    const adjustedDate = date.getDate() + dayOfWeek;
    return Math.ceil(adjustedDate / 7);
  };

  const categoryData = Object.entries(
    filtered.reduce((acc, t) => {
      const key = t.category || 'Uncategorized';
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const barData = groupByWeek
    ? Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(0, i).toLocaleString('default', { month: 'short' });
        const weeks = [0, 0, 0, 0, 0];
        filtered
          .filter((t) => new Date(t.date).getMonth() === i)
          .forEach((t) => {
            const week = getWeek(t.date);
            weeks[week - 1] += t.amount;
          });
        return { name: monthName, ...weeks.reduce((acc, val, idx) => ({ ...acc, [`W${idx + 1}`]: val }), {}) };
      })
    : Array.from({ length: 12 }, (_, i) => {
        const monthName = new Date(0, i).toLocaleString('default', { month: 'short' });
        const total = filtered
          .filter((t) => new Date(t.date).getMonth() === i)
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: monthName, total };
      });

  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentEntries = filtered.slice(startIndex, startIndex + rowsPerPage);

  // Summary metrics
  const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
  const totalPaid = filtered.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
  const totalPending = filtered.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0);

  // Function to generate pagination range
  const getPaginationRange = () => {
    const range = [];
    const maxVisiblePages = 5;
    
    // Always show first page
    range.push(1);
    
    // If current page is more than 3, show ellipsis
    if (currentPage > 3) {
      range.push('...');
    }
    
    // Determine which pages to show around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust if we're near the start
    if (currentPage <= 3) {
      end = Math.min(4, totalPages - 1);
    }
    
    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
      start = Math.max(totalPages - 3, 2);
    }
    
    // Add pages in range
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }
    
    // If current page is more than totalPages - 3, show ellipsis
    if (currentPage < totalPages - 2) {
      range.push('...');
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range;
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-blue-600 dark:text-blue-300">Looper.ai</h2>
        {/* Sidebar Menu Items */}
        <nav className="flex-1 space-y-2 mb-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center w-full p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${activeView === 'dashboard' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
            <span className="mr-3">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveView('transactions')}
            className={`flex items-center w-full p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${activeView === 'transactions' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
            <span className="mr-3">💰</span>
            <span>Transactions</span>
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center w-full p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${activeView === 'analytics' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
            <span className="mr-3">📈</span>
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveView('wallet')}
            className={`flex items-center w-full p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${activeView === 'wallet' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
            <span className="mr-3">👛</span>
            <span>Wallet</span>
          </button>
          <button
            onClick={() => setActiveView('messages')}
            className={`flex items-center w-full p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${activeView === 'messages' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
            <span className="mr-3">💬</span>
            <span>Messages</span>
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`flex items-center w-full p-2 rounded hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 ${activeView === 'settings' ? 'bg-blue-50 dark:bg-gray-700' : ''}`}>
            <span className="mr-3">⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full p-2 mb-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <span className="font-medium">Filters</span>
          <span>{showFilters ? '▲' : '▼'}</span>
        </button>

        {/* Filters section - conditionally rendered */}
        {showFilters && (
          <div className="space-y-4 mb-4">
            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>

            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" value={user} onChange={(e) => setUser(e.target.value)}>
              <option value="">All Users</option>
              {uniqueUsers.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>

            <input type="number" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" placeholder="Min ₹" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            <input type="number" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" placeholder="Max ₹" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />

            <input type="date" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

            <div className="flex space-x-2">
              <button onClick={exportToCSV} className="flex-1 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-sm">Export CSV</button>
              <button onClick={() => {
                setMonth(''); setStatus(''); setCategory(''); setUser('');
                setMinAmount(''); setMaxAmount(''); setStartDate('');
                setEndDate(''); setGroupByWeek(false); setCurrentPage(1);
                setFiltered(transactions);
                setSearch('');
              }} className="flex-1 bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 text-sm">Reset</button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        {/* Header with search and dark mode toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-300">
            {activeView === 'dashboard' ? 'Dashboard' :
              activeView === 'transactions' ? 'Transactions' :
                activeView.charAt(0).toUpperCase() + activeView.slice(1)}
          </h1>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              className="p-2 border border-gray-300 dark:border-gray-700 rounded shadow-sm dark:bg-gray-800 dark:text-gray-100"
              placeholder="🔍 Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              onClick={() => setDarkMode(d => !d)}
              className="rounded px-3 py-2 text-xl focus:outline-none bg-gray-200 dark:bg-gray-700 dark:text-yellow-300 text-gray-800 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              title="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && (
          <>
            {/* Summary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Total Transactions</span>
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{filtered.length}</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Total Amount</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Paid Amount</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-300">₹{totalPaid.toLocaleString()}</span>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Pending Amount</span>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">₹{totalPending.toLocaleString()}</span>
              </div>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-300">📈 Spending by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                <h2 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-300">📊 Monthly Spending</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke={darkMode ? '#ddd' : '#333'} />
                    <YAxis stroke={darkMode ? '#ddd' : '#333'} />
                    <Tooltip />
                    <Legend />
                    {groupByWeek
                      ? ['W1', 'W2', 'W3', 'W4', 'W5'].map((w, i) => <Bar key={w} dataKey={w} fill={COLORS[i % COLORS.length]} />)
                      : <Bar dataKey="total" fill="#82ca9d" />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Group by week toggle */}
            <div className="flex justify-between items-center mb-4">
              <label className="flex items-center gap-2 text-sm dark:text-gray-300">
                <input type="checkbox" checked={groupByWeek} onChange={(e) => setGroupByWeek(e.target.checked)} />
                Group by Week
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing {startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalEntries)} of {totalEntries} entries
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="bg-white dark:bg-gray-800 rounded shadow p-4 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-300">Recent Transactions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {transaction.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'Paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TRANSACTIONS VIEW */}
        {activeView === 'transactions' && (
          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">user_id</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentEntries.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {transaction.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      ₹{transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'Paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + rowsPerPage, totalEntries)}</span> of{' '}
                    <span className="font-medium">{totalEntries}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1} 
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    
                    {getPaginationRange().map((item, index) => {
                      if (item === '...') {
                        return (
                          <span 
                            key={index} 
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(Number(item))}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium ${
                            currentPage === item ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                    
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages} 
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeView === 'analytics' && (
          <div className="text-center py-10 text-gray-600 dark:text-gray-300">
            <h2 className="text-2xl font-semibold mb-2">Analytics</h2>
            <p>Analytics content will appear here.</p>
          </div>
        )}

        {/* WALLET VIEW */}
        {activeView === 'wallet' && (
          <div className="text-center py-10 text-gray-600 dark:text-gray-300">
            <h2 className="text-2xl font-semibold mb-2">Wallet</h2>
            <p>Wallet content will appear here.</p>
          </div>
        )}

        {/* MESSAGES VIEW */}
        {activeView === 'messages' && (
          <div className="text-center py-10 text-gray-600 dark:text-gray-300">
            <h2 className="text-2xl font-semibold mb-2">Messages</h2>
            <p>Messages content will appear here.</p>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && (
          <div className="text-center py-10 text-gray-600 dark:text-gray-300">
            <h2 className="text-2xl font-semibold mb-2">Settings</h2>
            <p>Settings content will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;