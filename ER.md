``` mermaid
erDiagram
    %% リレーションシップ（繋がり）
    USER ||--o{ SURVEY : "作成する"
    SURVEY ||--o{ QUESTION : "含む"
    SURVEY ||--o{ SUBMISSION : "受け取る"
    QUESTION ||--o{ QUESTION_OPTION : "持つ"
    QUESTION ||--o{ ANSWER : "紐づく"
    SUBMISSION ||--o{ ANSWER : "含む"
    
    %% 多対多の中間テーブルへのリレーション
    ANSWER ||--o{ ANSWER_OPTION : "選んだ"
    QUESTION_OPTION ||--o{ ANSWER_OPTION : "選ばれた"

    %% エンティティ（テーブル）の定義
    USER {
        int id PK
        string username "ユーザー名"
        string password "パスワード"
    }

    SURVEY {
        int id PK
        string shareId "配布用UUID (unique)"
        string title "アンケートタイトル"
        boolean published "公開フラグ (default: false)"
        datetime created_at "作成日時"
        int ownerId FK "作成者ID"
    }

    QUESTION {
        int id PK
        int surveyId FK "所属アンケートID"
        string type "設問タイプ (default: text)"
        string qtext "設問テキスト"
    }

    QUESTION_OPTION {
        int id PK
        int questionId FK "所属設問ID"
        string text "選択肢のテキスト"
        int order "表示順 (default: 0)"
    }

    SUBMISSION {
        int id PK
        int surveyId FK "対象アンケートID"
        datetime submitted_at "提出日時"
    }

    ANSWER {
        int id PK
        int submissionId FK "どの提出の一部か"
        int questionId FK "どの設問への回答か"
        string text "自由記述用テキスト (nullable)"
    }

    %% TypeORMの @JoinTable() が自動生成する中間テーブル
    ANSWER_OPTION {
        int answerId PK, FK "回答ID"
        int questionOptionId PK, FK "選択肢ID"
    }