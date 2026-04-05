// apps/backend/src/practice/practice.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.model';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepo: Repository<Survey>
  ) {}

  // 1. 作成したものを取得
  async getData(user: string): Promise<Survey[]> {
    return await this.surveyRepo.find({
      relations: ['questions'],
      where: {
        owner: user,
      },
    });
  }

  // 2. アンケート作成
  async createData(newTitle: string, newOwner: string, newQtexts: string[]): Promise<Survey> {
    const newSurvey = this.surveyRepo.create({
        title: newTitle,
        owner: newOwner,
        questions: newQtexts.map(text => ({ qtext: text })) 
    });

    return await this.surveyRepo.save(newSurvey);
  }
}