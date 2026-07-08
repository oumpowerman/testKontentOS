
import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in different environments (Vite, CRA, Standard Node)
const getEnvVar = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Try import.meta.env for Vite-like environments (using any to bypass TS check for non-module envs)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore error
  }
  return undefined;
};

// Initialize the Supabase client
// We provide fallback values to prevent "supabaseUrl is required" error if env variables are not set.
const supabaseUrl = getEnvVar('REACT_APP_SUPABASE_URL') || 'https://xgsvxgsrasznszvpysat.supabase.co';
const supabaseAnonKey = getEnvVar('REACT_APP_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IInhnc3Z4Z3NyYXN6bnN6dnB5c2F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzI0NTgsImV4cCI6MjA5ODgwODQ1OH0.2TLqHFHnKQGuoCpBnYjORYbEfARsmhW-zauZ01bqQHM';

// Flag to check if we are in mock mode (using placeholders)
export const isMockMode = !getEnvVar('REACT_APP_SUPABASE_URL') || supabaseUrl.includes('placeholder');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
