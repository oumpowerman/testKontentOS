
import { supabase } from '../lib/supabase';
import { ShopItem, UserInventoryItem, GameActionType } from '../types';

export const gamificationService = {
  async getShopItems(): Promise<ShopItem[]> {
    const { data } = await supabase.from('shop_items').select('*').eq('is_active', true);
    if (!data) return [];
    
    return data.map((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        icon: i.icon,
        effectType: i.effect_type,
        effectValue: i.effect_value,
        isActive: i.is_active // Added missing property
    }));
  },

  async getUserInventory(userId: string): Promise<UserInventoryItem[]> {
    const { data } = await supabase
        .from('user_inventory')
        .select(`
            id, item_id, is_used, 
            shop_items (id, name, description, icon, effect_type, effect_value, is_active)
        `)
        .eq('user_id', userId)
        .eq('is_used', false);

    if (!data) return [];

    return data.map((i: any) => ({
        id: i.id,
        itemId: i.item_id,
        userId: userId,
        isUsed: i.is_used,
        item: i.shop_items ? {
            id: i.shop_items.id,
            name: i.shop_items.name,
            description: i.shop_items.description,
            price: 0,
            icon: i.shop_items.icon,
            effectType: i.shop_items.effect_type,
            effectValue: i.shop_items.effect_value,
            isActive: i.shop_items.is_active // Added missing property
        } : undefined
    }));
  },

  async logAction(userId: string, actionType: GameActionType, details: any) {
      await supabase.from('game_logs').insert({
          user_id: userId,
          action_type: actionType,
          xp_change: details.xp || 0,
          hp_change: details.hp || 0,
          jp_change: details.coins || 0,
          description: details.message,
          related_id: details.relatedId || null
      });
  },
  
  async purchaseItem(userId: string, itemId: string, cost: number) {
      // Logic handled in hooks currently, moving here would require atomic transaction support
      // or careful sequencing. Keeping simple wrapper for now.
  }
};
