``` mermaid
erDiagram
    SURVEY ||--o{ QUESTION : ""
    SURVEY ||--o{ RESPONSE : ""
    QUESTION ||--o{ ANSWER : ""
    RESPONSE ||--o{ ANSWER : ""

    SURVEY {
        int id PK
        string title "アンケートタイトル"
        boolean is_active "公開状態"
        datetime created_at
    }

    QUESTION {
        int id PK
        int survey_id FK "所属アンケート"
        string type "設問タイプ(radio, check, text...)"
        string label "設問文"
        json options "選択肢(JSON)"
        int order_no "表示順"
    }

    RESPONSE {
        int id PK
        int survey_id FK "どのアンケートへの回答か"
        datetime submitted_at
    }

    ANSWER {
        int id PK
        int response_id FK "どの送信の一部か"
        int question_id FK "どの設問への回答か"
        json content "実際の回答内容(JSON)"
    }
    