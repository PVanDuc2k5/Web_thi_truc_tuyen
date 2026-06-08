import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
// Import SupabaseService vào đây (nhớ lùi ra 1 thư mục bằng ../)
import { SupabaseService } from '../supabase.service'; 

@Module({
  controllers: [StudentController],
  // Khai báo thêm SupabaseService vào mảng providers này!
  providers: [StudentService, SupabaseService], 
})
export class StudentModule {}