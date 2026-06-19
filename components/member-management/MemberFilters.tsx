import React, {
    useState,
    useMemo,
    useCallback,
    useRef,
    useEffect,
    KeyboardEvent
} from 'react'
import {
    Search,
    Users,
    UserX,
    Gavel,
    Filter,
    ChevronDown,
    Shield,
    Briefcase,
    CreditCard,
    Activity,
    X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TabType } from './constants'
import { User, Role, MasterOption } from '../../types'

/* ============================= */
/* ======= TYPE DEFINITIONS ===== */
/* ============================= */

type PayrollFilter = 'ALL' | 'READY' | 'NOT_READY'
type WorkloadFilter = 'ALL' | 'HIGH' | 'LOW'

interface MemberFiltersProps {
    currentTab: TabType
    setCurrentTab: (tab: TabType) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    activeCount: number
    inactiveCount: number
    pendingCount: number
    currentUser: User
    onTabChange: (tab: TabType) => void

    positionOptions: MasterOption[]
    selectedPosition: string
    setSelectedPosition: (pos: string) => void

    selectedRole: Role | 'ALL'
    setSelectedRole: (role: Role | 'ALL') => void

    payrollFilter: PayrollFilter
    setPayrollFilter: (filter: PayrollFilter) => void

    workloadFilter: WorkloadFilter
    setWorkloadFilter: (filter: WorkloadFilter) => void
}

/* ============================= */
/* ===== ENTERPRISE VERSION ===== */
/* ============================= */

export const MemberFilters = React.memo(React.forwardRef<HTMLDivElement, MemberFiltersProps>((props, ref) => {
    const {
        currentTab,
        setCurrentTab,
        searchQuery,
        setSearchQuery,
        activeCount,
        inactiveCount,
        pendingCount,
        currentUser,
        onTabChange,
        positionOptions,
        selectedPosition,
        setSelectedPosition,
        selectedRole,
        setSelectedRole,
        payrollFilter,
        setPayrollFilter,
        workloadFilter,
        setWorkloadFilter
    } = props;

    const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false)
    const advancedButtonRef = useRef<HTMLButtonElement | null>(null)
    const advancedPanelRef = useRef<HTMLDivElement | null>(null)

    /* ============================= */
    /* ======= MEMOIZED TABS ======= */
    /* ============================= */

    const tabs = useMemo(() => {
        const baseTabs = [
            {
                id: 'ACTIVE' as TabType,
                label: `Active (${activeCount})`,
                icon: Users,
                color: 'text-indigo-600',
                activeBg: 'bg-white'
            },
            {
                id: 'PENDING' as TabType,
                label: `Pending (${pendingCount})`,
                icon: Activity,
                color: 'text-orange-500',
                activeBg: 'bg-white'
            },
            {
                id: 'INACTIVE' as TabType,
                label: `Inactive (${inactiveCount})`,
                icon: UserX,
                color: 'text-red-500',
                activeBg: 'bg-white'
            }
        ]

        if (currentUser.role === 'ADMIN') {
            baseTabs.push({
                id: 'GAME_MASTER' as TabType,
                label: 'Game Master',
                icon: Gavel,
                color: 'text-white',
                activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600'
            })
        }

        return baseTabs
    }, [activeCount, inactiveCount, pendingCount, currentUser.role])

    /* ============================= */
    /* ===== ACTIVE FILTER CHECK === */
    /* ============================= */

    const hasActiveFilters = useMemo(() => {
        return (
            selectedPosition !== 'ALL' ||
            selectedRole !== 'ALL' ||
            payrollFilter !== 'ALL' ||
            workloadFilter !== 'ALL'
        )
    }, [selectedPosition, selectedRole, payrollFilter, workloadFilter])

    /* ============================= */
    /* ===== EVENT HANDLERS ======== */
    /* ============================= */

    const handleTabClick = useCallback((tab: TabType) => {
        setCurrentTab(tab)
        onTabChange(tab)
    }, [setCurrentTab, onTabChange])

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }, [setSearchQuery])

    const toggleAdvanced = useCallback(() => {
        setIsAdvancedOpen(prev => !prev)
    }, [])

    /* ============================= */
    /* ===== KEYBOARD NAVIGATION === */
    /* ============================= */

    const handleTabKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (e.key === 'ArrowRight') {
            const next = (index + 1) % tabs.length
            handleTabClick(tabs[next].id)
        }
        if (e.key === 'ArrowLeft') {
            const prev = (index - 1 + tabs.length) % tabs.length
            handleTabClick(tabs[prev].id)
        }
    }, [tabs, handleTabClick])

    /* ============================= */
    /* ===== CLICK OUTSIDE CLOSE === */
    /* ============================= */

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isAdvancedOpen &&
                advancedPanelRef.current &&
                !advancedPanelRef.current.contains(event.target as Node) &&
                !advancedButtonRef.current?.contains(event.target as Node)
            ) {
                setIsAdvancedOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isAdvancedOpen])

    /* ============================= */
    /* ========== RENDER =========== */
    /* ============================= */

    return (
        <div ref={ref} className="bg-white shrink-0 border-b border-gray-100 shadow-sm relative z-50">

            {/* ================= TABS ================= */}

            <div className="px-4 sm:px-8 py-4 flex flex-col lg:flex-row gap-4 items-center justify-between">

                <div
                    role="tablist"
                    aria-label="Member Status Tabs"
                    className="flex p-1 bg-gray-100 rounded-2xl relative w-full sm:w-auto overflow-x-auto no-scrollbar min-w-max"
                >
                    {tabs.map((tab, index) => {
                        const Icon = tab.icon
                        const isActive = currentTab === tab.id

                        return (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={isActive}
                                aria-pressed={isActive}
                                tabIndex={isActive ? 0 : -1}
                                onKeyDown={(e) => handleTabKeyDown(e, index)}
                                onClick={() => handleTabClick(tab.id)}
                                className={`relative z-10 flex-1 sm:flex-none whitespace-nowrap px-6 sm:px-10 py-3 rounded-xl text-[11px] sm:text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 min-w-[110px] sm:min-w-[140px] ${
                                    isActive
                                        ? tab.color
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="memberFiltersActiveTab"
                                        className={`absolute inset-0 rounded-xl shadow-md ${tab.activeBg}`}
                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <span className="relative z-20 flex items-center gap-2">
                                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'animate-bounce' : ''}`} />
                                    {tab.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* ================= SEARCH + ADVANCED ================= */}

                <div className="flex items-center gap-3 w-full lg:w-auto">

                    <div className="relative flex-1 lg:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            aria-label="Search Members"
                            placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-400 outline-none transition-all font-medium"
                        />
                    </div>

                    <button                        
                        ref={advancedButtonRef}
                        aria-expanded={isAdvancedOpen}
                        aria-controls="advanced-filter-panel"
                        onClick={toggleAdvanced}
                        className={`relative p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
                            isAdvancedOpen
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Advanced</span>

                        {hasActiveFilters && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}

                        <ChevronDown
                            className={`w-3 h-3 transition-transform duration-300 ${
                                isAdvancedOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* ================= ADVANCED PANEL ================= */}

            <AnimatePresence mode="wait">
                {isAdvancedOpen && (
                    <motion.div
                        id="advanced-filter-panel"
                        ref={advancedPanelRef}
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-2xl z-[100] overflow-hidden"
                    >
                        <div className="px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 bg-gradient-to-b from-white to-gray-50/50">

                            {/* ===== POSITION FILTER ===== */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Briefcase className="w-3 h-3" />
                                    Position
                                </label>

                                <div className="relative group/select">
                                    <select
                                        value={selectedPosition}
                                        onChange={(e) => setSelectedPosition(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none appearance-none cursor-pointer pr-8 transition-all group-hover/select:border-indigo-300"
                                    >
                                        <option value="ALL">All Positions</option>
                                        {positionOptions.map(opt => (
                                            <option key={opt.id} value={opt.label}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none group-hover/select:text-indigo-500 transition-colors" />
                                </div>
                            </div>

                            {/* ===== ROLE FILTER ===== */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" />
                                    Role
                                </label>

                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    {(['ALL', 'ADMIN', 'MEMBER'] as const).map(r => (
                                        <button
                                            key={r}
                                            aria-pressed={selectedRole === r}
                                            onClick={() => setSelectedRole(r)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                                selectedRole === r
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ===== PAYROLL FILTER ===== */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard className="w-3 h-3" />
                                    Payroll Status
                                </label>

                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    {(['ALL', 'READY', 'NOT_READY'] as const).map(p => (
                                        <button
                                            key={p}
                                            aria-pressed={payrollFilter === p}
                                            onClick={() => setPayrollFilter(p)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                                payrollFilter === p
                                                    ? 'bg-emerald-500 text-white shadow-md'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {p === 'NOT_READY' ? 'MISSING' : p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ===== WORKLOAD FILTER ===== */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3 h-3" />
                                    Workload
                                </label>

                                <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                                    {(['ALL', 'HIGH', 'LOW'] as const).map(w => (
                                        <button
                                            key={w}
                                            aria-pressed={workloadFilter === w}
                                            onClick={() => setWorkloadFilter(w)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                                                workloadFilter === w
                                                    ? 'bg-amber-500 text-white shadow-md'
                                                    : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ===== CLEAR FILTERS ===== */}
                            {hasActiveFilters && (
                                <div className="lg:col-span-4 flex justify-end pt-2 border-t border-gray-100 mt-2">
                                    <button
                                        onClick={() => {
                                            setSelectedPosition('ALL')
                                            setSelectedRole('ALL')
                                            setPayrollFilter('ALL')
                                            setWorkloadFilter('ALL')
                                        }}
                                        className="text-[10px] font-black text-red-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                        CLEAR ALL FILTERS
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}))

MemberFilters.displayName = 'MemberFilters'