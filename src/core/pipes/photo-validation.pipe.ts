// src/common/pipes/photo-validation.pipe.ts

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises'; // Importação assíncrona
import { Express } from 'express';

const MAX_PHOTOS = 10;
const MIN_PHOTOS = 1; // Mantendo 1 como no controller original (ajuste se a sugestão de 2 for regra de negócio)

@Injectable()
export class PhotoValidationPipe implements PipeTransform {
  async transform(files: Express.Multer.File[]): Promise<Express.Multer.File[]> {
    if (!files || files.length === 0) {
      // Se a validação for estritamente 'required', você pode lançar um erro aqui.
      throw new BadRequestException('No fotos sent. At least one photo is required.');
      // Neste caso, o multer já garante que a propriedade 'photos' venha.
      // Se não houver arquivos, retorna um array vazio (mas o Interceptor deve garantir isso).
      return files;
    }

    // 1. Validação de Quantidade (usando BadRequestException)
    if (files.length < MIN_PHOTOS || files.length > MAX_PHOTOS) {
      // Usa a função de limpeza antes de lançar o erro
      await this.cleanupFiles(files);
      throw new BadRequestException(
        `The number of photos must be between ${MIN_PHOTOS} and ${MAX_PHOTOS}.`,
      );
    }

    // 2. Validação de Mime-Type (Segurança). Garante que apenas imagens sejam aceitas.
    const allowedMimeTypes = /\/(jpg|jpeg|png)$/;
    const invalidFiles = files.filter(
      (file) => !file.mimetype.match(allowedMimeTypes),
    );

    if (invalidFiles.length > 0) {
      // Usa a função de limpeza antes de lançar o erro
      await this.cleanupFiles(files);
      throw new BadRequestException(
        'File format not supported! We only accept JPG, JPEG and PNG',
      );
    }

    return files;
  }

  /**
   * Limpa os arquivos de forma assíncrona (fs/promises)
   * @param files Lista de arquivos para apagar
   */
  private async cleanupFiles(files: Express.Multer.File[]): Promise<void> {
    // 3. Tratamento Assíncrono da Limpeza (fs.unlink)
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join('./uploads', file.filename);
        try {
          await fs.unlink(filePath);
        } catch (e) {
          // Apenas loga o erro para não mascarar a exceção original da validação
          console.error(`Falha ao apagar arquivo ${filePath}:`, e);
        }
      }),
    );
  }
}