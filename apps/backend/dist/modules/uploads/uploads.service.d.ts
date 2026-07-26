import { ConfigService } from '@nestjs/config';
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
export declare class UploadsService {
    private readonly config;
    private readonly uploadDir;
    private readonly allowedMimeTypes;
    constructor(config: ConfigService);
    saveFile(file: UploadedFile, subDir?: string): Promise<UploadResult>;
    saveFiles(files: UploadedFile[], subDir?: string): Promise<UploadResult[]>;
    deleteFile(url: string): Promise<boolean>;
    private extFromMime;
}
