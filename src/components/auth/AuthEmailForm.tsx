import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AuthEmailFormProps {
  mode: 'login' | 'signup';
  name: string;
  email: string;
  password: string;
  submitting: boolean;
  errorMsg: string;
  onNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onForgotPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthEmailForm: React.FC<AuthEmailFormProps> = ({
  mode,
  name,
  email,
  password,
  submitting,
  errorMsg,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onForgotPassword,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      {mode === 'signup' && (
        <div>
          <label htmlFor="auth-name" className="block text-xs font-semibold text-stone-700 mb-1">
            Nome completo
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="auth-name"
              type="text"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Seu nome ou nome da agência"
              className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-3 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="block text-xs font-semibold text-stone-700 mb-1">
          E-mail
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="voce@exemplo.com"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-3 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="auth-password" className="block text-xs font-semibold text-stone-700">
            Senha
          </label>
          {mode === 'login' && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[11px] font-semibold text-primary-600 hover:underline"
            >
              Esqueci minha senha
            </button>
          )}
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full min-h-[44px] rounded-xl border border-stone-300 pl-10 pr-11 text-sm text-stone-900 focus:border-primary-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-stone-500 hover:text-stone-800 rounded-lg"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {errorMsg && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
        >
          {errorMsg}
        </p>
      )}

      <Button type="submit" fullWidth loading={submitting}>
        {mode === 'login' ? 'Entrar' : 'Criar minha conta'}
      </Button>
    </form>
  );
};
