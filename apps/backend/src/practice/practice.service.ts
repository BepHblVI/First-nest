// apps/backend/src/practice/practice.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Practice } from './practice.model';
import { Comment } from './comment.model'; // 👈 追加

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(Practice)
    private practiceRepository: Repository<Practice>,
    
    // 👇 コメント用のRepositoryを追加
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  // 1. 全件取得 (紐づくコメントも一緒に持ってくる)
  async getAllData(): Promise<Practice[]> {
    return await this.practiceRepository.find({
      // 👇 ここが超重要！「comments」という名前で紐づけたデータも結合して取得する魔法の設定です
      relations: ['comments'],
    });
  }

  // 2. データ追加 (既存のまま)
  async createData(newMessage: string): Promise<Practice> {
    const newEntry = this.practiceRepository.create({
      message: newMessage,
    });
    return await this.practiceRepository.save(newEntry);
  }

  // 3. 【新規】特定のPracticeにコメントを追加する
  async addComment(practiceId: number, text: string): Promise<Comment> {
    // まず、コメントをつけたい親(Practice)がDBに存在するか探す
    const practice = await this.practiceRepository.findOne({ where: { id: practiceId } });
    if (!practice) {
      throw new NotFoundException('指定されたPracticeが見つかりません');
    }

    // コメントの箱を作り、親(Practice)をセットする
    const newComment = this.commentRepository.create({
      text: text,
      practice: practice, // 👈 「このコメントは、この親のものだよ」と教えてあげる
    });

    // コメントを保存
    return await this.commentRepository.save(newComment);
  }
}