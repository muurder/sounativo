import { describe, expect, it } from 'vitest';
import {
  buildStorageObjectPath,
  mapStorageError,
  MAX_RAW_INPUT_BYTES,
  validateImageFile,
} from '@/services/storageService';

describe('Firebase Storage Direct Upload Service', () => {
  it('accepts safe raster image formats and blocks SVG/script XSS or oversized files', () => {
    const validPng = new File([new Uint8Array(2048)], 'logo-agencia.png', { type: 'image/png' });
    expect(() => validateImageFile(validPng)).not.toThrow();

    const unsafeSvg = new File(['<svg onload=alert(1)>'], 'xss.svg', { type: 'image/svg+xml' });
    expect(() => validateImageFile(unsafeSvg)).toThrow(/Formato não suportado/i);

    const emptyFile = new File([], 'vazio.jpg', { type: 'image/jpeg' });
    expect(() => validateImageFile(emptyFile)).toThrow(/vazio/i);

    const tooLarge = {
      name: 'huge.jpg',
      type: 'image/jpeg',
      size: MAX_RAW_INPUT_BYTES + 1024,
    } as File;
    expect(() => validateImageFile(tooLarge)).toThrow(/12 MB/i);
  });

  it('generates storage.rules-compliant paths isolated by authenticated UID and scope', () => {
    const avatarPath = buildStorageObjectPath(
      'userUid123',
      'avatar',
      'Minha Foto Perfil!!.png',
      'image/webp'
    );
    expect(avatarPath).toMatch(/^users\/userUid123\/avatar\/minha-foto-perfil-[a-z0-9-]+\.webp$/);

    const tripPath = buildStorageObjectPath(
      'partnerUid88',
      'trips',
      'Chapada dos Veadeiros (Capa).jpg',
      'image/jpeg'
    );
    expect(tripPath).toMatch(
      /^partners\/partnerUid88\/trips\/chapada-dos-veadeiros-capa-[a-z0-9-]+\.jpg$/
    );

    expect(() => buildStorageObjectPath('bad/uid', 'trips', 'foto.png', 'image/png')).toThrow();
  });

  it('maps Firebase Storage error codes into actionable Portuguese diagnostics', () => {
    expect(mapStorageError({ code: 'storage/unauthorized' }).message).toContain('Sem permissão');
    expect(mapStorageError({ code: 'storage/bucket-not-found' }).message).toContain(
      'Bucket do Firebase Storage'
    );
  });
});
