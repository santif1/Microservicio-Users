import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './users/seed.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });
  app.get(SeedService);
  await app.listen(3001); // Puerto donde corre la API (localhost)
}
bootstrap();


