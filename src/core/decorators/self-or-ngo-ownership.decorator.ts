import { SetMetadata } from '@nestjs/common';
import { SELF_OR_NGO_OWNERSHIP_KEY, SelfOrNgoOwnershipConfig } from '../guards/self-or-ngo-ownership.guard';

/**
 * Decorator para verificar se o usuário pode acessar uma conta
 * (própria conta, ADMIN ou NGO_ADMIN da mesma ONG)
 * 
 * @example
 * // Permite apenas a própria conta ou ADMIN
 * @SelfOrNgoOwnership({ userIdParam: 'id', allowSelf: true })
 * 
 * @example
 * // Permite própria conta, ADMIN ou NGO_ADMIN da mesma ONG
 * @SelfOrNgoOwnership({ 
 *   userIdParam: 'id', 
 *   allowSelf: true, 
 *   allowNgoOwnership: true,
 *   checkInService: true 
 * })
 * 
 * @example
 * // Permite apenas NGO_ADMIN da mesma ONG (sem allowSelf)
 * @SelfOrNgoOwnership({ 
 *   userIdParam: 'id', 
 *   allowNgoOwnership: true,
 *   checkInService: true 
 * })
 */
export const SelfOrNgoOwnership = (config: SelfOrNgoOwnershipConfig) => 
  SetMetadata(SELF_OR_NGO_OWNERSHIP_KEY, config);
