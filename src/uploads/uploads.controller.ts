import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { ApiResponse } from 'src/commom/interfaces/api-response.interface';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadsService } from './uploads.service';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

type UploadFolder = 'products' | 'store' | 'banners' | 'loyalty';

function imageFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(
      new BadRequestException(
        'Formato inválido. Envie apenas JPG, PNG ou WEBP.',
      ),
      false,
    );

    return;
  }

  callback(null, true);
}

function buildStorage(folder: UploadFolder) {
  return diskStorage({
    destination: (req, file, callback) => {
      const uploadPath = `uploads/${folder}`;

      mkdirSync(uploadPath, {
        recursive: true,
      });

      callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
      const fileExt = extname(file.originalname).toLowerCase();

      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1_000_000_000,
      )}${fileExt}`;

      callback(null, uniqueName);
    },
  });
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post('products')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: buildStorage('products'),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
  ): ApiResponse<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    return {
      data: new UploadResponseDto({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/products/${file.filename}`,
      }),
    };
  }

  @Post('store-logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: buildStorage('store'),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadStoreLogo(
    @UploadedFile() file: Express.Multer.File,
  ): ApiResponse<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    return {
      data: new UploadResponseDto({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/store/${file.filename}`,
      }),
    };
  }

  @Post('banners')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: buildStorage('banners'),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadBannerImage(
    @UploadedFile() file: Express.Multer.File,
  ): ApiResponse<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    return {
      data: new UploadResponseDto({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/banners/${file.filename}`,
      }),
    };
  }

  @Post('loyalty-card')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: buildStorage('loyalty'),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadLoyaltyCardImage(
    @UploadedFile() file: Express.Multer.File,
  ): ApiResponse<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    return {
      data: new UploadResponseDto({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/loyalty/${file.filename}`,
      }),
    };
  }

  @Delete(':folder/:filename')
  deleteFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
  ): ApiResponse<{ deleted: boolean }> {
    const result = this.service.deleteFile(folder, filename);

    return {
      data: result,
    };
  }
}
