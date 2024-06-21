import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class MembroOng {
    @Prop({
        required: true,
    })
    email: string;

    @Prop({
        required: true,
    })
    senha: string;

    @Prop({
        required: true,
    })
    ONG: string;
}
