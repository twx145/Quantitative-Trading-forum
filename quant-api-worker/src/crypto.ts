// 定义环境类型，以便在函数中访问Secrets
interface CryptoEnv {
  ENCRYPTION_KEY: string;
}

// --- 辅助函数 (无变化) ---
const base64ToArrayBuffer = (b64: string) => {
  const byteString = atob(b64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return byteArray.buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const getMasterKey = async (env: CryptoEnv) => {
  const keyData = base64ToArrayBuffer(env.ENCRYPTION_KEY);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// --- 核心加密/解密函数 ---

/**
 * 使用 AES-GCM 加密文本
 * @param plaintext 要加密的明文
 * @param env 包含 ENCRYPTION_KEY 的环境对象
 * @returns 格式为 "iv:ciphertext" 的Base64编码字符串
 */
export async function encrypt(plaintext: string, env: CryptoEnv): Promise<string> {
  const masterKey = await getMasterKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 生成一个随机的、唯一的IV (这是一个Uint8Array)
  const encoder = new TextEncoder();
  const encodedPlaintext = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv }, 
    masterKey,
    encodedPlaintext
  );
  const iv_b64 = arrayBufferToBase64(iv.buffer);
  const ciphertext_b64 = arrayBufferToBase64(ciphertext);

  return `${iv_b64}:${ciphertext_b64}`;
}

/**
 * 使用 AES-GCM 解密文本
 * (此函数无变化)
 */
export async function decrypt(encryptedString: string, env: CryptoEnv): Promise<string> {
  const masterKey = await getMasterKey(env);
  const [iv_b64, ciphertext_b64] = encryptedString.split(':');

  if (!iv_b64 || !ciphertext_b64) {
    throw new Error('无效的加密数据格式');
  }

  const iv = base64ToArrayBuffer(iv_b64);
  const ciphertext = base64ToArrayBuffer(ciphertext_b64);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    masterKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}


/**
 * 为文本生成一个安全的哈希值 (用于查找)
 * (此函数无变化)
 */
export async function hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}