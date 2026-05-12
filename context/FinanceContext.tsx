
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { FinanceTransaction, FinanceStats, ShootTrip, PotentialTrip, Task } from '../types';
import { useToast } from './ToastContext';
import { format } from 'date-fns';
import { useMasterData } from '../hooks/useMasterData';

const PAGE_SIZE = 15;

interface FinanceContextType {
    transactions: FinanceTransaction[];
    stats: FinanceStats;
    trips: ShootTrip[];
    potentialTrips: PotentialTrip[];
    isLoading: boolean;
    isStatsLoading: boolean;
    totalCount: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    
    fetchStats: (startDate: Date, endDate: Date) => Promise<void>;
    fetchTransactions: (startDate: Date, endDate: Date, pageNum: number) => Promise<void>;
    fetchTrips: () => Promise<void>;
    convertGroupToTrip: (group: PotentialTrip) => Promise<boolean>;
    updateTrip: (id: string, updates: Partial<ShootTrip>) => Promise<boolean>;
    deleteTrip: (id: string) => Promise<boolean>;
    addTransaction: (data: Partial<FinanceTransaction>, userId?: string) => Promise<boolean>;
    deleteTransaction: (id: string) => Promise<void>;
    refreshAll: (startDate: Date, endDate: Date, currentPage: number) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { masterOptions } = useMasterData();
    const { showToast } = useToast();

    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [stats, setStats] = useState<FinanceStats>({ totalIncome: 0, totalExpense: 0, netProfit: 0, chartData: [] });
    const [trips, setTrips] = useState<ShootTrip[]>([]);
    const [potentialTrips, setPotentialTrips] = useState<PotentialTrip[]>([]); 
    
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingTrips, setIsLoadingTrips] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const mapTransaction = useCallback((item: any): FinanceTransaction => {
        const catOpt = masterOptions.find(o => o.key === item.category_key && (o.type === 'FINANCE_IN_CAT' || o.type === 'FINANCE_OUT_CAT'));
        
        return {
            id: item.id,
            type: item.type,
            categoryKey: item.category_key,
            amount: Number(item.amount),
            date: new Date(item.date),
            name: item.name,
            description: item.description,
            projectId: item.project_id,
            shootTripId: item.shoot_trip_id,
            assetType: item.asset_type || 'NONE',
            receiptUrl: item.receipt_url,
            createdBy: item.created_by,
            createdAt: new Date(item.created_at),
            
            vatRate: Number(item.vat_rate || 0),
            vatAmount: Number(item.vat_amount || 0),
            whtRate: Number(item.wht_rate || 0),
            whtAmount: Number(item.wht_amount || 0),
            netAmount: Number(item.net_amount || 0),
            taxInvoiceNo: item.tax_invoice_no,
            entityName: item.entity_name,
            taxId: item.tax_id,
            targetUserId: item.target_user_id,

            projectTitle: item.contents?.title,
            creator: item.profiles ? { name: item.profiles.full_name, avatarUrl: item.profiles.avatar_url } : undefined,
            targetUser: item.target_user ? { name: item.target_user.full_name, avatarUrl: item.target_user.avatar_url } : undefined,
            categoryLabel: catOpt?.label || item.category_key,
            categoryColor: catOpt?.color || 'bg-gray-100 text-gray-500'
        };
    }, [masterOptions]);

    const fetchStats = useCallback(async (startDate: Date, endDate: Date) => {
        setIsLoadingStats(true);
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');

        try {
            const { data, error } = await supabase.rpc('get_finance_stats', { 
                start_date: start, 
                end_date: end 
            });

            if (error) {
                const { data: rawData } = await supabase
                    .from('finance_transactions')
                    .select('amount, net_amount, type, category_key')
                    .gte('date', start)
                    .lte('date', end);
                
                if (rawData) {
                     let income = 0, expense = 0;
                     const expenseByCat: Record<string, number> = {};
                     rawData.forEach((t: any) => {
                         const val = Number(t.net_amount || t.amount);
                         if (t.type === 'INCOME') income += val;
                         else {
                             expense += val;
                             expenseByCat[t.category_key] = (expenseByCat[t.category_key] || 0) + val;
                         }
                     });
                     
                     const chartData = Object.entries(expenseByCat).map(([key, val]) => {
                        const opt = masterOptions.find(o => o.key === key);
                        return { name: opt?.label || key, value: val, color: '#8884d8' };
                     });

                     setStats({ totalIncome: income, totalExpense: expense, netProfit: income - expense, chartData });
                }
            } else {
                const chartData = (data.expense_by_category || []).map((item: any) => {
                    const opt = masterOptions.find(o => o.key === item.category_key);
                    return { name: opt?.label || item.category_key, value: item.value, color: '#8884d8' };
                });

                setStats({
                    totalIncome: data.total_income,
                    totalExpense: data.total_expense,
                    netProfit: data.net_profit,
                    chartData
                });
            }
        } catch (err) {
            console.error("Stats error", err);
        } finally {
            setIsLoadingStats(false);
        }
    }, [masterOptions]);

    const fetchTransactions = useCallback(async (startDate: Date, endDate: Date, pageNum: number) => {
        if (masterOptions.length === 0) return;
        setIsLoadingList(true);
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');
        const from = (pageNum - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            const { data, count, error } = await supabase
                .from('finance_transactions')
                .select(`*, profiles:created_by (full_name, avatar_url), target_user:target_user_id (full_name, avatar_url), contents (title)`, { count: 'exact' })
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false })
                .range(from, to);

            if (error) throw error;
            if (data) {
                setTransactions(data.map(mapTransaction));
                setTotalCount(count || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingList(false);
        }
    }, [masterOptions, mapTransaction]);

    const fetchTrips = useCallback(async () => {
        setIsLoadingTrips(true);
        try {
            const { data: tripsData, error } = await supabase
                .from('shoot_trips')
                .select(`*, finance_transactions (id, amount, net_amount, type, category_key, name), contents (id, title, content_formats, status, shoot_date, shoot_location)`)
                .order('date', { ascending: false });

            if (error) throw error;
            if (tripsData) {
                const mapped: ShootTrip[] = tripsData.map((t: any) => {
                    const totalCost = t.finance_transactions?.reduce((sum: number, tx: any) => 
                        tx.type === 'EXPENSE' ? sum + Number(tx.net_amount || tx.amount) : sum, 0) || 0;
                    const clipCount = t.contents?.length || 0;
                    
                    return {
                        id: t.id,
                        title: t.title,
                        locationName: t.location_name,
                        date: new Date(t.date),
                        status: t.status,
                        totalCost,
                        clipCount,
                        avgCostPerClip: clipCount > 0 ? totalCost / clipCount : 0,
                        expenses: t.finance_transactions || [],
                        contents: t.contents || []
                    };
                });
                setTrips(mapped);
            }

            const { data: unlinkedData } = await supabase
                .from('contents')
                .select('id, title, shoot_date, shoot_location, content_formats, status')
                .is('shoot_trip_id', null)
                .not('shoot_date', 'is', null)
                .not('shoot_location', 'is', null);

            if (unlinkedData && unlinkedData.length > 0) {
                const grouped: Record<string, PotentialTrip> = {};
                
                unlinkedData.forEach((c: any) => {
                    if (!c.shoot_date || !c.shoot_location) return;
                    
                    const dateStr = format(new Date(c.shoot_date), 'yyyy-MM-dd');
                    const loc = c.shoot_location.trim();
                    const key = `${dateStr}_${loc.toLowerCase()}`;

                    if (!grouped[key]) {
                        grouped[key] = {
                            key,
                            date: new Date(c.shoot_date),
                            locationName: loc,
                            contents: [],
                            suggestedTitle: `ออกกอง ${loc}`
                        };
                    }
                    grouped[key].contents.push({
                        id: c.id,
                        title: c.title,
                        status: c.status,
                        contentFormats: c.content_formats || [],
                        type: 'CONTENT',
                        description: '',
                        priority: 'MEDIUM',
                        tags: [],
                        startDate: new Date(c.shoot_date),
                        endDate: new Date(c.shoot_date),
                        assigneeIds: [],
                        isUnscheduled: false
                    } as Task);
                });

                setPotentialTrips(Object.values(grouped).sort((a,b) => b.date.getTime() - a.date.getTime()));
            } else {
                setPotentialTrips([]);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingTrips(false);
        }
    }, []);

    const convertGroupToTrip = async (group: PotentialTrip) => {
        try {
            const { data: newTrip, error: createError } = await supabase
                .from('shoot_trips')
                .insert({
                    title: group.suggestedTitle,
                    location_name: group.locationName,
                    date: format(group.date, 'yyyy-MM-dd'),
                    status: 'PLANNED'
                })
                .select()
                .single();

            if (createError) throw createError;

            const contentIds = group.contents.map(c => c.id);
            const { error: updateError } = await supabase
                .from('contents')
                .update({ 
                    shoot_trip_id: newTrip.id,
                    shoot_location: group.locationName,
                    shoot_date: format(group.date, 'yyyy-MM-dd')
                })
                .in('id', contentIds);

            if (updateError) throw updateError;

            showToast(`รวม ${contentIds.length} รายการเข้ากองถ่ายใหม่เรียบร้อย 🎉`, 'success');
            fetchTrips();
            return true;
        } catch (err: any) {
            showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            return false;
        }
    };

    const updateTrip = async (id: string, updates: Partial<ShootTrip>) => {
        try {
            const payload: any = {};
            if (updates.title) payload.title = updates.title;
            if (updates.locationName) payload.location_name = updates.locationName;
            if (updates.date) payload.date = format(updates.date, 'yyyy-MM-dd');
            if (updates.status) payload.status = updates.status;

            const { error } = await supabase
                .from('shoot_trips')
                .update(payload)
                .eq('id', id);

            if (error) throw error;
            showToast('อัปเดตข้อมูลกองถ่ายเรียบร้อย ✅', 'success');
            fetchTrips();
            return true;
        } catch (err: any) {
            showToast('อัปเดตไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteTrip = async (id: string) => {
        try {
            const { error } = await supabase
                .from('shoot_trips')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('ลบกองถ่ายเรียบร้อย 🗑️', 'info');
            fetchTrips();
            return true;
        } catch (err: any) {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const addTransaction = async (data: Partial<FinanceTransaction>, userId?: string) => {
        try {
            const payload = {
                type: data.type,
                category_key: data.categoryKey,
                amount: data.amount,
                date: data.date ? format(data.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                name: data.name,
                description: data.description,
                project_id: data.projectId || null,
                shoot_trip_id: data.shootTripId || null,
                asset_type: data.assetType || 'NONE',
                receipt_url: data.receiptUrl || null,
                created_by: userId,
                target_user_id: data.targetUserId || null,
                vat_rate: data.vatRate || 0,
                vat_amount: data.vatAmount || 0,
                wht_rate: data.whtRate || 0,
                wht_amount: data.whtAmount || 0,
                net_amount: data.netAmount || data.amount, 
                tax_invoice_no: data.taxInvoiceNo || null,
                entity_name: data.entityName || null,
                tax_id: data.taxId || null
            };

            const { error } = await supabase.from('finance_transactions').insert(payload);
            if (error) throw error;
            showToast('บันทึกรายการเรียบร้อย 💰', 'success');
            return true;
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
            return false;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
            if (error) throw error;
            showToast('ลบรายการแล้ว', 'info');
        } catch (err) {
            showToast('ลบไม่สำเร็จ', 'error');
        }
    };

    const refreshAll = useCallback((startDate: Date, endDate: Date, currentPage: number) => {
        fetchStats(startDate, endDate);
        fetchTransactions(startDate, endDate, currentPage);
        fetchTrips();
    }, [fetchStats, fetchTransactions, fetchTrips]);

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('finance-realtime-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => {
                // We need the current dates to refresh correctly
                // Since this useEffect doesn't track startDate/endDate directly to avoid loops,
                // we'll rely on the fact that most changes happen in the current view
                // or we can just refresh trips which is global
                fetchTrips();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shoot_trips' }, () => fetchTrips())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, () => fetchTrips())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchTrips]);

    const value = useMemo(() => ({
        transactions,
        stats,
        trips,
        potentialTrips,
        isLoading: isLoadingList || isLoadingStats || isLoadingTrips,
        isStatsLoading: isLoadingStats,
        totalCount,
        fetchStats,
        fetchTransactions,
        fetchTrips,
        convertGroupToTrip,
        updateTrip,
        deleteTrip,
        addTransaction,
        deleteTransaction,
        refreshAll,
        currentPage,
        setCurrentPage
    }), [
        transactions,
        stats,
        trips,
        potentialTrips,
        isLoadingList,
        isLoadingStats,
        isLoadingTrips,
        totalCount,
        fetchStats,
        fetchTransactions,
        fetchTrips,
        convertGroupToTrip,
        updateTrip,
        deleteTrip,
        addTransaction,
        deleteTransaction,
        refreshAll,
        currentPage,
        setCurrentPage
    ]);

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};

export const useFinanceContext = () => {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error('useFinanceContext must be used within a FinanceProvider');
    }
    return context;
};
