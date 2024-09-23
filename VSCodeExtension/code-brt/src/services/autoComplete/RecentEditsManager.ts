// RecentEditsManager.ts

import { Range, Position, isPositionInRange, Edit } from './types';

export class RecentEditsManager {
  private recentEdits: Edit[] = [];
  private readonly maxEdits: number;

  constructor(maxEdits: number = 100) {
    this.maxEdits = maxEdits;
  }

  addEdit(filepath: string, range: Range, content: string): void {
    const edit: Edit = {
      filepath,
      range,
      content,
      timestamp: Date.now(),
    };

    this.recentEdits.unshift(edit);

    if (this.recentEdits.length > this.maxEdits) {
      this.recentEdits.pop();
    }
  }

  getRecentEdits(filepath: string, limit: number = 10): Edit[] {
    return this.recentEdits
      .filter((edit) => edit.filepath === filepath)
      .slice(0, limit);
  }

  getRecentEditsAroundPosition(
    filepath: string,
    position: Position,
    limit: number = 5,
  ): Edit[] {
    return this.recentEdits
      .filter((edit) => edit.filepath === filepath)
      .filter((edit) => this.isPositionNear(position, edit.range))
      .slice(0, limit);
  }

  private isPositionNear(position: Position, range: Range): boolean {
    if (isPositionInRange(position, range)) {
      return true;
    }

    // 检查位置是否在范围附近（比如在5行之内）
    const nearbyRange: Range = {
      start: { line: range.start.line - 5, character: 0 },
      end: { line: range.end.line + 5, character: Number.MAX_SAFE_INTEGER },
    };

    return isPositionInRange(position, nearbyRange);
  }

  clearEdits(): void {
    this.recentEdits = [];
  }
}

// recentEdits：一個陣列，存放最近的編輯紀錄。每個編輯包含以下屬性：
// filepath：編輯發生的檔案路徑。
// range：編輯發生的範圍（包含開始與結束行列位置）。
// content：編輯的具體內容。
// timestamp：編輯發生的時間戳記。
// maxEdits：可以儲存的最大編輯數量，由建構函式決定，預設為 100

// addEdit(filepath: string, range: Range, content: string): void：
// 將新的編輯加入 recentEdits 清單頂端，如果超過了 maxEdits，會移除最舊的編輯。
// getRecentEdits(filepath: string, limit: number = 10): Edit[]：
// 檢索指定檔案的最近編輯紀錄，最多回傳 limit 條紀錄（預設為 10）。
// getRecentEditsAroundPosition(filepath: string, position: Position, limit: number = 5): Edit[]：
// 根據檔案中的特定位置檢索附近的編輯。它會檢查該位置是否位於編輯範圍內或附近（預設為 5 行內）。
// clearEdits(): void：
// 清空所有儲存的編輯紀錄。
