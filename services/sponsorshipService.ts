
import { supabase } from '../lib/supabase';
import { SponsorshipDetail, Client } from '../types/task';

let clientsCache: Client[] | null = null;

export const sponsorshipService = {
  async getClients(forceRefresh = false) {
    if (clientsCache && !forceRefresh) {
      return clientsCache;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    
    clientsCache = data.map((d: any) => ({
      id: d.id,
      name: d.name,
      contactPerson: d.contact_person,
      email: d.email,
      phone: d.phone,
      logoUrl: d.logo_url,
      isActive: d.is_active
    })) as Client[];
    
    return clientsCache;
  },

  async getClientAnalytics(startDate?: Date, endDate?: Date) {
    let query = supabase
      .from('sponsorship_details')
      .select(`
        *,
        client:clients(*),
        task:tasks(
          id,
          title,
          status,
          published_at,
          engagements,
          views,
          shares,
          comments,
          channel_id,
          target_platforms
        )
      `);

    // Dynamic Date Range Logic
    const start = startDate ? startDate.toISOString() : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte('created_at', start);
    
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      taskId: item.task_id,
      clientId: item.client_id,
      dealValue: item.deal_value || 0,
      requirements: item.requirements,
      paymentStatus: item.payment_status,
      isPaid: item.is_paid,
      invoiceUrl: item.invoice_url,
      createdAt: item.created_at,
      client: item.client ? {
        id: item.client.id,
        name: item.client.name,
        logoUrl: item.client.logo_url
      } : null,
      task: item.task ? {
        id: item.task.id,
        title: item.task.title,
        status: item.task.status,
        publishedAt: item.task.published_at,
        engagements: item.task.engagements || 0,
        views: item.task.views || 0,
        shares: item.task.shares || 0,
        comments: item.task.comments || 0,
        channelId: item.task.channel_id,
        platforms: item.task.target_platforms || []
      } : null
    }));
  },

  async getSponsorshipDetail(taskId: string): Promise<SponsorshipDetail | null> {
    // ... rest of the service remains same
    const { data, error } = await supabase
      .from('sponsorship_details')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;

    return {
      taskId: data.task_id,
      clientId: data.client_id,
      isSponsored: data.is_sponsored,
      dealValue: data.deal_value,
      requirements: data.requirements,
      paymentStatus: data.payment_status,
      isPaid: data.is_paid,
      invoiceUrl: data.invoice_url,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      client: data.client ? {
        id: data.client.id,
        name: data.client.name,
        contactPerson: data.client.contact_person,
        email: data.client.email,
        phone: data.client.phone,
        logoUrl: data.client.logo_url,
        isActive: data.client.is_active
      } : undefined
    };
  },

  async saveSponsorshipDetail(taskId: string, details: Partial<SponsorshipDetail>) {
    const payload = {
      task_id: taskId,
      client_id: details.clientId,
      is_sponsored: details.isSponsored ?? true,
      deal_value: details.dealValue ?? 0,
      requirements: details.requirements,
      payment_status: details.paymentStatus ?? 'UNPAID',
      is_paid: details.isPaid ?? false,
      invoice_url: details.invoiceUrl,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('sponsorship_details')
      .upsert(payload, { onConflict: 'task_id' });

    if (error) throw error;
    return true;
  },

  async deleteSponsorshipDetail(taskId: string) {
    const { error } = await supabase
      .from('sponsorship_details')
      .delete()
      .eq('task_id', taskId);

    if (error) throw error;
    return true;
  },

  async createClient(client: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        contact_person: client.contactPerson,
        email: client.email,
        phone: client.phone,
        logo_url: client.logoUrl,
        is_active: true
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Failed to create client: No data returned');
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      email: data.email,
      phone: data.phone,
      logoUrl: data.logo_url,
      isActive: data.is_active
    } as Client;
  }
};
