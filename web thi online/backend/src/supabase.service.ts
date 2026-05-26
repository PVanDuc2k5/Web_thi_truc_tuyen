import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient | null = null;
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn(
        'Supabase environment variables are not set: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      );
      return;
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.configured = true;
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client is not configured.');
    }

    return this.client;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async checkConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    const { error } = await this.client.auth.admin.listUsers({ page: 1, perPage: 1 });
    return !error;
  }
}
