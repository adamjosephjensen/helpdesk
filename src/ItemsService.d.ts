export interface Item {
  id: string;
  value: string;
}

export function getItems(): Promise<Item[]>;
export function createItem(value: string): Promise<void>;
export function updateItem(id: string, value: string): Promise<void>;
export function subscribeToItems(handleChange: (payload: any) => void): { unsubscribe: () => void }; 