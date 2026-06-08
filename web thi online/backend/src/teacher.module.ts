import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: 'secret_key',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}