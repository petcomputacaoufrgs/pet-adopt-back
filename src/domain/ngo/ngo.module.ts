import { Module } from '@nestjs/common';
import { NgoController } from './ngo.controller';
import { NgoService } from './ngo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ngo, NgoSchema } from './schemas/ngo.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Ngo.name,
        schema: NgoSchema,
      },
    ]),
  ],
  controllers: [NgoController],
  providers: [NgoService],
  exports: [NgoService],
})
export class NgoModule {}
