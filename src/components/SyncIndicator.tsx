'use client';

import { Cloud, CloudOff, CloudUpload, Check, Loader2 } from 'lucide-react';
import type { SyncStatus } from '../lib/useOfflineSync';

interface Props {
  status: SyncStatus;
  isOnline: boolean;
  dark: boolean;
}

export default function SyncIndicator({ status, isOnline, dark }: Props) {
  const base = `flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-none border-2 transition-all select-none`;

  if (!isOnline || status === 'offline') {
    return (
      <div className={`${base} bg-amber-400/20 border-amber-400 text-amber-400`} title="Sin conexión — los cambios se guardan localmente">
        <CloudOff size={13} />
        <span>Sin conexión</span>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className={`${base} bg-amber-400/20 border-amber-400 text-amber-400`} title="Cambios pendientes de sincronizar">
        <CloudUpload size={13} />
        <span>Pendiente</span>
      </div>
    );
  }

  if (status === 'syncing') {
    return (
      <div className={`${base} ${dark ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-[#6c40d6]/10 border-[#6c40d6] text-[#6c40d6]'}`} title="Sincronizando...">
        <Loader2 size={13} className="animate-spin" />
        <span>Sincronizando</span>
      </div>
    );
  }

  if (status === 'synced') {
    return (
      <div className={`${base} bg-emerald-500/20 border-emerald-500 text-emerald-500`} title="Sincronizado con el servidor">
        <Check size={13} />
        <span>Guardado</span>
      </div>
    );
  }

  // idle
  return (
    <div className={`${base} ${dark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-black/5 border-black/10 text-black/30'}`} title="Conectado">
      <Cloud size={13} />
      <span>Online</span>
    </div>
  );
}
