import { Pool } from "../types";

interface ILocalStorage {
    setItem(key: string, value: Pool): void;
    getItem(key: string): Pool | null;
    removeItem(key: string): void;
}

const values: { [key: string]: Pool } = {};

class MockLocalStorage implements ILocalStorage {


    setItem(key: string, value: Pool): void {
        values[key] = value;
    }

    getItem(key: string): Pool | null {
        return values[key] || null;
    }

    removeItem(key: string): void {
        delete values[key];
    }
}

export const myLocalStorage: ILocalStorage = new MockLocalStorage();
