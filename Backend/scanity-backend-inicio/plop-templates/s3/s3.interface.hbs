import { Readable } from 'stream';

export interface IS3Service {
  /**
   * Faz upload de um arquivo para o bucket S3
   * @param key Nome/caminho do arquivo no S3
   * @param body Conteúdo do arquivo
   * @param contentType Tipo de conteúdo do arquivo
   */
  upload(
    key: string,
    body: Buffer | Readable | string,
    contentType?: string,
  ): Promise<string>;

  /**
   * Redimensiona uma imagem para 200x200 pixels e faz o upload para o S3
   * @param key Nome/caminho do arquivo no S3
   * @param imageBuffer Buffer da imagem
   * @param contentType Tipo de conteúdo da imagem
   */
  uploadAndResizeImage(
    key: string,
    imageBuffer: Buffer,
    contentType?: string,
  ): Promise<string>;

  /**
   * Verifica se um arquivo existe no bucket S3
   * @param key Nome/caminho do arquivo no S3
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Deleta um arquivo do bucket S3
   * @param key Nome/caminho do arquivo no S3
   */
  delete(key: string): Promise<void>;

  /**
   * Gera uma URL assinada para acesso temporário a um arquivo
   * @param key Nome/caminho do arquivo no S3
   * @param expiresIn Tempo de expiração em segundos (opcional)
   */
  generateSignedUri(key: string, expiresIn?: number): Promise<string>;
}
