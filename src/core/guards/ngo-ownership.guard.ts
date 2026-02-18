import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

export const NGO_OWNERSHIP_KEY = 'ngoOwnership';

export interface NgoOwnershipConfig {
  // De onde extrair o ngoId do recurso
  resourceIdParam?: string; // Nome do parâmetro da rota (ex: 'id', 'petId')
  resourceIdBody?: string; // Campo no body (ex: 'ngoId', 'pet.ngoId')
  
  // Se o parâmetro da rota É o ngoId (ex: PATCH /ngos/:id onde :id é o ngoId)
  paramIsNgoId?: boolean;
  
  // Se precisa buscar o recurso no banco para obter o ngoId
  // Nesse caso, o guard delegará para o service fazer a validação
  checkInService?: boolean;
}

@Injectable()
export class NgoOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Busca configuração do decorator
    const config = this.reflector.getAllAndOverride<NgoOwnershipConfig>(
      NGO_OWNERSHIP_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não tem configuração, permite acesso (guard não aplicado)
    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não tem usuário, deixa o JwtAuthGuard lidar com isso
    if (!user) return true;

    // ADMIN sempre tem acesso
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Se o usuário não tem ngoId, não pode acessar recursos de ONG
    if (!user.ngoId) {
      throw new ForbiddenException(
        'Usuário não pertence a nenhuma ONG'
      );
    }

    // Verificar ownership baseado na configuração
    const resourceNgoId = this.extractResourceNgoId(request, config);

    if (resourceNgoId && resourceNgoId !== user.ngoId) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar recursos de outra ONG'
      );
    }

    // Se checkInService está ativo, anexa o ngoId do usuário à request
    // para que o service possa fazer a validação
    if (config.checkInService) {
      request.userNgoId = user.ngoId;
    }

    return true;
  }

  private extractResourceNgoId(request: any, config: NgoOwnershipConfig): string | null {
    // 1. Tentar extrair do body
    if (config.resourceIdBody) {
      const ngoId = this.getNestedProperty(request.body, config.resourceIdBody);
      if (ngoId) return ngoId;
    }

    // 2. Se o parâmetro É o ngoId (ex: /ngos/:id)
    if (config.paramIsNgoId && config.resourceIdParam) {
      return request.params[config.resourceIdParam];
    }

    // 3. Tentar extrair dos parâmetros da rota
    // Nesse caso, não temos o ngoId direto, precisará ser verificado no service
    if (config.resourceIdParam) {
      // Retorna null para indicar que precisa verificar no service
      return null;
    }

    return null;
  }

  // Helper para acessar propriedades aninhadas (ex: 'pet.ngoId')
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}
