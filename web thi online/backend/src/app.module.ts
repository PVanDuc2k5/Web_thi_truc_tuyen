import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase.service';
import { TeacherModule } from './teacher.module';
import { StudentModule } from './student/student.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TeacherModule, StudentModule],
  controllers: [AppController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
