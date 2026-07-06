
import { createClient } from '@supabase/supabase-js';

// Robust Env Var Access for Vite/CRA
// This prevents "Cannot read properties of undefined" by checking existence first
const getEnv = (key: string): string => {
    let val: string | undefined = '';

    // 1. Try Vite's import.meta.env (Static Replacement)
    try {
        // @ts-ignore: Check if import.meta exists
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore: Access property safely
            if (key === 'VITE_SUPABASE_URL') val = import.meta.env.VITE_SUPABASE_URL;
            // @ts-ignore
            if (key === 'VITE_SUPABASE_ANON_KEY') val = import.meta.env.VITE_SUPABASE_ANON_KEY;
        }
    } catch (e) { /* ignore */ }

    if (val) return val;

    // 2. Try process.env (Standard Node/CRA Fallback)
    try {
        if (typeof process !== 'undefined' && process.env) {
            val = process.env[key];
        }
    } catch (e) { /* ignore */ }

    return val || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase credentials missing. Please check your .env file.");
}

export const supabase = createClient(
    supabaseUrl || 'https://ajkycqazreebczqjsfpv.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa3ljcWF6cmVlYmN6cWpzZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTM5MjMsImV4cCI6MjA4NDA2OTkyM30.VscG53hy5tT5_oT297RECiVzaCcCw51AYWQeme_PDRo'
);
