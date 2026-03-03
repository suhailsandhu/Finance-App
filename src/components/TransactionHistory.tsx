import React from "react";
import { motion } from "motion/react";
import { Trash2, Edit2 } from "lucide-react";
import { Transaction } from "../types";

interface Props {
  transactions: Transaction[];
  onDelete: (id: number) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionHistory({ transactions, onDelete, onEdit }: Props) {
  const grouped = transactions.reduce((acc, t) => {
    const date = new Date(t.timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="px-6 pb-24 mt-4">
      {transactions.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted font-display">No activity found.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-10">
            <h3 className="mb-4 text-[10px] font-semibold tracking-[0.3em] uppercase text-muted/40">
              {date}
            </h3>
            <div className="space-y-4">
              {items.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onDelete={() => onDelete(t.id)}
                  onEdit={() => onEdit(t)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  onDelete: () => void;
  onEdit: () => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onDelete, onEdit }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex items-center justify-between p-4 glass rounded-2xl overflow-hidden"
    >
      {/* Glossy highlight */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
      
      <div className="flex flex-col">
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted mb-0.5">{transaction.category_name}</span>
        {transaction.note && (
          <span className="text-xs text-accent/30 font-display line-clamp-1">{transaction.note}</span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-lg font-display font-bold text-accent">
          -${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
        
        <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-muted hover:text-accent transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-muted hover:text-rose-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
