import { getApiBodyOptions, getApiResponseOptions } from './swagger.util';

class MockDto {
  name: string;
  email: string;
}

describe('getApiBodyOptions', () => {
  it('should return object with type, description, required, schema', () => {
    const result = getApiBodyOptions(MockDto);
    expect(result).toHaveProperty('type', MockDto);
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('required', true);
    expect(result).toHaveProperty('schema');
    expect(result.schema).toHaveProperty('$ref');
  });

  it('should use default description when none provided', () => {
    const result = getApiBodyOptions(MockDto);
    expect(result.description).toBe('Dados para a operação');
  });

  it('should use custom description when provided', () => {
    const result = getApiBodyOptions(MockDto, 'Dados para criar usuário');
    expect(result.description).toBe('Dados para criar usuário');
  });
});

describe('getApiResponseOptions', () => {
  it('should return object with status, description, schema', () => {
    const result = getApiResponseOptions(201, MockDto);
    expect(result).toHaveProperty('status', 201);
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('schema');
    expect(result.schema).toHaveProperty('$ref');
  });

  it('should use default description when none provided', () => {
    const result = getApiResponseOptions(200, MockDto);
    expect(result.description).toBe('Operação concluída com sucesso');
  });
});
