import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase.service';
import { TeacherModule } from './teacher.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), TeacherModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
