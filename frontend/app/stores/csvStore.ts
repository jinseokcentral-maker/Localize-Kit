import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 현재 화면에 사용 중인 기본 CSV (localStorage 비어 있을 때 사용)
export const DEFAULT_CSV = `key,en,ko,ja
common.hello,Hello1,안녕하세요,こんにちは
common.goodbye,Goodbye,안녕히 가세요,さようなら
common.welcome,Welcome,환영합니다,ようこそ
auth.login,Login,로그인,ログイン
auth.logout,Logout,로그아웃,ログアウト
auth.signup,Sign up,회원가입,新規登録
errors.notFound,Page not found,페이지를 찾을 수 없습니다,ページが見つかりません
errors.serverError,Server error,서버 오류,サーバーエラー`;

interface CsvStore {
  csv: string;
  updatedAt: number | null;
  setCsv: (value: string) => void;
  resetCsv: () => void;
}

/**
 * 최근 CSV를 localStorage에 저장/로드하는 Zustand 스토어
 * - 최초 진입 시 localStorage에 값이 없으면 DEFAULT_CSV 사용
 */
export const useCsvStore = create<CsvStore>()(
  persist(
    (set) => ({
      csv: DEFAULT_CSV,
      updatedAt: null,
      setCsv: (value) => set({ csv: value, updatedAt: Date.now() }),
      resetCsv: () => set({ csv: DEFAULT_CSV, updatedAt: Date.now() }),
    }),
    {
      name: "localizekit-csv-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
