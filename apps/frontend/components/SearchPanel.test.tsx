import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPanel from './SearchPanel';
import {
  PublishState,
  SurveyAuthType,
  AnswerState,
  SearchScope,
  SortOrder,
  SurveySortField,
  type SearchSurveyInput,
} from '../src/gql/graphql';

const baseInput: SearchSurveyInput = {
  keyword: '',
  scope: SearchScope.TitleOnly,
  publishStates: [],
  authTypes: [],
  answerStates: [],
  createdAt: null,
  submissionCount: null,
  sortBy: SurveySortField.CreatedAt,
  order: SortOrder.Desc,
  limit: 10,
  offset: 0,
};

describe('SearchPanel', () => {
  it('キーワード入力で onChange が呼ばれる', async () => {
    const onChange = vi.fn();
    render(
      <SearchPanel value={baseInput} onChange={onChange} onSubmit={vi.fn()} onReset={vi.fn()} />,
    );

    await userEvent.type(screen.getByPlaceholderText(/キーワード/), 'a');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'a' }));
  });

  it('「公開」チェックで publishStates に PUBLISHED が入る', async () => {
    const onChange = vi.fn();
    render(
      <SearchPanel value={baseInput} onChange={onChange} onSubmit={vi.fn()} onReset={vi.fn()} />,
    );

    await userEvent.click(screen.getByLabelText('公開'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        publishStates: [PublishState.Published],
      }),
    );
  });

  it('既にチェック済みの値を再クリックすると外れる', async () => {
    const onChange = vi.fn();
    render(
      <SearchPanel
        value={{ ...baseInput, publishStates: [PublishState.Published] }}
        onChange={onChange}
        onSubmit={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText('公開'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ publishStates: [] }));
  });

  it('回答件数の min/max が数値で渡る', async () => {
    const onChange = vi.fn();
    render(
      <SearchPanel value={baseInput} onChange={onChange} onSubmit={vi.fn()} onReset={vi.fn()} />,
    );

    await userEvent.type(screen.getByPlaceholderText('min'), '2');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        submissionCount: expect.objectContaining({ min: 2 }),
      }),
    );
  });

  it('並び替えの sortBy / order を変更できる', async () => {
    const onChange = vi.fn();
    render(
      <SearchPanel value={baseInput} onChange={onChange} onSubmit={vi.fn()} onReset={vi.fn()} />,
    );

    // sortBy を「タイトル」に
    await userEvent.selectOptions(screen.getByDisplayValue('作成日時'), SurveySortField.Title);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: SurveySortField.Title }),
    );
  });

  it('検索ボタンで onSubmit、リセットで onReset が呼ばれる', async () => {
    const onSubmit = vi.fn();
    const onReset = vi.fn();
    render(
      <SearchPanel value={baseInput} onChange={vi.fn()} onSubmit={onSubmit} onReset={onReset} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /検索/ }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /リセット/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('条件を変えると offset が 0 にリセットされる', async () => {
    const onChange = vi.fn();
    render(
      <SearchPanel
        value={{ ...baseInput, offset: 30 }}
        onChange={onChange}
        onSubmit={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByLabelText('公開'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
  });
});
