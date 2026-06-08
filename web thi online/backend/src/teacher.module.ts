import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { SupabaseService } from './supabase.service';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService, SupabaseService],
})
export class TeacherModule {}