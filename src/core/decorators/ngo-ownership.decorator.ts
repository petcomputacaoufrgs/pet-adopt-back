import { SetMetadata } from '@nestjs/common';
import { NGO_OWNERSHIP_KEY, NgoOwnershipConfig } from '../guards/ngo-ownership.guard';

/**
 * Decorator para verificar ownership de recursos de ONG
 * 
 * @example
 * // Verifica ngoId no body
 * @NgoOwnership({ resourceIdBody: 'ngoId' })
 * 
 * @example
 * // O parâmetro É o ngoId (ex: PATCH /ngos/:id)
 * @NgoOwnership({ resourceIdParam: 'id', paramIsNgoId: true })
 * 
 * @example
 * // Verifica ngoId buscando recurso no banco (via service)
 * @NgoOwnership({ resourceIdParam: 'id', checkInService: true })
 */
export const NgoOwnership = (config: NgoOwnershipConfig) => 
  SetMetadata(NGO_OWNERSHIP_KEY, config);
