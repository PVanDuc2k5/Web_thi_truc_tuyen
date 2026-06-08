import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../guards/supabase-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
@UseGuards(SupabaseAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    const profile = await this.authService.getUserProfile(user.id);
    return {
      user: user,
      profile: profile,
    };
  }
}