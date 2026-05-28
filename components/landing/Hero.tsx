
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { HeroVideo } from '../../services/landingService';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface HeroProps {
  onStart: () => void;
  onSeeFeatures: () => void;
  videoConfig?: HeroVideo;
}

const Hero: React.FC<HeroProps> = ({ onStart, onSeeFeatures, videoConfig }) => {
  const getVideoEmbedUrl = () => {
    if (!videoConfig?.url) return null;
    const url = videoConfig.url;

    // YouTube 
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&modestbranding=1&rel=0`;
    }

    // Google Drive
    const gdMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (gdMatch) {
      return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    }

    return null;
  };

  const embedUrl = getVideoEmbedUrl();
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[40%] h-[60%] bg-purple-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[30%] h-[50%] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-purple-100"
        >
          <Star className="w-4 h-4 fill-purple-600" />
          <span>Content Creator ERP ตัวแรกของไทย</span>
        </motion.div>

        <motion.h1 
          className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          จัดการ Content <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500">
            อย่างมืออาชีพ
          </span>
        </motion.h1>

        <motion.p 
          className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-12 font-medium leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
         >
          {BRAND_CONFIG.tagline} ด้วย {BRAND_CONFIG.name} <br />
          {BRAND_CONFIG.description}
         </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <button 
            onClick={onStart}
            className="w-full sm:w-auto bg-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-purple-200 hover:bg-purple-700 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
          >
            เริ่มใช้งานฟรี <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            onClick={onSeeFeatures}
            className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-slate-700" /> ดูฟีเจอร์ทั้งหมด
          </button>
        </motion.div>

        {/* Mockup Preview */}
        <motion.div 
          className="mt-20 relative p-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <div className="bg-slate-50 rounded-[1.5rem] overflow-hidden aspect-[16/9] flex items-center justify-center relative">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`${BRAND_CONFIG.name} Preview`}
              />
            ) : (
              <div className="p-8 text-center">
                <Sparkles className="w-16 h-16 text-purple-200 mb-4 mx-auto animate-bounce" />
                <p className="text-slate-400 font-bold">{BRAND_CONFIG.name} Dashboard Preview</p>
                <div className="mt-8 flex gap-4 justify-center flex-wrap">
                  <div className="w-32 h-4 bg-slate-200 rounded-full animate-pulse" />
                  <div className="w-48 h-4 bg-slate-200 rounded-full animate-pulse delay-75" />
                  <div className="w-24 h-4 bg-slate-200 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            )}
          </div>
          
          {/* Floating tags */}
          <div className="absolute -left-4 top-1/4 bg-white p-4 rounded-xl shadow-xl border border-purple-50 hidden md:block">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500 w-5 h-5" />
              <span className="text-sm font-bold text-slate-700">Calendar Sync</span>
            </div>
          </div>
          <div className="absolute -right-6 bottom-1/4 bg-white p-4 rounded-xl shadow-xl border border-indigo-50 hidden md:block">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-indigo-500 w-5 h-5" />
              <span className="text-sm font-bold text-slate-700">Team Collaboration</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
