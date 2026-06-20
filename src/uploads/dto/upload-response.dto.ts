export class UploadResponseDto {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;

  constructor(params: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }) {
    this.filename = params.filename;
    this.originalName = params.originalName;
    this.mimetype = params.mimetype;
    this.size = params.size;
    this.url = params.url;
  }
}
