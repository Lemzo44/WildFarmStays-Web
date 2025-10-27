export class LocalStorageService {
  static async getAll(collection: string): Promise<any[]> {
    const data = localStorage.getItem(collection);
    return data ? JSON.parse(data) : [];
  }

  static async getById(collection: string, id: string): Promise<any | null> {
    const items = await this.getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  static async save(collection: string, item: any): Promise<void> {
    const items = await this.getAll(collection);
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    
    localStorage.setItem(collection, JSON.stringify(items));
  }

  static async delete(collection: string, id: string): Promise<void> {
    const items = await this.getAll(collection);
    const filteredItems = items.filter(item => item.id !== id);
    localStorage.setItem(collection, JSON.stringify(filteredItems));
  }

  static async getItem(collection: string, key: string): Promise<any | null> {
    const keyWithPrefix = `${collection}_${key}`;
    const data = localStorage.getItem(keyWithPrefix);
    return data ? JSON.parse(data) : null;
  }

  static async setItem(collection: string, key: string, value: any): Promise<void> {
    const keyWithPrefix = `${collection}_${key}`;
    localStorage.setItem(keyWithPrefix, JSON.stringify(value));
  }
}


