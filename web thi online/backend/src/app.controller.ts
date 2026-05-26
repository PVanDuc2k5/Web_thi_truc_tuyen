import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<{
    message: string;
    supabaseConfigured: boolean;
    supabaseConnected: boolean;
  }> {
    return this.appService.getHello();
  }
}
