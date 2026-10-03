import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) { const ref=useRef<HTMLDialogElement>(null); useEffect(()=>{ const d=ref.current; d?.showModal(); return ()=>d?.close(); },[]); return <dialog ref={ref} onCancel={onClose} aria-label={title}><header className="section-heading"><h2>{title}</h2><button aria-label="Close details" onClick={onClose}><X size={20}/></button></header>{children}</dialog>; }
