export interface Paycheck {
  id: number;
  date: string;
  amount: number;
  label: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  percentage: number;
}

export interface Transaction {
  id: number;
  paycheck_id: number;
  category_id: string;
  category_name?: string;
  amount: number;
  note: string;
  timestamp: string;
}
