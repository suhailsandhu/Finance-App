import React from "react";
import { motion } from "motion/react";
import { Plus, History } from "lucide-react";
import { Category, Transaction } from "../types";

interface Props {
  categories: Category[];
  transactions: Transaction[];
  paycheckAmount: number;
  onCategoryClick: (category: Category) => void;
  onCategoryLongPress: (category: Category) => void;
}

export default function CategoryGrid({ categories, transactions, paycheckAmount, onCategoryClick, onCategoryLongPress }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {categories.map((category) => {
        const spent = transactions
          .filter(t => t.category_id === category.id)
          .reduce((acc, t) => acc + t.amount, 0);
        
        const allocated = paycheckAmount * category.percentage;

        return (
          <CategoryTile
            key={category.id}
            category={category}
            spent={spent}
            allocated={allocated}
            onAdd={() => onCategoryClick(category)}
            onViewHistory={() => onCategoryLongPress(category)}
          />
        );
      })}
    </div>
  );
}

interface CategoryTileProps {
  category: Category;
  spent: number;
  allocated: number;
  onAdd: () => void;
  onViewHistory: () => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ category, spent, allocated, onAdd, onViewHistory }) => {
  const remaining = allocated - spent; 
  const progress = Math.max(0, Math.min(100, (remaining / allocated) * 100));

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onAdd}
      className="relative flex flex-col items-start w-full p-6 text-left glass rounded-[32px] group overflow-hidden cursor-pointer"
    >
      <div 
        className="absolute top-0 left-0 w-1 h-full opacity-30"
        style={{ backgroundColor: category.color }}
      />
      
      {/* Glossy highlight */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between w-full mb-5">
        <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-muted">
          {category.name}
        </span>
      </div>
      
      <div className="flex flex-col mt-auto w-full">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-display font-semibold tracking-tight ${remaining < 0 ? 'text-rose-500' : 'text-accent'}`}>
            ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[9px] text-muted font-medium uppercase tracking-widest">left</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[9px] text-muted/50 font-medium uppercase tracking-tighter">
            {Math.round(category.percentage * 100)}% Allocation
          </span>
        </div>
      </div>

      <div className="w-full h-[2.5px] mt-6 overflow-hidden bg-white/[0.03] rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-full"
          style={{ backgroundColor: remaining < 0 ? '#F43F5E' : category.color }}
        />
      </div>
    </motion.div>
  );
}
