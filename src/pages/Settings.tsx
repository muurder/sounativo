import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Shield, Globe, Smartphone, ChevronRight, Save, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    promotions: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const SettingSection = ({ 
    title, 
    children 
  }: { 
    title: string; 
    children: React.ReactNode 
  }) => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: (v: boolean) => void; 
    label: string; 
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações</h1>

        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm">
              Faça login para acessar todas as configurações.
            </p>
            <Link 
              to={{ hash: 'login' }}
              className="inline-block mt-2 text-primary-600 font-semibold hover:underline"
            >
              Fazer login
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {/* Notificações */}
          <SettingSection title="Notificações">
            <ToggleSwitch
              checked={notifications.email}
              onChange={(v) => setNotifications(n => ({...n, email: v}))}
              label="Notificações por Email"
              description="Receba atualizações sobre suas reservas"
            />
            <div className="border-t border-gray-100" />
            <ToggleSwitch
              checked={notifications.whatsapp}
              onChange={(v) => setNotifications(n => ({...n, whatsapp: v}))}
              label="Notificações WhatsApp"
              description="Receba lembretes via WhatsApp"
            />
            <div className="border-t border-gray-100" />
            <ToggleSwitch
              checked={notifications.promotions}
              onChange={(v) => setNotifications(n => ({...n, promotions: v}))}
              label="Promoções e Ofertas"
              description="Receba ofertas especiais e descontos"
            />
          </SettingSection>

          {/* Privacidade */}
          <SettingSection title="Privacidade e Segurança">
            <Link 
              to="/privacy"
              className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-700">Política de Privacidade</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <div className="border-t border-gray-100" />
            <Link 
              to="/terms"
              className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-700">Termos de Uso</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          </SettingSection>

          {/* App Mobile */}
          <SettingSection title="App Mobile">
            <div className="flex items-center gap-4 py-2">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Instale o App</p>
                <p className="text-sm text-gray-500">
                  Adicione à tela inicial para acesso rápido
                </p>
              </div>
              <button 
                onClick={() => alert('No Chrome, toque no menu (⋮) e depois "Adicionar à tela inicial"')}
                className="text-primary-600 font-medium text-sm"
              >
                Como instalar
              </button>
            </div>
          </SettingSection>

          {/* Salvar */}
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
              saved 
                ? 'bg-green-600' 
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {saved ? (
              <>
                <Check size={20} />
                Salvo com sucesso!
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Configurações
              </>
            )}
          </button>

          {/* Versão */}
          <p className="text-center text-sm text-gray-400">
            SouNativo v0.1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
