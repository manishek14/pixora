import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploads;
    constructor(uploads: UploadsService);
    uploadSingle(file: Express.Multer.File): Promise<import("./uploads.service").UploadResult>;
    uploadMultiple(files: Express.Multer.File[]): Promise<import("./uploads.service").UploadResult[]>;
}
