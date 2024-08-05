interface ILocalStorage {
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
    removeItem(key: string): void;
}

const values: { [key: string]: string } = {};

class MockLocalStorage implements ILocalStorage {


    setItem(key: string, value: string): void {
        values[key] = value;
    }

    getItem(key: string): string | null {
        return values[key] || null;
    }

    removeItem(key: string): void {
        delete values[key];
    }
}

export const myLocalStorage: ILocalStorage = new MockLocalStorage();
