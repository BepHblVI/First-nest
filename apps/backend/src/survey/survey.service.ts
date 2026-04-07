// apps/backend/src/practice/practice.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeepPartial } from 'typeorm';
import { Answer } from './answer.model';
import { Survey } from './survey.model';
import { User } from '../auth/user.model';
import { Submission } from './submission.model';
import { SurveyResult } from './dto/result.output';

type QuestionInput = {
  qtext: string; 
  type:string; 
  options?:string[]; 
};
type AnswerInput = {
  questionId: number;   // どの設問か
  text?: string;        // 自由記述用
  selectionIds?: number[]; // 選んだ選択肢のIDリスト
};

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepo: Repository<Survey>,
    @InjectRepository(Submission)
    private submitRepo: Repository<Submission>,
    @InjectRepository(Answer)
    private answerRepo: Repository<Answer>,
  ) {}

  // 1. 作成したものを取得
  async getData(user: User): Promise<Survey[]> {
    return await this.surveyRepo.find({
      where: { owner: { id: user.id } }, 
      relations: ['owner', 'questions','questions.options'], 
    });
  }

  // 2. アンケート作成
  async createData(title: string, user: User, questions: QuestionInput[]): Promise<Survey> {
    const newSurvey = this.surveyRepo.create({
        title: title,
        owner: { id: user.id },
        questions: questions.map((q) => ({ 
          qtext: q.qtext,
          type: q.type,
          options: q.options?.map((t,index) =>({text: t,order:index})) || []
         })) 
    });

    return await this.surveyRepo.save(newSurvey);
  }

  async submitAnswer(surveyId: number, answers: AnswerInput[]): Promise<Submission> {
    const newSubmission = this.submitRepo.create({
      survey: { id: surveyId },
      answers: answers.map((ans): DeepPartial<Answer> => ({
        question: { id: ans.questionId },
        text: ans.text || undefined,
        selectedOptions: ans.selectionIds?.map(id => ({ id })) || []
      }))
    });

    return await this.submitRepo.save(newSubmission);
  }

  async getSurveyByShareId(shareId: string): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { shareId: shareId },
      relations: ['questions','owner','questions.options'],
    });

    if (!survey) {
      throw new Error('アンケートが見つかりません');
    }
    return survey;
  }

  async getResults(shareId: string): Promise<SurveyResult> {
    const survey = await this.surveyRepo.findOne({
      where: { shareId: shareId },
      relations: ['questions', 'questions.options'],
    });

    if(!survey){
      throw new Error('アンケートが見つかりません')
    }

    const totalSubmissions = await this.submitRepo.count({
      where: { survey: { id: survey.id } }
    });

    const questionResults = await Promise.all(survey.questions.map(async (question) => {

      // この設問に対する回答総数
      const totalAnswers = await this.answerRepo.count({
        where: { question: { id: question.id}}
      });

      const rawOptionCounts = await this.answerRepo.createQueryBuilder('answer')
        .innerJoin('answer.selectedOptions', 'option') // 中間テーブルを結合
        .select('option.id', 'optionId')               // 選択肢IDを取得
        .addSelect('COUNT(answer.id)', 'count')        // その選択肢が含まれる回答数をカウント
        .where('answer.questionId = :qId', { qId: question.id }) // 現在の設問に絞る
        .groupBy('option.id')                          // 選択肢ごとにまとめる
        .getRawMany(); // 生データとして取得

      // 📊 生データ(rawOptionCounts)と、本来の選択肢(question.options)をガッチャンコする
      const optionsResults = question.options?.map(opt => {
        // rawOptionCounts の中から、この選択肢(opt)のIDと一致するデータを探す
        const found = rawOptionCounts.find(r => r.optionId === opt.id);
        
        // 注意: DBによってはCOUNT結果が文字列で返ってくるため、Number()で数値化すると安全です
        const count = found ? Number(found.count) : 0; 
        
        // 割合の計算 (0割りを防ぐ安全対策つき)
        const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;

        return {
          optionId: opt.id,
          text: opt.text,
          count: count,
          percentage: percentage
        };
      }) || [];

      return {
        questionId: question.id,
        qtext: question.qtext,
        type: question.type,
        totalAnswersForThisQuestion: totalAnswers,
        options: optionsResults,
      };
    }));

    return {
      surveyId: survey.id,
      title: survey.title,
      totalSubmissions,
      questions: questionResults,
    };
  }
}