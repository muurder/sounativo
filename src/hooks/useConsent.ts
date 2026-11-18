import { useContext } from 'react';
import { ConsentContext, ConsentContextValue } from '@/context/ConsentContext';

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent deve ser utilizado dentro de um ConsentProvider.');
  }
  return context;
}
