import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Statistics extends Document {
  @Prop({ type: [Types.ObjectId], ref: 'Pet' })
  recentPets: Types.ObjectId[];

  @Prop()
  lastUpdated: Date;
}

export const StatisticsSchema = SchemaFactory.createForClass(Statistics);