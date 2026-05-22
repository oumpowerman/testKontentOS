
import React, { useState } from 'react';
import { Plus, Trash2, LayoutTemplate, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, Task } from '../types';
import { PLATFORM_ICONS } from '../constants';
import MentorTip from './MentorTip';
import NotificationBellBtn from './NotificationBellBtn';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import ChannelFormModal, { PLATFORM_OPTIONS } from './ChannelFormModal.tsx';

interface ChannelManagerProps {
  tasks: Task[];
  channels: Channel[];
  onAdd: (channel: Channel, file?: File) => Promise<boolean>;
  onEdit: (channel: Channel, file?: File) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onOpenSettings: () => void;
}

const getGlowStyles = (colorClass: string) => {
  const raw = colorClass || '';
  if (raw.includes('red')) return { 
    gradient: 'from-rose-500/10 to-red-500/10 hover:from-rose-500/20 hover:to-red-500/20', 
    shadow: 'shadow-red-500/5 group-hover:shadow-red-500/15', 
    border: 'group-hover:border-rose-200', 
    badgeClass: 'bg-red-50 border-red-200 text-red-600',
    meshBg: 'text-red-500'
  };
  if (raw.includes('orange')) return { 
    gradient: 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20', 
    shadow: 'shadow-orange-500/5 group-hover:shadow-orange-500/15', 
    border: 'group-hover:border-orange-200',
    badgeClass: 'bg-orange-50 border-orange-200 text-orange-600',
    meshBg: 'text-orange-500'
  };
  if (raw.includes('amber')) return { 
    gradient: 'from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20', 
    shadow: 'shadow-amber-500/5 group-hover:shadow-amber-500/15', 
    border: 'group-hover:border-amber-200',
    badgeClass: 'bg-amber-50 border-amber-200 text-amber-600',
    meshBg: 'text-amber-500'
  };
  if (raw.includes('green')) return { 
    gradient: 'from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20', 
    shadow: 'shadow-green-500/5 group-hover:shadow-green-500/15', 
    border: 'group-hover:border-emerald-200',
    badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    meshBg: 'text-emerald-500'
  };
  if (raw.includes('teal')) return { 
    gradient: 'from-teal-500/10 to-cyan-500/10 hover:from-teal-500/20 hover:to-cyan-500/20', 
    shadow: 'shadow-teal-500/5 group-hover:shadow-teal-500/15', 
    border: 'group-hover:border-teal-200',
    badgeClass: 'bg-teal-50 border-teal-200 text-teal-600',
    meshBg: 'text-teal-500'
  };
  if (raw.includes('blue')) return { 
    gradient: 'from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20', 
    shadow: 'shadow-blue-500/5 group-hover:shadow-blue-500/15', 
    border: 'group-hover:border-blue-200',
    badgeClass: 'bg-blue-50 border-blue-200 text-blue-600',
    meshBg: 'text-blue-500'
  };
  if (raw.includes('indigo')) return { 
    gradient: 'from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20', 
    shadow: 'shadow-indigo-500/5 group-hover:shadow-indigo-500/15', 
    border: 'group-hover:border-indigo-200',
    badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    meshBg: 'text-indigo-500'
  };
  if (raw.includes('purple')) return { 
    gradient: 'from-purple-500/10 to-fuchsia-500/10 hover:from-purple-500/20 hover:to-fuchsia-500/20', 
    shadow: 'shadow-purple-500/5 group-hover:shadow-purple-500/15', 
    border: 'group-hover:border-purple-200',
    badgeClass: 'bg-purple-50 border-purple-200 text-purple-600',
    meshBg: 'text-purple-500'
  };
  if (raw.includes('pink')) return { 
    gradient: 'from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-pink-500/20', 
    shadow: 'shadow-pink-500/5 group-hover:shadow-pink-500/15', 
    border: 'group-hover:border-pink-200',
    badgeClass: 'bg-pink-50 border-pink-200 text-pink-500',
    meshBg: 'text-pink-500'
  };
  return { 
    gradient: 'from-slate-500/10 to-zinc-500/10 hover:from-slate-500/20 hover:to-zinc-500/20', 
    shadow: 'shadow-slate-500/5 group-hover:shadow-slate-500/15', 
    border: 'group-hover:border-slate-300',
    badgeClass: 'bg-slate-50 border-slate-200 text-slate-500',
    meshBg: 'text-slate-500'
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

const ChannelManager: React.FC<ChannelManagerProps> = ({ tasks, channels, onAdd, onEdit, onDelete, onOpenSettings }) => {
  const { showConfirm } = useGlobalDialog();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const handleCreateChannel = () => {
    setEditingChannel(null);
    setIsFormOpen(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsFormOpen(true);
  };

  const handleSaveChannel = async (payload: Channel, logoFile?: File | null) => {
    if (editingChannel) {
      return await onEdit(payload, logoFile || undefined);
    } else {
      return await onAdd(payload, logoFile || undefined);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-500 pb-20">
      <MentorTip variant="orange" messages={["อัปโหลด Logo ช่องได้แล้วนะ! จะช่วยให้ดูเป็นทางการขึ้นเยอะเลย", "คลิกที่การ์ดรายการเพื่อแก้ไขข้อมูลได้เลย"]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
             จัดการช่องรายการ (Brands & Shows)
          </h1>
          <p className="text-gray-500 mt-1">
             สร้าง "รายการ" หรือ "แบรนด์" ของคุณ แล้วระบุว่ารายการนี้ลงที่ไหนบ้าง
          </p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={handleCreateChannel}
                className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
                <Plus className="w-5 h-5 mr-2" />
                สร้างรายการใหม่
            </button>
            
            {/* Notification Button */}
            <NotificationBellBtn 
                onClick={() => onOpenSettings()}
                className="hidden md:flex"
            />
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {channels.length === 0 && (
            <motion.div 
              variants={cardVariants}
              className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300"
            >
                <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>ยังไม่มีรายการเลยครับ ลองกด "สร้างรายการใหม่" ดูนะ</p>
            </motion.div>
        )}
        
        {channels.map((channel, idx) => {
            const taskCount = tasks.filter(t => t.channelId === channel.id).length;
            const bgClass = (channel.color || 'bg-gray-100').split(' ')[0].replace('bg-', 'bg-');
            const glow = getGlowStyles(channel.color);
            
            return (
                <motion.div 
                    key={channel.id} 
                    variants={cardVariants}
                    whileHover={{ 
                      y: -6, 
                      scale: 1.01,
                      transition: { type: "spring", stiffness: 400, damping: 18 }
                    }}
                    onClick={() => handleEditChannel(channel)}
                    className={`bg-white rounded-[2rem] border border-slate-200/90 transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer relative shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:border-slate-300`}
                >
                    {/* Ambient background glow corresponding to the brand color class */}
                    <div className={`absolute -inset-[1px] rounded-[2rem] bg-gradient-to-tr ${glow.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 -z-10`} />

                    {/* Color Bar / Banner */}
                    <div className={`h-28 w-full ${bgClass} relative overflow-hidden transition-all duration-500`}>
                        {/* Elegant mesh design on matching background */}
                        <div 
                          className="absolute inset-0 opacity-15"
                          style={{ 
                            backgroundImage: 'radial-gradient(circle, currentColor 1.2px, transparent 1.2px)', 
                            backgroundSize: '10px 10px',
                            color: 'inherit'
                          }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent"></div>
                        
                        {/* Unique structural catalog number */}
                        <span className="absolute top-4 right-5 font-mono text-[9px] font-black uppercase tracking-widest text-slate-800/40 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full z-10 border border-white/40">
                          SHOW-{channel.id.substring(0, 4).toUpperCase()}
                        </span>
                    </div>
                    
                    {/* Logo Overlay with awesome interactive bounce */}
                    <div className="absolute top-14 left-6">
                         <div className="w-20 h-20 rounded-2xl border-[3.5px] border-white shadow-lg bg-white overflow-hidden flex items-center justify-center group-hover:scale-105 group-hover:-rotate-2 group-hover:shadow-indigo-500/10 transition-all duration-300">
                             {channel.logoUrl ? (
                                 <img src={channel.logoUrl} className="w-full h-full object-cover rounded-xl" alt="logo" />
                             ) : (
                                 <div className={`w-full h-full flex items-center justify-center font-black text-2xl uppercase rounded-xl ${channel.color.split(' ')[1]}`}>
                                     {channel.name.substring(0, 2)}
                                 </div>
                             )}
                          </div>
                    </div>
 
                    <div className="p-6 pt-11 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl text-slate-800 line-clamp-1 group-hover:text-slate-900 transition-colors" title={channel.name}>
                                {channel.name}
                            </h3>
                            <div className="flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button 
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if(await showConfirm(`ยืนยันลบรายการ "${channel.name}" ?`)) onDelete(channel.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                                    title="ลบรายการ"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
 
                        {channel.description ? (
                            <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[36px] mt-1 font-medium leading-relaxed">
                                {channel.description}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-300 italic mb-4 line-clamp-2 min-h-[36px] mt-1 leading-relaxed">
                                ไม่มีคำอธิบายช่องเพิ่มเติม
                            </p>
                        )}
 
                        <div className="mt-auto pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-1.5">
                                    {(channel.platforms || []).map(p => {
                                        const Icon = PLATFORM_ICONS[p];
                                        const pColor = PLATFORM_OPTIONS.find(opt => opt.id === p)?.color || 'text-gray-500';
                                        if (!Icon) return null;
                                        return (
                                            <motion.div 
                                                key={p} 
                                                whileHover={{ y: -4, scale: 1.15, rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 12 }}
                                                className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm z-10 cursor-alias"
                                                title={p}
                                            >
                                                <Icon className={`w-4 h-4 ${pColor}`} />
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <motion.span 
                                    whileHover={{ scale: 1.05 }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition-colors shadow-sm outline-none ${glow.badgeClass}`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{taskCount} งาน</span>
                                </motion.span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            );
        })}
      </motion.div>

      {/* Render the extracted Channel Form Modal */}
      <ChannelFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        channel={editingChannel}
        onSave={handleSaveChannel}
      />
    </div>
  );
};

export default ChannelManager;

