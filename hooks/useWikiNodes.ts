
import { useState, useEffect } from 'react';
import { WikiNode, User } from '../types';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { GoogleGenAI } from "@google/genai";

export const useWikiNodes = (currentUser?: User) => {
    const [nodes, setNodes] = useState<WikiNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchNodes = async () => {
        try {
            const { data, error } = await supabase
                .from('wiki_nodes')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (data) {
                setNodes(data.map((n: any) => ({
                    id: n.id,
                    parentId: n.parent_id,
                    title: n.title,
                    description: n.description,
                    content: n.content,
                    type: n.type,
                    icon: n.icon,
                    color: n.color,
                    sortOrder: n.sort_order,
                    createdAt: new Date(n.created_at),
                    updatedAt: new Date(n.updated_at),
                    createdBy: n.created_by
                })));
            }
        } catch (err) {
            console.error('Fetch wiki nodes failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNodes();

        const channel = supabase
            .channel('wiki-nodes-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wiki_nodes' }, () => fetchNodes())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const addNode = async (node: Omit<WikiNode, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
        if (!currentUser) return;
        try {
            const payload = {
                parent_id: node.parentId,
                title: node.title,
                description: node.description,
                content: node.content,
                type: node.type,
                icon: node.icon,
                color: node.color,
                sort_order: node.sortOrder,
                created_by: currentUser.id
            };

            const { data, error } = await supabase.from('wiki_nodes').insert(payload).select().single();
            if (error) throw error;

            if (data) {
                const mapped: WikiNode = {
                    id: data.id,
                    parentId: data.parent_id,
                    title: data.title,
                    description: data.description,
                    content: data.content,
                    type: data.type,
                    icon: data.icon,
                    color: data.color,
                    sortOrder: data.sort_order,
                    createdAt: new Date(data.created_at),
                    updatedAt: new Date(data.updated_at),
                    createdBy: data.created_by
                };
                setNodes(prev => [...prev, mapped]);
            }

            showToast('เพิ่มหัวข้อใหม่เรียบร้อย 🎉', 'success');
        } catch (err: any) {
            showToast('เพิ่มไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const updateNode = async (id: string, updates: Partial<WikiNode>) => {
        try {
            const payload: any = {
                updated_at: new Date().toISOString()
            };
            if (updates.parentId !== undefined) payload.parent_id = updates.parentId;
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.content !== undefined) payload.content = updates.content;
            if (updates.type !== undefined) payload.type = updates.type;
            if (updates.icon !== undefined) payload.icon = updates.icon;
            if (updates.color !== undefined) payload.color = updates.color;
            if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;

            const { error } = await supabase.from('wiki_nodes').update(payload).eq('id', id);
            if (error) throw error;

            setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n));
            showToast('อัปเดตข้อมูลเรียบร้อย ✅', 'success');
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const deleteNode = async (id: string) => {
        try {
            // Recursive delete is handled by DB cascade if set up, 
            // but here we do it manually if needed or just delete the node.
            // Assuming DB has cascade or we just delete the node.
            const { error } = await supabase.from('wiki_nodes').delete().eq('id', id);
            if (error) throw error;

            // Local recursive delete for UI snappiness
            const deleteRecursive = (nodeId: string, currentNodes: WikiNode[]): WikiNode[] => {
                const children = currentNodes.filter(n => n.parentId === nodeId);
                let updated = currentNodes.filter(n => n.id !== nodeId);
                children.forEach(child => {
                    updated = deleteRecursive(child.id, updated);
                });
                return updated;
            };

            setNodes(prev => deleteRecursive(id, prev));
            showToast('ลบหัวข้อเรียบร้อย 🗑️', 'info');
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    const generateWikiContentWithAI = async (prompt: string, type: 'OUTLINE' | 'SOP' | 'FULL'): Promise<string | null> => {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                showToast('API Key ไม่ถูกต้อง', 'error');
                return null;
            }

            const ai = new GoogleGenAI({ apiKey });

            let finalPrompt = '';
            if (type === 'OUTLINE') {
                finalPrompt = `ช่วยวางโครงสร้างเนื้อหา (Outline) สำหรับคู่มือหัวข้อ: "${prompt}" โดยแบ่งเป็นหัวข้อย่อยที่สำคัญและครอบคลุม ให้ส่งกลับมาเป็น HTML (ใช้ h1, h2, h3, ul, li)`;
            } else if (type === 'SOP') {
                finalPrompt = `ช่วยเขียนขั้นตอนการปฏิบัติงาน (SOP) สำหรับหัวข้อ: "${prompt}" โดยระบุขั้นตอน 1, 2, 3 อย่างละเอียดและเข้าใจง่าย ให้ส่งกลับมาเป็น HTML (ใช้ h1, ol, li)`;
            } else {
                finalPrompt = `ช่วยเขียนเนื้อหาคู่มือฉบับเต็ม สำหรับหัวข้อ: "${prompt}" โดยใช้ภาษาที่เป็นทางการแต่เข้าใจง่าย ให้ส่งกลับมาเป็น HTML ที่สวยงาม (ใช้ h1, h2, p, ul, li, blockquote)`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: finalPrompt,
                config: {
                    systemInstruction: "You are a professional technical writer. Always return content in clean HTML format without markdown code blocks (no ```html).",
                }
            });

            return response.text || null;

        } catch (err: any) {
            console.error("AI Error:", err);
            showToast('AI Error: ' + err.message, 'error');
            return null;
        }
    };

    return {
        nodes,
        isLoading,
        addNode,
        updateNode,
        deleteNode,
        generateWikiContentWithAI
    };
};
