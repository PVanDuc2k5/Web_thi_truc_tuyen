import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseService } from '../supabase.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}