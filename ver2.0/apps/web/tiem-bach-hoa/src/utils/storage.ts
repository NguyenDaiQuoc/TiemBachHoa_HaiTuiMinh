import { uploadBytesResumable, getDownloadURL } from 'firebase/storage';

type ProgressCallback = (percent: number) => void;

export async function uploadWithRetries(sRef: any, file: File, options?: { maxRetries?: number, onProgress?: ProgressCallback }) {
  const maxRetries = options?.maxRetries ?? 3;
  const onProgress = options?.onProgress;

  let lastErr: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const metadata = { contentType: file.type || 'application/octet-stream' };
      const task = uploadBytesResumable(sRef, file, metadata);

      const url = await new Promise<string>((resolve, reject) => {
        task.on('state_changed', (snap: any) => {
          try {
            const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
            if (onProgress) onProgress(pct);
          } catch (e) { /* ignore */ }
        }, (err: any) => {
          lastErr = err;
          reject(err);
        }, async () => {
          try {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            resolve(downloadUrl);
          } catch (e) { reject(e); }
        });
      });

      // success
      return { url };
    } catch (err: any) {
      lastErr = err;
      // exponential backoff before retrying
      const delayMs = 500 * Math.pow(2, attempt); // 500ms, 1s, 2s...
      // If last attempt, break and throw
      if (attempt < maxRetries - 1) {
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }
      const enriched: any = new Error('Upload failed after retries');
      enriched.original = err;
      enriched.attempts = attempt + 1;
      enriched.code = err?.code || null;
      throw enriched;
    }
  }

  // should never reach here
  throw lastErr || new Error('Unknown upload error');
}

export default uploadWithRetries;
