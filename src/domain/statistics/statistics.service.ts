import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Statistics } from './schemas/statistics.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Statistics.name) private statisticsModel: Model<Statistics>
  ) {}

  async addRecentPet(petId: Types.ObjectId) {
    // Verifica se já existe o documento de estatísticas, se não cria um novo 
    const stats = await this.statisticsModel.findOne() || new this.statisticsModel();

    // Adiciona novo ID no início do array
    stats.recentPets.unshift(petId);
    // Mantém apenas os 8 mais recentes
    stats.recentPets = stats.recentPets.slice(0, 8);

    // Atualiza timestamp
    stats.lastUpdated = new Date();
    
    return await stats.save();
  }

  async getRecentPetIDs() {
    const stats = await this.statisticsModel.findOne();
    return stats?.recentPets || [];
  }
}