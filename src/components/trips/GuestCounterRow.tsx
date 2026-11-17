import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GuestCounterRowProps {
  label: string;
  subtitle: string;
  count: number;
  min: number;
  max: number;
  icon?: LucideIcon;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (nextCount: number) => void;
  withBorder?: boolean;
}

export const GuestCounterRow: React.FC<GuestCounterRowProps> = ({
  label,
  subtitle,
  count,
  min,
  max,
  icon: Icon,
  decreaseLabel,
  increaseLabel,
  onChange,
  withBorder = false,
}) => (
  <div
    className={`flex items-center justify-between ${
      withBorder ? 'pt-3 border-t border-stone-100' : ''
    }`}
  >
    <div className="flex items-center gap-2">
      {Icon && <Icon size={16} className="text-primary-600" />}
      <div>
        <p className="text-sm font-semibold text-stone-900">{label}</p>
        <p className="text-xs text-stone-500">{subtitle}</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={count <= min}
        onClick={() => onChange(Math.max(min, count - 1))}
        className="w-11 h-11 rounded-full border border-stone-300 font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40"
      >
        -
      </button>
      <span className="w-6 text-center text-sm font-bold">{count}</span>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={count >= max}
        onClick={() => onChange(Math.min(max, count + 1))}
        className="w-11 h-11 rounded-full border border-stone-300 font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-40"
      >
        +
      </button>
    </div>
  </div>
);
