import { Body, Controller, Delete, Get, Param, Post, Patch, Query, UseInterceptors, UploadedFiles, UsePipes, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}
}