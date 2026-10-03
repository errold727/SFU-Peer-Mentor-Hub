import { create } from 'zustand';
import type { SFUResource } from '../data/resources/types';
// Deliberately memory-only: no free-form or personal information is persisted.
type BasketState = { items: SFUResource[]; add:(item:SFUResource)=>void; remove:(id:string)=>void; clear:()=>void };
export const usePosterBasket = create<BasketState>(set => ({ items:[], add:item=>set(s=>({items:s.items.some(r=>r.id===item.id)?s.items:[...s.items,item]})), remove:id=>set(s=>({items:s.items.filter(r=>r.id!==id)})), clear:()=>set({items:[]}) }));
