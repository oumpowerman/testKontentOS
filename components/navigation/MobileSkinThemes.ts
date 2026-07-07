export interface MobileSkinTheme {
    cardBg: string;
    titleColor: string;
    textColor: string;
    subtextColor: string;
    badgeBg: string;
    blur1Color: string;
    blur2Color: string;
    hpBg: string;
    hpFill: string;
    xpBg: string;
    xpFill: string;
    headerBtnClass: string;
    statLabelColor: string;
}

export const MOBILE_SKIN_THEMES: Record<string, MobileSkinTheme> = {
    'default': {
        cardBg: 'bg-white text-slate-800 border-b border-slate-100',
        titleColor: 'text-slate-900 font-bold',
        textColor: 'text-slate-800',
        subtextColor: 'text-slate-500',
        badgeBg: 'bg-slate-100 border-slate-200 text-slate-600',
        blur1Color: 'bg-indigo-100/40',
        blur2Color: 'bg-purple-100/40',
        hpBg: 'bg-slate-100',
        hpFill: 'bg-gradient-to-r from-rose-500 to-red-500',
        xpBg: 'bg-slate-100',
        xpFill: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        headerBtnClass: 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200 border border-slate-200/50',
        statLabelColor: 'text-slate-500'
    },
    'frame-neo-cyber': {
        cardBg: 'bg-cyan-50/70 text-cyan-900 border-b border-cyan-200/60 backdrop-blur-sm',
        titleColor: 'text-cyan-800 font-mono tracking-tight font-black shadow-cyan-100',
        textColor: 'text-cyan-850',
        subtextColor: 'text-cyan-700/80 font-mono',
        badgeBg: 'bg-cyan-100/60 border-cyan-200/40 text-cyan-800 font-mono',
        blur1Color: 'bg-cyan-200/30',
        blur2Color: 'bg-blue-200/25',
        hpBg: 'bg-cyan-100/50 border border-cyan-200/30',
        hpFill: 'bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
        xpBg: 'bg-cyan-100/50 border border-cyan-200/30',
        xpFill: 'bg-gradient-to-r from-blue-400 to-indigo-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]',
        headerBtnClass: 'bg-cyan-100/70 text-cyan-700 hover:text-cyan-950 hover:bg-cyan-200/80 border border-cyan-200/40',
        statLabelColor: 'text-cyan-700/70 font-mono'
    },
    'frame-pastel-dream': {
        cardBg: 'bg-gradient-to-br from-pink-50/90 via-purple-50/80 to-pink-50/90 text-slate-800 border-b border-pink-200/50',
        titleColor: 'text-pink-600 font-extrabold',
        textColor: 'text-purple-700',
        subtextColor: 'text-purple-600/80',
        badgeBg: 'bg-pink-100/60 border-pink-200/30 text-pink-700',
        blur1Color: 'bg-pink-200/40',
        blur2Color: 'bg-purple-200/45',
        hpBg: 'bg-pink-100/40 border border-pink-200/10',
        hpFill: 'bg-gradient-to-r from-pink-400 to-rose-400 shadow-[0_0_8px_rgba(244,114,182,0.4)]',
        xpBg: 'bg-purple-100/40 border border-purple-200/10',
        xpFill: 'bg-gradient-to-r from-purple-400 to-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
        headerBtnClass: 'bg-pink-100/70 text-pink-700 hover:text-pink-900 hover:bg-pink-200/70 border border-pink-200/30',
        statLabelColor: 'text-pink-700/80'
    },
    'frame-onyx-luxe': {
        cardBg: 'bg-amber-50/80 text-amber-950 border-b border-amber-200/50 backdrop-blur-sm',
        titleColor: 'text-amber-800 font-extrabold tracking-tight',
        textColor: 'text-amber-900',
        subtextColor: 'text-amber-700/80',
        badgeBg: 'bg-amber-100/60 border-amber-200/40 text-amber-800',
        blur1Color: 'bg-amber-200/30',
        blur2Color: 'bg-yellow-200/25',
        hpBg: 'bg-amber-100/40 border border-amber-200/20',
        hpFill: 'bg-gradient-to-r from-amber-500 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
        xpBg: 'bg-amber-100/40 border border-amber-200/20',
        xpFill: 'bg-gradient-to-r from-yellow-400 to-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.3)]',
        headerBtnClass: 'bg-amber-100/70 text-amber-700 hover:text-amber-950 hover:bg-amber-200/80 border border-amber-200/30',
        statLabelColor: 'text-amber-800/60'
    },
    'frame-voltage-overdrive': {
        cardBg: 'bg-violet-50/80 text-violet-950 border-b border-violet-200/50 backdrop-blur-sm',
        titleColor: 'text-violet-800 font-extrabold',
        textColor: 'text-violet-900',
        subtextColor: 'text-violet-700/80',
        badgeBg: 'bg-violet-100/60 border-violet-200/40 text-violet-800',
        blur1Color: 'bg-violet-200/40',
        blur2Color: 'bg-indigo-200/30',
        hpBg: 'bg-violet-100/40 border border-violet-200/20',
        hpFill: 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]',
        xpBg: 'bg-violet-100/40 border border-violet-200/20',
        xpFill: 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.3)]',
        headerBtnClass: 'bg-violet-100/70 text-violet-700 hover:text-violet-950 hover:bg-violet-200/80 border border-violet-200/30',
        statLabelColor: 'text-violet-800/60'
    },
    'frame-zen-harmony': {
        cardBg: 'bg-stone-50/90 text-emerald-900 border-b border-emerald-200/50 backdrop-blur-sm',
        titleColor: 'text-emerald-800 font-bold',
        textColor: 'text-teal-800',
        subtextColor: 'text-teal-700/80',
        badgeBg: 'bg-emerald-100/60 border-emerald-200/30 text-emerald-800',
        blur1Color: 'bg-emerald-200/30',
        blur2Color: 'bg-teal-200/25',
        hpBg: 'bg-emerald-100/40 border border-emerald-200/20',
        hpFill: 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]',
        xpBg: 'bg-emerald-100/40 border border-emerald-200/20',
        xpFill: 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.3)]',
        headerBtnClass: 'bg-emerald-100/70 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/80 border border-emerald-200/30',
        statLabelColor: 'text-emerald-700/60'
    },
    'frame-neko-paradise': {
        cardBg: 'bg-gradient-to-br from-orange-50/90 via-amber-50/80 to-rose-50/90 text-amber-950 border-b border-amber-200/40',
        titleColor: 'text-orange-700 font-extrabold',
        textColor: 'text-rose-850',
        subtextColor: 'text-rose-700/80',
        badgeBg: 'bg-amber-100/60 border-amber-200/30 text-amber-800',
        blur1Color: 'bg-amber-200/35',
        blur2Color: 'bg-rose-200/30',
        hpBg: 'bg-amber-100/40 border border-amber-200/15',
        hpFill: 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]',
        xpBg: 'bg-rose-100/40 border border-rose-200/15',
        xpFill: 'bg-gradient-to-r from-rose-400 to-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
        headerBtnClass: 'bg-amber-100/70 text-amber-700 hover:text-amber-950 hover:bg-amber-200/80 border border-amber-200/30',
        statLabelColor: 'text-rose-700/70'
    }
};
