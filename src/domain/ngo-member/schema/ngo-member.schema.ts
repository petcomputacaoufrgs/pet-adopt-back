import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class NGOMember {
    @Prop({
        required: true,
    })
    email: string;

    @Prop({
        required: true,
    })
    password: string;

    @Prop({
        required: true,
    })
    NGO: string;
}
