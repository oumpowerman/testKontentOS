
import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Loader2, SignalHigh, SignalLow, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateApiKey } from '../../services/geminiService';

interface AIStatusBadgeProps {
    collapsed?: boolean;
}

type AIStatus = 'VALIDATING' | 'ACTIVE' | 'ERROR' | 'OFFLINE';

const AIStatusBadge: React.FC<AIStatusBadgeProps> = ({ collapsed = false }) => {
    const [status, setStatus] = useState<AIStatus>('VALIDATING');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const checkStatus = async () => {
        if (status === 'VALIDATING' && errorMessage === '') {
            // Only skip if it's the very first validation
        } else if (status === 'VALIDATING') {
            return; // Prevent multiple clicks during validation
        }

        if (!process.env.GEMINI_API_KEY) {
            setStatus('OFFLINE');
            setErrorMessage('Missing API Key');
            return;
        }

        setStatus('VALIDATING');
        try {
            const result = await validateApiKey();
            if (result.isValid) {
                setStatus('ACTIVE');
                setErrorMessage('');
            } else {
                setStatus('ERROR');
                setErrorMessage(result.error || 'Connection Failed');
            }
        } catch (err) {
            setStatus('ERROR');
            setErrorMessage('Unexpected Error');
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case 'VALIDATING':
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-200',
                    text: 'text-slate-500',
                    icon: <Loader2 className="w-3 h-3 animate-spin" />,
                    label: 'Validating...',
                    dotColor: 'bg-slate-400'
                };
            case 'ACTIVE':
                return {
                    bg: 'bg-emerald-50/50',
                    border: 'border-emerald-100',
                    text: 'text-emerald-700',
                    icon: <CheckCircle2 className="w-3 h-3" />,
                    label: 'Active',
                    dotColor: 'bg-emerald-500'
                };
            case 'ERROR':
                return {
                    bg: 'bg-orange-50/50',
                    border: 'border-orange-100',
                    text: 'text-orange-700',
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: errorMessage || 'Error',
                    dotColor: 'bg-orange-500'
                };
            case 'OFFLINE':
            default:
                return {
                    bg: 'bg-rose-50/50',
                    border: 'border-rose-100',
                    text: 'text-rose-700',
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: 'Offline',
                    dotColor: 'bg-rose-500'
                };
        }
    };

    const config = getStatusConfig();

    if (collapsed) {
        return (
            <button 
                onClick={checkStatus}
                disabled={status === 'VALIDATING'}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${config.bg} ${config.text} ${status === 'VALIDATING' ? 'cursor-wait' : 'cursor-pointer hover:shadow-md'}`}
                title={`AI System: ${config.label}. Click to re-check.`}
            >
                {status === 'ACTIVE' ? <Sparkles className="w-4 h-4" /> : config.icon}
            </button>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={checkStatus}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300 group relative ${config.bg} ${config.border} ${config.text} ${status === 'VALIDATING' ? 'cursor-wait' : 'cursor-pointer hover:shadow-md hover:border-slate-300'}`}
            title="Click to re-check AI connection"
        >
            <div className={`p-1 rounded-full transition-transform duration-300 ${status === 'ACTIVE' ? 'bg-emerald-500' : status === 'VALIDATING' ? 'bg-slate-400' : status === 'ERROR' ? 'bg-orange-500' : 'bg-rose-500'} text-white group-hover:scale-110`}>
                {status === 'VALIDATING' ? <RefreshCw className="w-3 h-3 animate-spin" /> : config.icon}
            </div>
            
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-60 leading-none">System Status</span>
                <span className="text-xs font-bold leading-tight truncate">
                    {status === 'ACTIVE' ? 'AI Active' : config.label}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {status === 'ACTIVE' ? (
                    <motion.div 
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        className="ml-auto flex items-center gap-1"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </motion.div>
                ) : status === 'ERROR' ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-auto flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:text-orange-500 transition-all duration-300" />
                        <SignalLow className="w-3.5 h-3.5 text-orange-400" />
                    </motion.div>
                ) : status === 'OFFLINE' ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-auto"
                    >
                        <RefreshCw className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-all" />
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Hover Tooltip Hint */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                Click to re-validate connection
            </div>
        </motion.div>
    );
};

export default AIStatusBadge;
