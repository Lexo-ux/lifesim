export const choice=(label,effects={},extra={})=>({label,effects,...extra});
export const card=(id,npc,text,left,right,extra={})=>({id,npc,text,left,right,months:6,pool:'life',rarity:'common',...extra});
