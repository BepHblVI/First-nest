import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 🔑 hoisted で確実に共有
const { authFetch } = vi.hoisted(() => ({
  authFetch: vi.fn(),
}));

// ✅ パス修正：../utils, ../components
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../utils/authfetch', () => ({
  useAuthfetch: () => ({ authFetch }),
}));

vi.mock('../components/CreateSurvey', () => ({
  default: () => <div data-testid="create-survey" />,
}));
vi.mock('../components/EditSurveyModal', () => ({
  default: () => null,
}));

import Home from './page';

const makeResponse = (
  items: Array<{ id: number; title: string }>,
  totalCount = items.length,
  hasNext = false,
) => ({
  data: {
    searchSurvey: {
      totalCount,
      hasNext,
      items: items.map((s) => ({
        ...s,
        published: true,
        auth: 'PUBLIC',
        owner: { username: 'tester' },
        shareId: `share-${s.id}`,
        questions: [],
        tokens: [],
        submissionCount: 0,
      })),
    },
  },
});

describe('Home page (検索)', () => {
  beforeEach(() => {
    authFetch.mockReset();
    // jsdom には alert/confirm が無いのでスタブ
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('初回表示時に searchSurvey をデフォルト条件で叩く', async () => {
    authFetch.mockResolvedValue(makeResponse([{ id: 1, title: 'A' }]));

    render(<Home />);

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalled();
    });
    expect(authFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        input: expect.objectContaining({
          keyword: '',
          offset: 0,
          limit: 10,
        }),
      }),
    );
    expect(await screen.findByText('A')).toBeInTheDocument();
  });

  it('キーワードを入れて検索ボタンを押すと再リクエストされる', async () => {
    authFetch.mockResolvedValue(makeResponse([{ id: 2, title: 'hit' }], 1));

    render(<Home />);
    await screen.findByText('hit');

    await userEvent.type(screen.getByPlaceholderText(/キーワード/), 'hit');
    await userEvent.click(screen.getByRole('button', { name: /検索/ }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({ keyword: 'hit', offset: 0 }),
        }),
      );
    });
  });

  it('「次へ」で offset が limit ぶん進む', async () => {
    authFetch.mockResolvedValue(makeResponse([{ id: 1, title: 'A' }], 25, true));

    render(<Home />);
    await screen.findByText('A');

    await userEvent.click(screen.getByRole('button', { name: /次へ/ }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({ offset: 10 }),
        }),
      );
    });
  });

  it('hasNext が false なら「次へ」が disabled', async () => {
    authFetch.mockResolvedValue(makeResponse([{ id: 1, title: 'A' }], 1, false));

    render(<Home />);
    await screen.findByText('A');

    expect(screen.getByRole('button', { name: /次へ/ })).toBeDisabled();
  });

  it('リセットで初期条件に戻る', async () => {
    authFetch.mockResolvedValue(makeResponse([{ id: 1, title: 'A' }]));

    render(<Home />);
    await screen.findByText('A');

    await userEvent.type(screen.getByPlaceholderText(/キーワード/), 'foo');
    await userEvent.click(screen.getByRole('button', { name: /リセット/ }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({ keyword: '' }),
        }),
      );
    });
  });

  it('結果が0件のときは空メッセージ', async () => {
    authFetch.mockResolvedValue(makeResponse([], 0, false));

    render(<Home />);

    expect(await screen.findByText(/0件ヒット/)).toBeInTheDocument();
    expect(screen.getByText(/アンケートが見つかりません/)).toBeInTheDocument();
  });
});
