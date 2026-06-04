import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  S3ServiceException: class extends Error {
    name: string;
    constructor(message: string) {
      super(message);
      this.name = 'NotFound';
    }
  },
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.com/test'),
}));

jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized-image')),
  })),
}));

import { S3ServiceException } from '@aws-sdk/client-s3';

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: unknown) => {
    const config: Record<string, unknown> = {
      AWS_REGION: 'us-east-1',
      AWS_ID: 'mock-access-key',
      AWS_SECRET: 'mock-secret-key',
      AWS_BUCKET: 'mock-bucket',
      AWS_SIGNATURE_TTL: 7,
    };
    return config[key] ?? defaultValue;
  }),
};

describe('S3Service', () => {
  let service: S3Service;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    mockSend = jest.fn();
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should send PutObjectCommand and return the key', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.upload('test-key', Buffer.from('content'), 'text/plain');

      expect(result).toBe('test-key');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should upload without contentType', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.upload('test-key', 'raw-string');

      expect(result).toBe('test-key');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('fileExists', () => {
    it('should return true when HeadObjectCommand succeeds', async () => {
      mockSend.mockResolvedValue({});

      const result = await service.fileExists('existing-key');

      expect(result).toBe(true);
    });

    it('should return false when S3ServiceException with NotFound name', async () => {
      const S3Exception = S3ServiceException as unknown as new (msg: string) => Error;
      const notFoundError = new S3Exception('Not Found');
      mockSend.mockRejectedValue(notFoundError);

      const result = await service.fileExists('missing-key');

      expect(result).toBe(false);
    });

    it('should throw when S3ServiceException with other name', async () => {
      const S3Exception = S3ServiceException as unknown as new (msg: string) => Error;
      const otherError = new S3Exception('Forbidden');
      otherError.name = 'Forbidden';
      mockSend.mockRejectedValue(otherError);

      await expect(service.fileExists('forbidden-key')).rejects.toThrow(S3ServiceException);
    });

    it('should throw when non-S3 error occurs', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      await expect(service.fileExists('error-key')).rejects.toThrow('Network error');
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand', async () => {
      mockSend.mockResolvedValue({});

      await service.delete('test-key');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateSignedUri', () => {
    it('should call getSignedUrl with correct parameters', async () => {
      const expectedUrl = 'https://signed-url.com/test';
      (getSignedUrl as jest.Mock).mockResolvedValue(expectedUrl);

      const result = await service.generateSignedUri('test-key');

      expect(result).toBe(expectedUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({ expiresIn: 604800 }),
      );
    });

    it('should use custom expiresIn when provided', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://signed-url.com/test');

      await service.generateSignedUri('test-key', 3600);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({ expiresIn: 3600 }),
      );
    });
  });

  describe('uploadAndResizeImage', () => {
    it('should resize image via sharp and upload', async () => {
      mockSend.mockResolvedValue({});

      const imageBuffer = Buffer.from('original-image');
      const result = await service.uploadAndResizeImage('test-key', imageBuffer, 'image/png');

      expect(result).toBe('test-key');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
