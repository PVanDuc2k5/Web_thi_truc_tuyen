import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class AppService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getHello() {
    const supabaseConnected = await this.supabaseService.checkConnection();
    const message = supabaseConnected
      ? 'Backend da ket noi voi Supabase.'
      : 'Backend chua ket noi duoc voi Supabase.';

    return {
      message,
      supabaseConfigured: this.supabaseService.isConfigured(),
      supabaseConnected,
    };
  }
}
