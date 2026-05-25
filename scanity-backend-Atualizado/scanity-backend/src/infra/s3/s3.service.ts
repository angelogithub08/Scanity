import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { Readable } from 'stream';
import { IS3Service } from './s3.interface';

@Injectable()
export class S3Service implements IS3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly signatureTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET', ''),
      },
    });

    console.log({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      accessKeyId: this.configService.get<string>('AWS_ID', ''),
      secretAccessKey: this.configService.get<string>('AWS_SECRET', ''),
      bucket: this.configService.get<string>('AWS_BUCKET', ''),
      signatureTtl: this.configService.get<number>('AWS_SIGNATURE_TTL', 7),
    });

    this.bucket = this.configService.get<string>('AWS_BUCKET', '');

    // Converter dias para segundos
    const ttlDays = this.configService.get<number>('AWS_SIGNATURE_TTL', 7);
    this.signatureTtl = ttlDays * 24 * 60 * 60;
  }

  /**
   * Faz upload de um arquivo para o bucket S3
   * @param key Nome/caminho do arquivo no S3
   * @param body Conteúdo do arquivo
   * @param contentType Tipo de conteúdo do arquivo
   */
  async upload(
    key: string,
    body: Buffer | Readable | string,
    contentType?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return key;
  }

  /**
   * Verifica se um arquivo existe no bucket S3
   * @param key Nome/caminho do arquivo no S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Deleta um arquivo do bucket S3
   * @param key Nome/caminho do arquivo no S3
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Gera uma URL assinada para acesso temporário a um arquivo
   * @param key Nome/caminho do arquivo no S3
   * @param expiresIn Tempo de expiração em segundos (opcional)
   */
  async generateSignedUri(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || this.signatureTtl,
    });
  }

  /**
   * Redimensiona uma imagem para 200x200 pixels e faz o upload para o S3
   * @param key Nome/caminho do arquivo no S3
   * @param imageBuffer Buffer da imagem
   * @param contentType Tipo de conteúdo da imagem
   */
  async uploadAndResizeImage(
    key: string,
    imageBuffer: Buffer,
    contentType?: string,
  ): Promise<string> {
    try {
      // Redimensionar a imagem para 200x200 pixels
      const resizedImageBuffer = await sharp(imageBuffer)
        .resize({
          width: 200,
          height: 200,
          fit: 'cover', // Centraliza e recorta a imagem para manter proporção
          position: 'centre', // Centraliza a imagem
        })
        .toBuffer();

      // Fazer o upload da imagem redimensionada
      return await this.upload(key, resizedImageBuffer, contentType);
    } catch (error) {
      console.error('Erro ao redimensionar e fazer upload da imagem:', error);
      throw error;
    }
  }
}
