-- ========================================================
-- OVERTIME SYSTEM SCHEMA (ot_requests)
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Create Overtime Requests Table
CREATE TABLE IF NOT EXISTS public.ot_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,                         -- วันที่ขอทำ OT
    start_time TIME NOT NULL,                  -- เวลาเริ่มต้นขอ OT (เช่น 18:30)
    end_time TIME NOT NULL,                    -- เวลาสิ้นสุดขอ OT (เช่น 20:30)
    duration_hours DECIMAL(4, 2) NOT NULL,     -- จำนวนชั่วโมงที่ขอจริง (เช่น 2.00)
    reason TEXT NOT NULL,                      -- ชี้แจงภารกิจด่วนที่ต้องทำ
    type VARCHAR(30) NOT NULL,                 -- NORMAL_DAY (1.5x), HOLIDAY (2.0x), HOLIDAY_OVERTIME (3.0x)
    status VARCHAR(20) DEFAULT 'PENDING',       -- PENDING, APPROVED, REJECTED
    approved_by UUID REFERENCES public.profiles(id), -- ผู้มีอำนาจอนุมัติ (Admin/Manager)
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,                     -- เหตุผลในกรณีที่ปฏิเสธคำขอ
    base_salary_at_time DECIMAL(10, 2),        -- บันทึกเงินเดือน ณ วันที่ทำรายการ (เพื่อไม่ให้สูญเสียประวัติเมื่อเงินเดือนขึ้น)
    computed_payout DECIMAL(10, 2) DEFAULT 0,  -- ยอดเงินค่า OT สรุปสุดท้ายที่ได้รับการอนุมัติ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    
);

ALTER TABLE public.ot_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;
-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.ot_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- SELECT: Users can view their own OT requests; ADMINs can view everyone's OT requests
CREATE POLICY "Users can view own ot_requests" ON public.ot_requests
    FOR SELECT USING (
        auth.uid() = user_id 
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- INSERT: Users can create their own OT requests
CREATE POLICY "Users can insert own ot_requests" ON public.ot_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- UPDATE/ALL: Users can update their own PENDING requests; ADMINs can manage all requests
CREATE POLICY "Users can manage own pending ot_requests" ON public.ot_requests
    FOR UPDATE USING (
        (auth.uid() = user_id AND status = 'PENDING')
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- DELETE: Users can delete their own PENDING requests; ADMINs can delete all requests
CREATE POLICY "Users can delete own pending ot_requests" ON public.ot_requests
    FOR DELETE USING (
        (auth.uid() = user_id AND status = 'PENDING')
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ot_requests_user_date ON public.ot_requests(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ot_requests_status ON public.ot_requests(status);

-- 5. Notify schema reload
NOTIFY pgrst, 'reload schema';
