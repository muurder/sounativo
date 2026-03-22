-- Execute este script no SQL Editor do Supabase para atualizar
-- a tabela de configurações já existente na plataforma.

UPDATE public.platform_settings
SET 
  platform_name = 'SouNativo',
  default_settings = jsonb_set(
    COALESCE(default_settings, '{}'::jsonb), 
    '{platform_name}', 
    '"SouNativo"'
  )
WHERE id = 1;
