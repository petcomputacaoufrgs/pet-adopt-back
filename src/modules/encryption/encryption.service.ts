import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  async encryptPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  comparePassword(password: string, hashPassword: string): boolean {
    return bcrypt.compareSync(password, hashPassword);
  }

  // Hash para armazenar refresh tokens no banco de forma segura
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Validar força da senha
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Senha deve ter no mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter ao menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter ao menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Senha deve conter ao menos um número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter ao menos um caractere especial');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
