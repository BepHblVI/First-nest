// apps/backend/src/practice/practice.service.ts
import { Injectable } from '@nestjs/common';
import { Practice } from './practice.model';

@Injectable()
export class PracticeService {
  // メモリ上に簡易的なDBを作成
  private dataList: Practice[] = [
    { id: 1, message: '最初のデータ' },
  ];

  // 全件取得 (Query用)
  getAllData(): Practice[] {
    return this.dataList;
  }

  // データ追加 (Mutation用)
  createData(newMessage: string): Practice {
    const newEntry = {
      id: this.dataList.length + 1,
      message: newMessage,
    };
    this.dataList.push(newEntry);
    return newEntry;
  }
}