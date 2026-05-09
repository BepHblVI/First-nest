'use client';
import type { SearchSurveyInput } from '../src/gql/graphql';
import {
  PublishState,
  SurveyAuthType,
  AnswerState,
  SearchScope,
  SortOrder,
  SurveySortField,
} from '../src/gql/graphql';

type Props = {
  value: SearchSurveyInput;
  onChange: (next: SearchSurveyInput) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export default function SearchPanel({ value, onChange, onSubmit, onReset }: Props) {
  const patch = (p: Partial<SearchSurveyInput>) => onChange({ ...value, ...p, offset: 0 });

  // 配列要素のトグル（ジェネリックに型維持）
  const toggle = <T,>(arr: T[] | null | undefined, v: T): T[] => {
    const cur = arr ?? [];
    return cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
  };

  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #ddd',
        borderRadius: 8,
        marginBottom: 24,
        background: '#fafafa',
      }}
    >
      <h3 style={{ marginTop: 0 }}>🔍 検索・絞り込み</h3>

      {/* キーワード */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="キーワード(100文字以内)"
          value={value.keyword ?? ''}
          maxLength={100}
          onChange={(e) => patch({ keyword: e.target.value })}
          style={{ flex: 1, padding: 6 }}
        />
        <select
          value={value.scope}
          onChange={(e) => patch({ scope: e.target.value as SearchScope })}
        >
          <option value={SearchScope.TitleOnly}>タイトルのみ</option>
          <option value={SearchScope.TitleAndQuestions}>タイトル+質問文</option>
        </select>
      </div>

      {/* 公開状態 */}
      <Field label="公開状態">
        {[
          { v: PublishState.Published, label: '公開' },
          { v: PublishState.Draft, label: '下書き' },
        ].map(({ v, label }) => (
          <label key={v} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={value.publishStates?.includes(v) ?? false}
              onChange={() => patch({ publishStates: toggle(value.publishStates, v) })}
            />
            {label}
          </label>
        ))}
      </Field>

      {/* 認証方式 */}
      <Field label="アクセス権限">
        {[
          { v: SurveyAuthType.Public, label: '🌐 公開' },
          { v: SurveyAuthType.Private, label: '🔑 招待制' },
        ].map(({ v, label }) => (
          <label key={v} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={value.authTypes?.includes(v) ?? false}
              onChange={() => patch({ authTypes: toggle(value.authTypes, v) })}
            />
            {label}
          </label>
        ))}
      </Field>

      {/* 回答状態 */}
      <Field label="回答状態">
        {[
          { v: AnswerState.HasAnswers, label: '回答あり' },
          { v: AnswerState.Unanswered, label: '未回答' },
        ].map(({ v, label }) => (
          <label key={v} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={value.answerStates?.includes(v) ?? false}
              onChange={() => patch({ answerStates: toggle(value.answerStates, v) })}
            />
            {label}
          </label>
        ))}
      </Field>

      {/* 回答件数範囲 */}
      <Field label="回答件数">
        <input
          type="number"
          placeholder="min"
          min={0}
          value={value.submissionCount?.min ?? ''}
          onChange={(e) =>
            patch({
              submissionCount: {
                ...value.submissionCount,
                min: e.target.value === '' ? null : Number(e.target.value),
              },
            })
          }
          style={{ width: 80, marginRight: 8 }}
        />
        〜
        <input
          type="number"
          placeholder="max"
          min={0}
          value={value.submissionCount?.max ?? ''}
          onChange={(e) =>
            patch({
              submissionCount: {
                ...value.submissionCount,
                max: e.target.value === '' ? null : Number(e.target.value),
              },
            })
          }
          style={{ width: 80, marginLeft: 8 }}
        />
      </Field>

      {/* 作成日範囲 */}
      <Field label="作成日">
        <input
          type="datetime-local"
          value={toLocalInput(value.createdAt?.from)}
          onChange={(e) =>
            patch({
              createdAt: {
                ...value.createdAt,
                from: e.target.value ? new Date(e.target.value).toISOString() : null,
              },
            })
          }
        />
        〜
        <input
          type="datetime-local"
          value={toLocalInput(value.createdAt?.to)}
          onChange={(e) =>
            patch({
              createdAt: {
                ...value.createdAt,
                to: e.target.value ? new Date(e.target.value).toISOString() : null,
              },
            })
          }
          style={{ marginLeft: 8 }}
        />
      </Field>

      {/* 並び替え */}
      <Field label="並び替え">
        <select
          value={value.sortBy}
          onChange={(e) => patch({ sortBy: e.target.value as SurveySortField })}
        >
          <option value={SurveySortField.CreatedAt}>作成日時</option>
          <option value={SurveySortField.UpdatedAt}>更新日時</option>
          <option value={SurveySortField.Title}>タイトル</option>
          <option value={SurveySortField.SubmissionCount}>回答件数</option>
        </select>
        <select
          value={value.order}
          onChange={(e) => patch({ order: e.target.value as SortOrder })}
          style={{ marginLeft: 8 }}
        >
          <option value={SortOrder.Desc}>降順</option>
          <option value={SortOrder.Asc}>昇順</option>
        </select>
      </Field>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={onSubmit}
          style={{
            padding: '8px 20px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          🔍 検索
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '8px 20px',
            background: '#888',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          リセット
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <span
        style={{
          display: 'inline-block',
          width: 110,
          fontSize: 13,
          color: '#555',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
