import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../types/roles';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const { data: profile, error } = await this.supabaseService.getClient()
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      throw new ForbiddenException('User profile not found');
    }

    if (!requiredRoles.includes(profile.role as UserRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}