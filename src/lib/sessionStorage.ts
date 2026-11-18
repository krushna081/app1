import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Supabase sessions can be larger than the secure-store item limit. Native
 * sessions are split into chunks; web falls back to AsyncStorage because
 * SecureStore is not available in browsers.
 *
 * Chunks are intentionally small: SecureStore limits a value to roughly 2 KB
 * on some platforms, and chunk size is measured in characters, not UTF-8 bytes.
 */
const CHUNK_SIZE = 512;
const META_SUFFIX = '.meta';

function safeKey(key: string): string {
  return `sg.${key.replace(/[^A-Za-z0-9._-]/g, '_')}`;
}

function chunkKey(key: string, index: number): string {
  return `${safeKey(key)}.chunk.${index}`;
}

function metaKey(key: string): string {
  return `${safeKey(key)}${META_SUFFIX}`;
}

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const meta = await SecureStore.getItemAsync(metaKey(key));
    if (meta === null) return null;

    const count = Number(meta);
    if (!Number.isInteger(count) || count < 0) return null;
    if (count === 0) return '';

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index))),
    );

    if (chunks.some((chunk) => chunk === null)) return null;
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const oldMeta = await SecureStore.getItemAsync(metaKey(key));
    if (oldMeta !== null) {
      const oldCount = Number(oldMeta);
      if (Number.isInteger(oldCount) && oldCount > 0) {
        await Promise.all(
          Array.from({ length: oldCount }, (_, index) =>
            SecureStore.deleteItemAsync(chunkKey(key, index)),
          ),
        );
      }
    }

    const chunks: string[] = [];
    for (let index = 0; index < value.length; index += CHUNK_SIZE) {
      chunks.push(value.slice(index, index + CHUNK_SIZE));
    }

    for (let index = 0; index < chunks.length; index += 1) {
      await SecureStore.setItemAsync(chunkKey(key, index), chunks[index]);
    }

    // Write the manifest last so a partial write is treated as no session.
    await SecureStore.setItemAsync(metaKey(key), String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    const meta = await SecureStore.getItemAsync(metaKey(key));
    if (meta !== null) {
      const count = Number(meta);
      if (Number.isInteger(count) && count > 0) {
        await Promise.all(
          Array.from({ length: count }, (_, index) =>
            SecureStore.deleteItemAsync(chunkKey(key, index)),
          ),
        );
      }
    }
    await SecureStore.deleteItemAsync(metaKey(key));
  },
};

export const sessionStorage = Platform.OS === 'web' ? AsyncStorage : secureStorage;
