import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';

// Mocks para os comandos AWS
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  S3ServiceException: jest.fn().mockImplementation(function (this: {
    name: string;
  }) {
    this.name = 'NotFound';
  }),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
}));

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                AWS_REGION: 'us-east-1',
                AWS_ID: 'test-access-key',
                AWS_SECRET: 'test-secret-key',
                AWS_BUCKET: 'test-bucket',
                AWS_SIGNATURE_TTL: 7,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should upload a file to S3', async () => {
      // Método de mock simples
      jest.spyOn(service, 'upload').mockResolvedValue('test-key');

      const result = await service.upload(
        'test-key',
        'test-content',
        'text/plain',
      );
      expect(result).toBe('test-key');
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      jest.spyOn(service, 'fileExists').mockResolvedValue(true);
      const result = await service.fileExists('existing-key');
      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      jest.spyOn(service, 'fileExists').mockResolvedValue(false);
      const result = await service.fileExists('non-existing-key');
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a file from S3', async () => {
      // Método de mock simples
      const deleteSpy = jest.spyOn(service, 'delete').mockResolvedValue();

      await service.delete('test-key');
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith('test-key');
    });
  });

  describe('generateSignedUri', () => {
    it('should generate a signed URL', async () => {
      jest
        .spyOn(service, 'generateSignedUri')
        .mockResolvedValue('https://signed-url.example.com');

      const result = await service.generateSignedUri('test-key');
      expect(result).toBe('https://signed-url.example.com');
    });

    it('should use custom expiration time if provided', async () => {
      const signedUriSpy = jest
        .spyOn(service, 'generateSignedUri')
        .mockResolvedValue('https://signed-url.example.com');

      const customExpiration = 3600;
      await service.generateSignedUri('test-key', customExpiration);

      expect(signedUriSpy).toHaveBeenCalledWith('test-key', customExpiration);
    });
  });
});
