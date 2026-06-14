
import React, { useMemo } from 'react';
import { PenTool, Eraser, FileText, Edit3, Type, Search, Coffee, Paperclip, Lamp, StickyNote, CheckCircle2, Target, Rocket, Zap, TrendingUp, Trophy, Activity, Sparkles } from 'lucide-react';
import SeasonRain from './backgrounds/SeasonRain';
import SeasonSnow from './backgrounds/SeasonSnow';
import SeasonSummer from './backgrounds/SeasonSummer';
import SeasonAutumn from './backgrounds/SeasonAutumn';
import BeachOcean from './backgrounds/BeachOcean';
import RainbowSky from './backgrounds/RainbowSky';

export type BackgroundTheme = 
  | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
  | 'pastel-red' | 'pastel-orange' | 'pastel-yellow' | 'pastel-green' | 'pastel-blue' 
  | 'pastel-indigo' | 'pastel-purple' | 'pastel-pink' | 'pastel-rose' | 'pastel-teal'
  | 'pastel-cyan' | 'pastel-sky' | 'pastel-emerald' | 'pastel-lime' | 'pastel-amber'
  | 'pastel-stone' | 'pastel-slate' | 'pastel-zinc' | 'neutral' | 'script' | 'inspector' | 'productivity' | 'rainbow'
  | 'season-rain' | 'season-snow' | 'season-summer' | 'season-autumn' | 'beach-ocean' | 'rainbow-sky';

interface AppBackgroundProps {
    theme?: BackgroundTheme;
    pattern?: 'grid' | 'dots' | 'icons' | 'none';
    customBgUrl?: string; // Support for custom wallpaper/scenery background images
    className?: string;
    children?: React.ReactNode;
}

const AppBackground: React.FC<AppBackgroundProps> = ({ 
    theme = 'neutral', 
    pattern = 'grid', 
    customBgUrl,
    className = '', 
    children 
}) => {
    const themeConfig = useMemo(() => {
        const configs: Record<BackgroundTheme, string> = {
            sunday: 'from-red-50 to-rose-100',
            monday: 'from-yellow-50 to-amber-100',
            tuesday: 'from-pink-50 to-rose-100',
            wednesday: 'from-green-50 to-emerald-100',
            thursday: 'from-orange-50 to-amber-100',
            friday: 'from-blue-50 to-sky-100',
            saturday: 'from-purple-50 to-violet-100',
            'pastel-red': 'from-red-50 to-red-100',
            'pastel-orange': 'from-orange-50 to-orange-100',
            'pastel-yellow': 'from-yellow-50 to-yellow-100',
            'pastel-green': 'from-green-50 to-green-100',
            'pastel-blue': 'from-blue-50 to-blue-100',
            'pastel-indigo': 'from-indigo-50 to-indigo-100',
            'pastel-purple': 'from-purple-50 to-purple-100',
            'pastel-pink': 'from-pink-50 to-pink-100',
            'pastel-rose': 'from-rose-50 to-rose-100',
            'pastel-teal': 'from-teal-50 to-teal-100',
            'pastel-cyan': 'from-cyan-50 to-cyan-100',
            'pastel-sky': 'from-sky-50 to-sky-100',
            'pastel-emerald': 'from-emerald-50 to-emerald-100',
            'pastel-lime': 'from-lime-50 to-lime-100',
            'pastel-amber': 'from-amber-50 to-amber-100',
            'pastel-stone': 'from-stone-50 to-stone-100',
            'pastel-slate': 'from-slate-50 to-slate-100',
            'pastel-zinc': 'from-zinc-50 to-zinc-100',
            neutral: 'from-gray-50 to-slate-100',
            script: 'from-amber-200 via-orange-100 to-yellow-300', // Base vibrant
            inspector: 'from-slate-900 via-slate-800 to-slate-950', // Dark professional desk
            productivity: 'from-slate-950 via-slate-900 to-emerald-950/30', // Strategic Mission Control
            rainbow: 'from-pink-100 via-indigo-50 to-sky-100', // Soft pastel rainbow base
            'season-rain': 'from-slate-800 via-slate-900 to-slate-950', // base for rain
            'season-snow': 'from-slate-50 via-sky-50 to-indigo-50/50', // base for snow
            'season-summer': 'from-amber-50 via-yellow-50 to-orange-50', // base for summer
            'season-autumn': 'from-orange-50 via-red-50 to-amber-100', // base for autumn
            'beach-ocean': 'from-sky-300 via-sky-100 to-amber-50', // base for beach
            'rainbow-sky': 'from-pink-100 via-purple-100 to-sky-100', // base for rainbow sky
        };

        if (theme === 'script') {
            // Randomly pick a slightly different warm gradient for "script" theme
            const scriptVariants = [
                'from-amber-200 via-orange-100 to-yellow-300',
                'from-orange-100 via-amber-50 to-yellow-200',
                'from-yellow-200 via-orange-100 to-amber-100',
                'from-amber-100 via-yellow-50 to-orange-200'
            ];
            return scriptVariants[Math.floor(Math.random() * scriptVariants.length)];
        }

        return configs[theme] || configs.neutral;
    }, [theme]);

    const patternStyle = useMemo(() => {
        if (pattern === 'grid') {
            return {
                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                opacity: 0.03
            };
        }
        if (pattern === 'dots') {
            return {
                backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
                opacity: 0.05
            };
        }
        if (pattern === 'icons') {
            // Subtle icons pattern using a small repeating SVG or just a different grid
            return {
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                opacity: 0.3
            };
        }
        return {};
    }, [pattern]);

    // Use state for decorative elements to ensure they are generated once per mount
    const [elements, setElements] = React.useState<any[]>([]);
    const [scribbles, setScribbles] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (theme !== 'script' && theme !== 'inspector' && theme !== 'productivity' && theme !== 'rainbow') {
            setElements([]);
            setScribbles([]);
            return;
        }

        if (theme === 'script' || theme === 'rainbow') {
            const icons = theme === 'rainbow' 
                ? [Sparkles, Rocket, Zap, Coffee, Target, Trophy] 
                : [PenTool, Eraser, FileText, Edit3, Type];
            
            const colors = theme === 'rainbow'
                ? ['text-pink-400', 'text-sky-400', 'text-indigo-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400']
                : [
                    'text-amber-500', 'text-orange-500', 'text-yellow-600', 
                    'text-red-500', 'text-blue-500', 'text-green-500', 
                    'text-purple-500', 'text-pink-500', 'text-teal-500',
                    'text-indigo-500', 'text-emerald-500', 'text-cyan-500'
                ];

            const newElements = Array.from({ length: 20 }).map((_, i) => ({
                id: i,
                Icon: icons[Math.floor(Math.random() * icons.length)],
                top: `${Math.random() * 95}%`,
                left: `${Math.random() * 95}%`,
                size: Math.floor(Math.random() * 60) + 40,
                rotate: Math.floor(Math.random() * 360),
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: (Math.random() * 0.4) + 0.1,
                animate: Math.random() > 0.6 ? 'animate-pulse' : ''
            }));

            const newScribbles = Array.from({ length: 12 }).map((_, i) => ({
                id: i,
                top: `${Math.random() * 95}%`,
                left: `${Math.random() * 95}%`,
                width: `${Math.random() * 250 + 100}px`,
                rotate: Math.floor(Math.random() * 40 - 20),
                opacity: (Math.random() * 0.3) + 0.2
            }));

            setElements(newElements);
            setScribbles(newScribbles);
        } else if (theme === 'inspector') {
            const icons = [Search, Coffee, Paperclip, Lamp, StickyNote, CheckCircle2, FileText, Edit3];
            const colors = ['text-slate-400', 'text-slate-500', 'text-indigo-400/30', 'text-amber-500/10'];
            
            const newElements = Array.from({ length: 15 }).map((_, i) => ({
                id: i,
                Icon: icons[Math.floor(Math.random() * icons.length)],
                top: `${Math.random() * 90}%`,
                left: `${Math.random() * 90}%`,
                size: Math.floor(Math.random() * 100) + 60,
                rotate: Math.floor(Math.random() * 60 - 30),
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: (Math.random() * 0.15) + 0.05,
                animate: ''
            }));

            setElements(newElements);
            setScribbles([]);
        } else if (theme === 'productivity') {
            const icons = [Target, Rocket, Zap, TrendingUp, Trophy, Activity, FileText, Edit3];
            const colors = ['text-emerald-400/20', 'text-indigo-400/20', 'text-slate-500/20', 'text-emerald-500/10'];
            
            const newElements = Array.from({ length: 15 }).map((_, i) => ({
                id: i,
                Icon: icons[Math.floor(Math.random() * icons.length)],
                top: `${Math.random() * 90}%`,
                left: `${Math.random() * 90}%`,
                size: Math.floor(Math.random() * 100) + 60,
                rotate: Math.floor(Math.random() * 60 - 30),
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: (Math.random() * 0.15) + 0.05,
                animate: Math.random() > 0.8 ? 'animate-pulse' : ''
            }));

            setElements(newElements);
            setScribbles([]);
        }
    }, [theme]);

    return (
        <div className={`relative w-auto min-h-screen flex flex-col overflow-x-hidden max-w-full ${className}`}>
            {/* Background Layer */}
            {customBgUrl ? (
                <div 
                    className="fixed inset-0 bg-cover bg-center transition-all duration-1000 pointer-events-none z-0"
                    style={{ backgroundImage: `url(${customBgUrl})` }}
                >
                    <div className="absolute inset-0 bg-white/35 backdrop-blur-[2px] transition-all duration-1000" />
                </div>
            ) : (
                <div 
                    className={`fixed inset-0 bg-gradient-to-br ${themeConfig} transition-colors duration-1000 pointer-events-none z-0`} 
                />
            )}
            
            {/* Pattern Layer */}
            {(!theme.startsWith('season-')) && theme !== 'beach-ocean' && theme !== 'rainbow-sky' && !customBgUrl && (
                <div className="fixed inset-0 pointer-events-none z-0" style={{ ...patternStyle }} />
            )}

            {/* Seasonal Background Layers */}
            {theme === 'season-rain' && <SeasonRain />}
            {theme === 'season-snow' && <SeasonSnow />}
            {theme === 'season-summer' && <SeasonSummer />}
            {theme === 'season-autumn' && <SeasonAutumn />}
            {theme === 'beach-ocean' && <BeachOcean />}
            {theme === 'rainbow-sky' && <RainbowSky />}
            
            {/* Decorative Elements for Script, Inspector, Productivity & Rainbow Theme */}
            {(theme === 'script' || theme === 'inspector' || theme === 'productivity' || theme === 'rainbow') && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    {/* Desk Lamp Glow for Inspector */}
                    {theme === 'inspector' && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                    )}

                    {/* Mission Control Glow for Productivity */}
                    {theme === 'productivity' && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                    )}

                    {/* Rainbow Glows */}
                    {theme === 'rainbow' && (
                        <>
                            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-pink-200/20 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-200/20 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />
                            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-100/10 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
                        </>
                    )}
                    
                    {elements.map((el) => (
                        <el.Icon 
                            key={el.id}
                            className={`absolute ${el.color} ${el.animate}`}
                            style={{
                                top: el.top,
                                left: el.left,
                                width: el.size,
                                height: el.size,
                                transform: `rotate(${el.rotate}deg)`,
                                opacity: el.opacity
                            }}
                        />
                    ))}
                    
                    {/* Floating Scribbles */}
                    {scribbles.map((s) => (
                        <div 
                            key={`scribble-${s.id}`}
                            className="absolute border-b-2 border-amber-500/30 rounded-full"
                            style={{
                                top: s.top,
                                left: s.left,
                                width: s.width,
                                height: '1px',
                                transform: `rotate(${s.rotate}deg)`,
                                opacity: s.opacity
                            }}
                        ></div>
                    ))}
                </div>
            )}

            <div className="relative">
                {children}
            </div>
        </div>
    );
};

export default AppBackground;
