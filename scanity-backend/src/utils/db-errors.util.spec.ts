import { BadRequestException } from '@nestjs/common';
import { throwIfUniqueViolation } from './db-errors.util';

const constraintMap = {
  users_email_unique: 'Este e-mail já está em uso.',
  users_document_unique: 'Este documento já está cadastrado.',
};

describe('throwIfUniqueViolation', () => {
  it('should do nothing when error code is not 23505', () => {
    expect(() =>
      throwIfUniqueViolation({ code: '23503' }, constraintMap, 'Duplicado.'),
    ).not.toThrow();
  });

  it('should throw BadRequestException with specific message from constraintMessageMap', () => {
    expect(() =>
      throwIfUniqueViolation(
        { code: '23505', constraint: 'users_email_unique' },
        constraintMap,
        'Duplicado.',
      ),
    ).toThrow(new BadRequestException('Este e-mail já está em uso.'));
  });

  it('should throw BadRequestException with email-specific message when detail contains (email)', () => {
    expect(() =>
      throwIfUniqueViolation(
        {
          code: '23505',
          detail: 'Key (email)=(test@test.com) already exists.',
        },
        constraintMap,
        'Duplicado.',
      ),
    ).toThrow(
      new BadRequestException('Já existe um registro com este e-mail.'),
    );
  });

  it('should throw BadRequestException with defaultMessage for other unique violations', () => {
    expect(() =>
      throwIfUniqueViolation(
        {
          code: '23505',
          constraint: 'unknown_constraint',
          detail: 'Key (phone)=(123) already exists.',
        },
        constraintMap,
        'Duplicado.',
      ),
    ).toThrow(new BadRequestException('Duplicado.'));
  });

  it('should do nothing when error is null', () => {
    expect(() =>
      throwIfUniqueViolation(null, constraintMap, 'Duplicado.'),
    ).not.toThrow();
  });

  it('should do nothing when error is undefined', () => {
    expect(() =>
      throwIfUniqueViolation(undefined, constraintMap, 'Duplicado.'),
    ).not.toThrow();
  });
});
