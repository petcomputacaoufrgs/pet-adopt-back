import { Module } from '@nestjs/common';
import { NgoController } from './ngo.controller';
import { NgoService } from './ngo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ngo, NgoSchema } from './schemas/ngo.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Ngo.name,
        schema: NgoSchema,
      },
    ]),
    UserModule,
  ],
  controllers: [NgoController],
  providers: [NgoService],
  exports: [NgoService],
})
export class NgoModule {}
