import React from 'react';
import { Briefcase, Compass, LucideIcon, User } from 'lucide-react';
import { UserRole } from '@/types';
import { cn } from '@/utils/cn';

interface AuthRoleSelectorProps {
  selectedRole: Exclude<UserRole, 'ADMIN'>;
  onSelect: (role: Exclude<UserRole, 'ADMIN'>) => void;
}

const ROLE_OPTIONS: Array<{
  id: Exclude<UserRole, 'ADMIN'>;
  label: string;
  hint: string;
  icon: LucideIcon;
}> = [
  { id: 'CLIENT', label: 'Viajante', hint: 'Reservar pacotes', icon: User },
  { id: 'AGENCY', label: 'Agência', hint: 'Publicar roteiros', icon: Briefcase },
  { id: 'GUIDE', label: 'Guia / Agente', hint: 'Consultor / Cadastur', icon: Compass },
];

export const AuthRoleSelector: React.FC<AuthRoleSelectorProps> = ({ selectedRole, onSelect }) => (
  <div className="mb-5">
    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
      Como você quer usar o SouNativo?
    </p>
    <div className="grid grid-cols-3 gap-2">
      {ROLE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = selectedRole === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all min-h-[68px]',
              selected
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
            )}
          >
            <Icon size={18} />
            <span className="mt-1 text-xs font-bold">{opt.label}</span>
            <span className="text-[10px] text-stone-500 leading-tight">{opt.hint}</span>
          </button>
        );
      })}
    </div>
  </div>
);
