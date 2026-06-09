import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Supabase error fetching user profile:', {
        userId,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error,
      });
      throw new Error(
        `Could not fetch user profile: ${error.message} (Code: ${error.code})`,
      );
    }

    if (!data) {
      console.warn(`User profile not found for user_id: ${userId}`);
      throw new Error(
        `User profile not found for user_id: ${userId}. Please ensure the user_profiles table has been migrated and a profile exists for this user.`,
      );
    }

    return data;
  }
}