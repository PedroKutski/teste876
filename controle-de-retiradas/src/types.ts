export interface WithdrawalItem {
  model: string;
  quantity: number;
}

export interface Withdrawal {
  id: string;
  code: string;
  customCode?: string;
  personName: string;
  items: WithdrawalItem[];
  date: string;
  synced: boolean;
  photo?: string;
}

