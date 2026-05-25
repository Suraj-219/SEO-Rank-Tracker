import type { AxiosInstance } from "axios";
import { createContext, useState, type ReactNode } from "react";

interface User{
    id: string;
    name: string;
    email: string;
    plan: string;
    analysisCount?: number;
}

interface AppContextType{
    user: User | null;
    token: string | null;
    loading: boolean;
    api: AxiosInstance;
    login: (email: string, password: string)=> Promise<{success: boolean; message?: string}>;
    register: (name: string, email: string, password: string)=> Promise<{success: boolean; message?: string}>;
    logout: ()=> void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({children}: {children: ReactNode}){

    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<String | null>(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    const value = {}

    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>

}