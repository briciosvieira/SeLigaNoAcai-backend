import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';

@Injectable()
export class UploadsService {
  deleteFile(folder: string, filename: string): { deleted: boolean } {
    if (!this.isAllowedFolder(folder)) {
      throw new BadRequestException('Pasta de upload inválida.');
    }

    const safeFilename = basename(filename);

    if (safeFilename !== filename) {
      throw new BadRequestException('Nome de arquivo inválido.');
    }

    const filePath = join(process.cwd(), 'uploads', folder, safeFilename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    unlinkSync(filePath);

    return {
      deleted: true,
    };
  }

  private isAllowedFolder(folder: string): boolean {
    return ['products', 'store', 'banners'].includes(folder);
  }
}
