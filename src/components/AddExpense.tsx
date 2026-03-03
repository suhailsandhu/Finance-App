import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, Check, History } from "lucide-react";
import { Category, Paycheck } from "../types";

interface Props {
  category: Category;
  paycheck: Paycheck;
  onClose: () => void;
  onSave: (amount: number, note: string) => void;
  onViewHistory: () => void;
}

export default function AddExpense({ category, paycheck, onClose, onSave, onViewHistory }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState(1);

  const handleNumberClick = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.length >= 10) return;
    setAmount(prev => prev + num);
  };

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    onSave(numAmount, note);
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      className="fixed inset-0 z-50 flex flex-col bg-bg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <button 
          onClick={onViewHistory}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass hover:bg-white/10 transition-all active:scale-95"
        >
          <History size={10} className="text-muted" />
          <span className="text-[7px] font-bold tracking-[0.15em] uppercase text-muted">History</span>
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-[8px] font-bold tracking-[0.3em] uppercase text-muted">
            Add Expense
          </span>
          <h2 className="text-base font-display font-bold">{category.name}</h2>
        </div>

        <button onClick={onClose} className="p-2 transition-colors rounded-full glass text-muted hover:text-accent">
          <X size={16} />
        </button>
      </div>

      {step === 1 ? (
        <div className="flex flex-col flex-1 px-6">
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative">
              <motion.div 
                key={amount}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-display font-bold text-accent tracking-tighter flex items-baseline"
              >
                <span className="text-xl opacity-20 mr-1.5">$</span>
                {amount || "0"}
                <motion.div
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-0.5 h-10 ml-1 bg-accent/50 rounded-full self-center"
                />
              </motion.div>
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 mb-8">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.92 }}
                onClick={() => key === "del" ? handleDelete() : handleNumberClick(key)}
                className="relative flex items-center justify-center h-14 text-xl font-light transition-all rounded-[24px] glass text-accent hover:bg-white/10 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {key === "del" ? "←" : key}
              </motion.button>
            ))}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setStep(2)}
              className="flex items-center justify-center h-14 text-[8px] font-bold tracking-widest uppercase transition-all rounded-[24px] glass border-white/10 text-muted hover:text-accent hover:bg-white/10"
            >
              Add Note
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              disabled={!amount}
              onClick={handleSave}
              className="col-span-2 flex items-center justify-center h-14 text-[10px] font-bold tracking-widest uppercase transition-all rounded-[24px] bg-accent text-bg disabled:opacity-20 shadow-lg"
            >
              Enter
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 px-6 pt-12">
          <div className="mb-12">
            <label className="block mb-6 text-[10px] font-bold tracking-[0.4em] uppercase text-muted text-center">
              Add a note
            </label>
            <div className="relative">
              <textarea
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was this for?"
                className="w-full p-8 text-2xl bg-white/[0.03] rounded-[40px] border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 text-accent placeholder:text-muted/20 text-center"
                rows={4}
              />
            </div>
          </div>

          <div className="mt-auto mb-12 space-y-5">
            <button
              onClick={() => setStep(1)}
              className="w-full py-6 text-sm font-bold tracking-widest uppercase transition-all glass rounded-3xl text-muted hover:text-accent active:scale-95"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center w-full gap-3 py-6 text-lg font-bold tracking-widest uppercase text-bg transition-all bg-accent rounded-3xl hover:opacity-90 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
            >
              Complete <Check size={20} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
