import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

export const SELF_OR_NGO_OWNERSHIP_KEY = 'selfOrNgoOwnership';

export interface SelfOrNgoOwnershipConfig {
  // Campo que contém o userId do recurso (ex: 'id' para /users/:id)
  userIdParam: string;
  
  // Permite acesso à própria conta
  allowSelf?: boolean;
  
  // Permite NGO_ADMIN acessar membros da própria ONG
  allowNgoOwnership?: boolean;
  
  // Se precisa buscar o usuário no banco para verificar o ngoId
  checkInService?: boolean;
}

@Injectable()
export class SelfOrNgoOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const config = this.reflector.getAllAndOverride<SelfOrNgoOwnershipConfig>(
      SELF_OR_NGO_OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;

    // 1. ADMIN sempre tem acesso
    if (user.role === Role.ADMIN) {
      return true;
    }

    const targetUserId = request.params[config.userIdParam];

    // 2. Verifica se é a própria conta
    if (config.allowSelf && user.userId === targetUserId) {
      return true;
    }

    // 3. Verifica ownership de ONG
    if (config.allowNgoOwnership) {
      // Se NGO_ADMIN, precisa verificar se o target user é da mesma ONG
      if (user.role === Role.NGO_ADMIN && user.ngoId) {
        if (config.checkInService) {
          // Delega verificação para o service
          request.userNgoId = user.ngoId;
          request.targetUserId = targetUserId;
          return true;
        }
        // Se não precisa verificar no service, bloqueia (não temos info suficiente aqui)
        throw new ForbiddenException(
          'Não é possível verificar ownership sem buscar dados do usuário'
        );
      }
    }

    // Nenhuma condição atendida
    throw new ForbiddenException(
      'Você não tem permissão para acessar esta conta'
    );
  }
}
