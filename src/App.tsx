import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, History as HistoryIcon, X, Check, ChevronDown, ChevronLeft, ChevronRight, Wallet, PieChart, Edit2, Calendar } from "lucide-react";
import CategoryGrid from "./components/CategoryGrid";
import AddExpense from "./components/AddExpense";
import TransactionHistory from "./components/TransactionHistory";
import { Paycheck, Category, Transaction } from "./types";

export default function App() {
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = localStorage.getItem("activeIndex");
    return saved ? parseInt(saved) : 0;
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [isEditingPaycheck, setIsEditingPaycheck] = useState<Paycheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryHistory, setCategoryHistory] = useState<Category | null>(null);

  const [isPaycheckSelectorOpen, setIsPaycheckSelectorOpen] = useState(false);
  const [isAddingPaycheck, setIsAddingPaycheck] = useState(false);
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const pRes = await fetch("/api/paychecks");
      const pData = await pRes.json();
      
      // Sort paychecks by date
      const sortedPaychecks = pData.sort((a: Paycheck, b: Paycheck) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setPaychecks(sortedPaychecks);
      
      // Fetch categories for the active paycheck if it exists
      const activeP = sortedPaychecks[activeIndex];
      const cRes = await fetch(`/api/categories${activeP ? `?paycheckId=${activeP.id}` : ""}`);
      const cData = await cRes.json();
      setCategories(cData);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [activeIndex]);

  const fetchTransactions = useCallback(async (paycheckId: number) => {
    try {
      const res = await fetch(`/api/transactions/${paycheckId}`);
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (paychecks[activeIndex]) {
      fetchTransactions(paychecks[activeIndex].id);
    }
  }, [activeIndex, paychecks, fetchTransactions]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.offsetWidth;
    if (width === 0) return;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < paychecks.length) {
      setActiveIndex(newIndex);
      localStorage.setItem("activeIndex", newIndex.toString());
    }
  };

  const scrollToPage = (index: number) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    scrollRef.current.scrollTo({
      left: index * width,
      behavior: "smooth"
    });
    setActiveIndex(index);
    localStorage.setItem("activeIndex", index.toString());
  };

  const handleSaveExpense = async (amount: number, note: string) => {
    if (!selectedCategory || !paychecks[activeIndex]) return;

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paycheck_id: paychecks[activeIndex].id,
          category_id: selectedCategory.id,
          amount,
          note
        })
      });

      if (res.ok) {
        setSelectedCategory(null);
        fetchTransactions(paychecks[activeIndex].id);
      }
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTransactions(paychecks[activeIndex].id);
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleUpdatePaycheck = async (amount: number, date: string, label: string) => {
    if (!isEditingPaycheck) return;
    try {
      const res = await fetch(`/api/paychecks/${isEditingPaycheck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, date, label })
      });
      if (res.ok) {
        setIsEditingPaycheck(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error updating paycheck:", error);
    }
  };

  const handleUpdateCategoryPercentage = async (id: string, percentage: number) => {
    if (!activePaycheck) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage, paycheckId: activePaycheck.id })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating category percentage:", error);
    }
  };

  const handleUpdateTransaction = async (id: number, amount: number, note: string, category_id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note, category_id })
      });
      if (res.ok) {
        setEditingTransaction(null);
        if (activePaycheck) fetchTransactions(activePaycheck.id);
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const handleDeletePaycheck = async (id: number) => {
    if (!confirm("Are you sure you want to delete this paycheck? All associated transactions will be lost.")) return;
    try {
      const res = await fetch(`/api/paychecks/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (activeIndex >= paychecks.length - 1 && activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
        }
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting paycheck:", error);
    }
  };

  const handleCreatePaycheck = async (amount: number, date: string, label: string) => {
    try {
      const res = await fetch("/api/paychecks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, date, label })
      });
      if (res.ok) {
        setIsAddingPaycheck(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating paycheck:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-display italic"
        >
          Flow
        </motion.div>
      </div>
    );
  }

  const activePaycheck = paychecks[activeIndex];
  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);
  const remainingTotal = activePaycheck ? activePaycheck.amount - totalSpent : 0;

  return (
    <div className="flex justify-center bg-black min-h-screen">
      <div className="relative h-screen w-full max-w-lg overflow-hidden bg-bg selection:bg-white/20 border-x border-white/5">
        {/* Header / Paycheck Switcher */}
      <header className="absolute top-0 left-0 right-0 z-30 px-6 pt-10 pb-4 bg-gradient-to-b from-bg to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-muted mb-0.5">
              {activePaycheck?.label || "Paycheck"}
            </span>
            <div className="flex items-center gap-2">
              <div className="text-xl font-display font-bold flex items-center gap-1.5">
                {activePaycheck ? `$${activePaycheck.amount.toLocaleString()}` : "$0"}
              </div>
              <button 
                onClick={() => setIsPaycheckSelectorOpen(true)}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-muted hover:text-accent transition-all"
              >
                <Wallet size={12} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsBillsOpen(true)}
              className="p-2 rounded-full glass text-muted hover:text-accent transition-all"
            >
              <Calendar size={16} />
            </button>
            <button 
              onClick={() => setIsCategorySettingsOpen(true)}
              className="p-2 rounded-full glass text-muted hover:text-accent transition-all"
            >
              <PieChart size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Full Page Swipe Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {paychecks.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center px-10 text-center">
            <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8">
              <Plus size={32} className="text-accent/20" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">Start your flow</h2>
            <p className="text-xs text-muted leading-relaxed mb-10 max-w-[240px]">
              Input your first paycheck to begin allocating your funds and tracking expenses.
            </p>
            <button
              onClick={() => setIsAddingPaycheck(true)}
              className="px-8 py-4 bg-accent text-bg rounded-2xl font-bold text-xs tracking-[0.2em] uppercase shadow-xl active:scale-95 transition-all"
            >
              Add First Paycheck
            </button>
          </div>
        ) : (
          paychecks.map((paycheck, idx) => (
            <div key={paycheck.id} className="w-full h-full flex-shrink-0 snap-center pt-28 px-5 pb-28 overflow-y-auto no-scrollbar">
              <div className="mb-10 text-center">
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-muted block mb-3">
                  Available Funds
                </span>
                <h1 className={`text-6xl font-display font-bold tracking-tighter ${remainingTotal < 0 ? 'text-rose-500' : 'text-accent'}`}>
                  ${remainingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h1>
              </div>

              <CategoryGrid
                categories={categories}
                transactions={idx === activeIndex ? transactions : []}
                paycheckAmount={paycheck.amount}
                onCategoryClick={setSelectedCategory}
                onCategoryLongPress={setCategoryHistory}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <footer className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-10 pt-6 bg-gradient-to-t from-bg to-transparent flex justify-center">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="glass px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 shadow-lg"
        >
          <HistoryIcon size={12} className="text-muted" />
          <span className="text-[8px] font-bold tracking-[0.1em] uppercase text-muted">History</span>
        </button>
      </footer>

      {/* Category History Overlay */}
      <AnimatePresence>
        {categoryHistory && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 z-[60] flex flex-col pt-12 bg-bg"
          >
            <div className="flex items-center justify-between px-6 mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted mb-1">
                  Category History
                </span>
                <h2 className="text-3xl font-display font-bold">{categoryHistory.name}</h2>
              </div>
              <button 
                onClick={() => setCategoryHistory(null)}
                className="p-3 rounded-full glass text-muted hover:text-accent"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <TransactionHistory
                transactions={transactions.filter(t => t.category_id === categoryHistory.id)}
                onDelete={handleDeleteTransaction}
                onEdit={(t) => setEditingTransaction(t)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global History Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 z-[60] flex flex-col pt-12 bg-bg"
          >
            <div className="flex items-center justify-between px-6 mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted mb-1">
                  All Activity
                </span>
                <h2 className="text-3xl font-display font-bold">History</h2>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="p-3 rounded-full glass text-muted hover:text-accent"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <TransactionHistory
                transactions={transactions}
                onDelete={handleDeleteTransaction}
                onEdit={(t) => setEditingTransaction(t)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Settings Modal */}
      <AnimatePresence>
        {isCategorySettingsOpen && (
          <CategorySettings
            categories={categories}
            onClose={() => setIsCategorySettingsOpen(false)}
            onUpdate={handleUpdateCategoryPercentage}
          />
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <EditTransactionModal
            transaction={editingTransaction}
            categories={categories}
            onClose={() => setEditingTransaction(null)}
            onSave={handleUpdateTransaction}
          />
        )}
      </AnimatePresence>

      {/* Bills Overlay */}
      <AnimatePresence>
        {isBillsOpen && (
          <BillsOverlay onClose={() => setIsBillsOpen(false)} />
        )}
      </AnimatePresence>

      {/* Paycheck Selector Modal */}
      <AnimatePresence>
        {isPaycheckSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-6"
            onClick={() => setIsPaycheckSelectorOpen(false)}
          >
            <div className="w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-center text-[10px] font-semibold tracking-[0.4em] uppercase text-muted mb-8">
                Select Paycheck
              </h3>
              <div className="max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                {paychecks.map((p, i) => (
                  <div key={p.id} className="group relative">
                    <button
                      onClick={() => {
                        scrollToPage(i);
                        setIsPaycheckSelectorOpen(false);
                      }}
                      className={`w-full p-5 rounded-[32px] border transition-all flex flex-col items-center gap-0.5 ${
                        i === activeIndex 
                          ? "bg-accent text-bg border-accent" 
                          : "bg-white/5 text-accent border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-2xl font-display font-bold">${p.amount.toLocaleString()}</span>
                      <span className="text-[9px] font-medium tracking-widest uppercase opacity-40">
                        {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </button>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingPaycheck(p);
                        }}
                        className={`p-2 rounded-full glass transition-colors ${i === activeIndex ? 'text-bg hover:bg-bg/10' : 'text-muted hover:text-accent'}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePaycheck(p.id);
                        }}
                        className={`p-2 rounded-full glass transition-colors ${i === activeIndex ? 'text-bg hover:bg-bg/10' : 'text-muted hover:text-rose-500'}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setIsPaycheckSelectorOpen(false);
                  setIsAddingPaycheck(true);
                }}
                className="w-full p-5 rounded-3xl border border-white/10 bg-white/[0.02] text-accent hover:bg-white/5 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="p-1 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-bg transition-colors relative z-10">
                  <Plus size={14} />
                </div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase relative z-10">Add Paycheck</span>
              </button>

              <button 
                onClick={() => setIsPaycheckSelectorOpen(false)}
                className="w-full py-4 text-muted hover:text-accent transition-colors text-xs font-semibold tracking-widest uppercase pt-4"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {selectedCategory && activePaycheck && (
          <AddExpense
            category={selectedCategory}
            paycheck={activePaycheck}
            onClose={() => setSelectedCategory(null)}
            onSave={handleSaveExpense}
            onViewHistory={() => setCategoryHistory(selectedCategory)}
          />
        )}
      </AnimatePresence>

      {/* Quick Edit Paycheck Modal */}
      <AnimatePresence>
        {isEditingPaycheck && (
          <QuickEditPaycheck
            title="Edit Paycheck"
            paycheck={isEditingPaycheck}
            onClose={() => setIsEditingPaycheck(null)}
            onSave={handleUpdatePaycheck}
          />
        )}
      </AnimatePresence>

      {/* Add Paycheck Modal */}
      <AnimatePresence>
        {isAddingPaycheck && (
          <QuickEditPaycheck
            title="New Paycheck"
            paycheck={{ amount: 0 } as any}
            onClose={() => setIsAddingPaycheck(false)}
            onSave={handleCreatePaycheck}
          />
        )}
      </AnimatePresence>
    </div>
  </div>
  );
}

function QuickEditPaycheck({ title = "Edit Paycheck", paycheck, onClose, onSave }: { title?: string; paycheck: Paycheck; onClose: () => void; onSave: (amount: number, date: string, label: string) => void }) {
  const [amount, setAmount] = useState(paycheck.amount.toString());
  const [date, setDate] = useState(paycheck.date || new Date().toISOString().split('T')[0]);
  const [label, setLabel] = useState(paycheck.label || "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md p-6 bg-surface rounded-t-[40px] border-t border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 transition-colors rounded-full bg-white/5 text-muted hover:text-accent">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 mb-6">
          <div>
            <label className="block mb-2 text-[9px] font-semibold tracking-widest uppercase text-muted">
              Paycheck Label
            </label>
            <input
              type="text"
              placeholder="e.g. Paycheck — Mar 13"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-accent font-medium text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-[9px] font-semibold tracking-widest uppercase text-muted">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-accent font-medium text-sm"
              />
            </div>
            <div>
              <label className="block mb-2 text-[9px] font-semibold tracking-widest uppercase text-muted">
                Net Amount
              </label>
              <div className="flex items-center gap-2 p-3.5 border bg-white/5 rounded-xl border-white/10 focus-within:ring-1 focus-within:ring-white/30 focus-within:border-white/30">
                <span className="text-lg font-light text-muted">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-lg font-light bg-transparent focus:outline-none text-accent"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onSave(parseFloat(amount), date, label)}
          className="flex items-center justify-center w-full gap-2 py-4 text-base font-medium text-bg transition-all bg-accent rounded-xl hover:opacity-90 active:scale-95"
        >
          {title.includes("New") ? "Create Paycheck" : "Update Paycheck"} <Check size={18} />
        </button>
        
        <div className="w-10 h-1 mx-auto mt-6 bg-white/10 rounded-full" />
      </motion.div>
    </motion.div>
  );
}

function CategorySettings({ categories, onClose, onUpdate }: { categories: Category[]; onClose: () => void; onUpdate: (id: string, percentage: number) => void }) {
  const [localCategories, setLocalCategories] = useState(categories);
  
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const totalPercentage = localCategories.reduce((acc, c) => acc + c.percentage, 0);

  const handleSliderChange = (id: string, value: number) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, percentage: value } : c));
  };

  const handleSliderCommit = (id: string, value: number) => {
    onUpdate(id, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm glass p-8 rounded-[40px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted mb-1">Settings</span>
            <h3 className="text-2xl font-display font-bold">Allocations</h3>
          </div>
          <button onClick={onClose} className="p-3 rounded-full glass text-muted hover:text-accent">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 mb-8">
          {localCategories.map((category) => (
            <div key={category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest uppercase text-muted" style={{ color: category.color }}>
                  {category.name}
                </span>
                <span className="text-sm font-mono font-bold text-accent">
                  {Math.round(category.percentage * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={category.percentage * 100}
                onChange={(e) => handleSliderChange(category.id, parseInt(e.target.value) / 100)}
                onMouseUp={(e) => handleSliderCommit(category.id, parseInt((e.target as HTMLInputElement).value) / 100)}
                onTouchEnd={(e) => handleSliderCommit(category.id, parseInt((e.target as HTMLInputElement).value) / 100)}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
                style={{ accentColor: category.color }}
              />
            </div>
          ))}
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted">Total Allocation</span>
          <span className={`text-xl font-display font-bold ${Math.abs(totalPercentage - 1) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {Math.round(totalPercentage * 100)}%
          </span>
        </div>

        <p className="mt-6 text-[10px] text-center text-muted/40 font-medium uppercase tracking-widest">
          Percentages auto-adjust your budget
        </p>
      </motion.div>
    </motion.div>
  );
}

function EditTransactionModal({ transaction, categories, onClose, onSave }: { transaction: Transaction; categories: Category[]; onClose: () => void; onSave: (id: number, amount: number, note: string, category_id: string) => void }) {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [note, setNote] = useState(transaction.note || "");
  const [categoryId, setCategoryId] = useState(transaction.category_id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md p-6 bg-surface rounded-t-[40px] border-t border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-muted mb-1">Edit Transaction</span>
            <h3 className="text-xl font-display font-bold">Update Details</h3>
          </div>
          <button onClick={onClose} className="p-2 transition-colors rounded-full bg-white/5 text-muted hover:text-accent">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 mb-6">
          <div>
            <label className="block mb-2 text-[9px] font-semibold tracking-widest uppercase text-muted">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`p-2.5 rounded-xl border text-[9px] font-bold tracking-widest uppercase transition-all ${
                    categoryId === c.id 
                      ? "bg-accent text-bg border-accent" 
                      : "bg-white/5 text-muted border-white/10 hover:bg-white/10"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-[9px] font-semibold tracking-widest uppercase text-muted">
              Amount
            </label>
            <div className="flex items-center gap-2 p-3.5 border bg-white/5 rounded-xl border-white/10 focus-within:ring-1 focus-within:ring-white/30 focus-within:border-white/30">
              <span className="text-lg font-light text-muted">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-lg font-light bg-transparent focus:outline-none text-accent"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-[9px] font-semibold tracking-widest uppercase text-muted">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 text-accent font-medium text-sm"
            />
          </div>
        </div>

        <button
          onClick={() => onSave(transaction.id, parseFloat(amount), note, categoryId)}
          className="flex items-center justify-center w-full gap-2 py-4 text-base font-medium text-bg transition-all bg-accent rounded-xl hover:opacity-90 active:scale-95"
        >
          Save Changes <Check size={18} />
        </button>
        
        <div className="w-10 h-1 mx-auto mt-6 bg-white/10 rounded-full" />
      </motion.div>
    </motion.div>
  );
}

function BillsOverlay({ onClose }: { onClose: () => void }) {
  const bills = [
    { name: "Capital 1 Credit Card", date: "26th", amount: "Monthly" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm glass p-8 rounded-[40px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted mb-1">Calendar</span>
            <h3 className="text-2xl font-display font-bold">Bill Dates</h3>
          </div>
          <button onClick={onClose} className="p-3 rounded-full glass text-muted hover:text-accent">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          {bills.map((bill, i) => (
            <div key={i} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-accent mb-1">{bill.name}</span>
                <span className="text-[10px] text-muted uppercase tracking-widest">{bill.amount}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-display font-bold text-accent">{bill.date}</span>
                <span className="text-[9px] text-muted uppercase tracking-tighter">Every Month</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-center text-muted/40 font-medium uppercase tracking-widest leading-relaxed">
          Stay ahead of your payments.<br/>Plan your flow.
        </p>
      </motion.div>
    </motion.div>
  );
}
