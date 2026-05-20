import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Storage abstraction — supports local filesystem and Supabase Storage.
 * Set STORAGE_PROVIDER=supabase in .env to use Supabase.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider = process.env.STORAGE_PROVIDER || 'local';
  private readonly uploadDir = process.env.UPLOAD_DIRECTORY || './uploads';

  constructor() {
    if (this.provider === 'local') {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  /**
   * Upload a file and return its public URL.
   */
  async upload(filePath: string, filename: string, mimeType: string): Promise<string> {
    if (this.provider === 'supabase') {
      return this.uploadToSupabase(filePath, filename, mimeType);
    }
    // Local: file is already in upload dir, just return URL
    return `/uploads/${filename}`;
  }

  /**
   * Delete a file by its stored path/URL.
   */
  async delete(fileUrl: string): Promise<void> {
    if (this.provider === 'supabase') {
      await this.deleteFromSupabase(fileUrl);
      return;
    }
    // Local deletion
    const filename = path.basename(fileUrl);
    const fullPath = path.join(this.uploadDir, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  private async uploadToSupabase(filePath: string, filename: string, mimeType: string): Promise<string> {
    // Dynamic import to avoid hard dependency when not using Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const fileBuffer = fs.readFileSync(filePath);
    const bucket = process.env.SUPABASE_BUCKET || 'socialpilot-media';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    return urlData.publicUrl;
  }

  private async deleteFromSupabase(fileUrl: string): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const bucket = process.env.SUPABASE_BUCKET || 'socialpilot-media';
    const filename = fileUrl.split('/').pop()!;

    await supabase.storage.from(bucket).remove([filename]);
  }
}
