import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
  }

  async saveFile(file: UploadedFile, subDir = ''): Promise<UploadResult> {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`file type not allowed: ${file.mimetype}`);
    }

    const targetDir = path.join(this.uploadDir, subDir);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(file.originalname) || this.extFromMime(file.mimetype);
    const filename = `${crypto.randomUUID()}${ext}`;
    const fullPath = path.join(targetDir, filename);

    await fs.writeFile(fullPath, file.buffer);

    const url = `/uploads/${subDir ? subDir + '/' : ''}${filename}`;
    return {
      url,
      filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async saveFiles(files: UploadedFile[], subDir = ''): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      results.push(await this.saveFile(file, subDir));
    }
    return results;
  }

  async deleteFile(url: string): Promise<boolean> {
    try {
      const filePath = path.join(process.cwd(), url.replace(/^\//, ''));
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    };
    return map[mime] || '';
  }
}
