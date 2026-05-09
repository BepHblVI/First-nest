# Schema Types

<details>
  <summary><strong>Table of Contents</strong></summary>

  * [Query](#query)
  * [Mutation](#mutation)
  * [Objects](#objects)
    * [CorrelationResult](#correlationresult)
    * [LoginResponse](#loginresponse)
    * [OptionResult](#optionresult)
    * [Question](#question)
    * [QuestionOption](#questionoption)
    * [QuestionResult](#questionresult)
    * [SearchSurveyResult](#searchsurveyresult)
    * [Submission](#submission)
    * [Survey](#survey)
    * [SurveyResult](#surveyresult)
    * [SurveyToken](#surveytoken)
    * [User](#user)
  * [Inputs](#inputs)
    * [AnswerInput](#answerinput)
    * [CreateSurveyInput](#createsurveyinput)
    * [DateRangeInput](#daterangeinput)
    * [EditSurveyInput](#editsurveyinput)
    * [IntRangeInput](#intrangeinput)
    * [QuestionInput](#questioninput)
    * [SearchSurveyInput](#searchsurveyinput)
    * [SubmitSurveyAnswerInput](#submitsurveyanswerinput)
  * [Enums](#enums)
    * [AnswerState](#answerstate)
    * [PublishState](#publishstate)
    * [QuestionType](#questiontype)
    * [SearchScope](#searchscope)
    * [SortOrder](#sortorder)
    * [SurveyAuthType](#surveyauthtype)
    * [SurveySortField](#surveysortfield)
  * [Scalars](#scalars)
    * [Boolean](#boolean)
    * [DateTime](#datetime)
    * [Float](#float)
    * [ID](#id)
    * [Int](#int)
    * [String](#string)

</details>

## Query
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="query.getsurvey">getSurvey</strong></td>
<td valign="top">[<a href="#survey">Survey</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.getsurveyforanswer">getSurveyForAnswer</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">shareId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.getsurveyresults">getSurveyResults</strong></td>
<td valign="top"><a href="#surveyresult">SurveyResult</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">shareId</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="query.searchsurvey">searchSurvey</strong></td>
<td valign="top"><a href="#searchsurveyresult">SearchSurveyResult</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#searchsurveyinput">SearchSurveyInput</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Mutation
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="mutation.createsurvey">createSurvey</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#createsurveyinput">CreateSurveyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.deletesurvey">deleteSurvey</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.editsurvey">editSurvey</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#editsurveyinput">EditSurveyInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.login">login</strong></td>
<td valign="top"><a href="#loginresponse">LoginResponse</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">password</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">username</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.refresh">refresh</strong></td>
<td valign="top"><a href="#loginresponse">LoginResponse</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.signup">signUp</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">password</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">username</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.submitsurveyanswer">submitSurveyAnswer</strong></td>
<td valign="top"><a href="#submission">Submission</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top"><a href="#submitsurveyanswerinput">SubmitSurveyAnswerInput</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.togglepublished">togglePublished</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">published</td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Objects

### CorrelationResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="correlationresult.cooccurrencecount">coOccurrenceCount</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="correlationresult.option1id">option1Id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="correlationresult.option2id">option2Id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### LoginResponse

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="loginresponse.access_token">access_token</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### OptionResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="optionresult.count">count</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="optionresult.optionid">optionId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="optionresult.percentage">percentage</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="optionresult.text">text</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Question

アンケートの設問

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="question.id">id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

設問ID(自動採番)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.options">options</strong></td>
<td valign="top">[<a href="#questionoption">QuestionOption</a>!]!</td>
<td>

選択肢(SINGLE/MULTIPLEのときのみ要素を持つ。orderの昇順)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.order">order</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

同一アンケート内での表示順(0始まり、昇順)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.qtext">qtext</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

設問のテキスト(本文)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.required">required</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

回答必須フラグ

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.survey">survey</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td>

この設問が属するアンケート

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.type">type</strong></td>
<td valign="top"><a href="#questiontype">QuestionType</a>!</td>
<td>

設問の形式

</td>
</tr>
</tbody>
</table>

### QuestionOption

選択式質問の1つの選択肢

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="questionoption.id">id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

選択肢ID(自動採番)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionoption.order">order</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

同一質問内での表示順(0始まり、昇順)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionoption.question">question</strong></td>
<td valign="top"><a href="#question">Question</a>!</td>
<td>

この選択肢が属する設問

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionoption.text">text</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

選択肢の表示テキスト

</td>
</tr>
</tbody>
</table>

### QuestionResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.options">options</strong></td>
<td valign="top">[<a href="#optionresult">OptionResult</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.qtext">qtext</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.questionid">questionId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.totalanswersforthisquestion">totalAnswersForThisQuestion</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### SearchSurveyResult

アンケート検索結果(ページング情報付き)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyresult.hasnext">hasNext</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

次のページがあるか

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyresult.items">items</strong></td>
<td valign="top">[<a href="#survey">Survey</a>!]!</td>
<td>

検索ヒットしたアンケート(現在のページ分)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyresult.totalcount">totalCount</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

条件にマッチした総件数(ページング前)

</td>
</tr>
</tbody>
</table>

### Submission

アンケートへの1回分の回答送信

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="submission.id">id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

送信ID(自動採番)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submission.respondentid">respondentId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

回答者を識別する任意のID(クライアント発行、匿名集計用)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submission.submittedat">submittedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

送信日時

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submission.survey">survey</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td>

回答対象のアンケート

</td>
</tr>
</tbody>
</table>

### Survey

アンケート本体(設問・回答送信・トークンの集約)

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="survey.auth">auth</strong></td>
<td valign="top"><a href="#surveyauthtype">SurveyAuthType</a>!</td>
<td>

アクセス制御方式

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.createdat">createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

作成日時

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.id">id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

アンケートID(自動採番、内部用)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.owner">owner</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td>

アンケートの作成者・所有者

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.published">published</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

公開状態(true: 回答受付中 / false: 下書き、回答不可)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.questions">questions</strong></td>
<td valign="top">[<a href="#question">Question</a>!]!</td>
<td>

設問の一覧(orderの昇順)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.shareid">shareId</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

URL共有用の識別子(UUID。所有者以外でもこの値で参照可)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.submissioncount">submissionCount</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

受信した回答件数

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

アンケートのタイトル

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.tokens">tokens</strong></td>
<td valign="top">[<a href="#surveytoken">SurveyToken</a>!]!</td>
<td>

招待トークン一覧(PRIVATE時のみ。所有者にのみ返すこと。loadは明示ロードのみ)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.updatedat">updatedAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

最終更新日時

</td>
</tr>
</tbody>
</table>

### SurveyResult

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="surveyresult.correlations">correlations</strong></td>
<td valign="top">[<a href="#correlationresult">CorrelationResult</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveyresult.questions">questions</strong></td>
<td valign="top">[<a href="#questionresult">QuestionResult</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveyresult.surveyid">surveyId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveyresult.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveyresult.totalsubmissions">totalSubmissions</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### SurveyToken

PRIVATEアンケートへの回答を許可する招待トークン

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="surveytoken.createdat">createdAt</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td>

トークン発行日時

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveytoken.isused">isUsed</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td>

使用済みフラグ(trueは消費済み)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveytoken.survey">survey</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td>

このトークンが対象とするアンケート

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveytoken.token">token</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

回答用トークン値(UUID)。所有者にのみ公開すること。1回使うと無効になる

</td>
</tr>
</tbody>
</table>

### User

<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="user.id">id</strong></td>
<td valign="top"><a href="#id">ID</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="user.surveys">surveys</strong></td>
<td valign="top">[<a href="#survey">Survey</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="user.username">username</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Inputs

### AnswerInput

1問分の回答の入力値

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="answerinput.questionid">questionId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

回答対象の質問ID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answerinput.selectionids">selectionIds</strong></td>
<td valign="top">[<a href="#int">Int</a>!]</td>
<td>

選択した選択肢IDの配列(SINGLE/MULTIPLE タイプのときのみ使用)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answerinput.text">text</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

自由記述の回答テキスト(TEXTタイプの質問のときのみ使用)

</td>
</tr>
</tbody>
</table>

### CreateSurveyInput

アンケート作成の入力値

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="createsurveyinput.auth">auth</strong></td>
<td valign="top"><a href="#surveyauthtype">SurveyAuthType</a></td>
<td>

アクセス権限(PUBLIC: 誰でも回答可 / PRIVATE: トークン保有者のみ)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createsurveyinput.published">published</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

公開フラグ(true: 即時公開 / false: 下書き保存)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createsurveyinput.questions">questions</strong></td>
<td valign="top">[<a href="#questioninput">QuestionInput</a>!]!</td>
<td>

アンケートに含める設問のリスト(最低1問)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createsurveyinput.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

アンケートのタイトル

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createsurveyinput.tokens">tokens</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

生成する回答用トークン数(PRIVATE時のみ有効、0以上)

</td>
</tr>
</tbody>
</table>

### DateRangeInput

日時の範囲指定。両方省略可

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="daterangeinput.from">from</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

開始日時(この日時以降)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="daterangeinput.to">to</strong></td>
<td valign="top"><a href="#datetime">DateTime</a></td>
<td>

終了日時(この日時以前)

</td>
</tr>
</tbody>
</table>

### EditSurveyInput

アンケート編集の入力値。回答が1件以上ある場合は編集不可となる

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="editsurveyinput.auth">auth</strong></td>
<td valign="top"><a href="#surveyauthtype">SurveyAuthType</a></td>
<td>

アクセス権限(PUBLIC: 誰でも回答可 / PRIVATE: トークン保有者のみ)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="editsurveyinput.id">id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

編集対象のアンケートID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="editsurveyinput.questions">questions</strong></td>
<td valign="top">[<a href="#questioninput">QuestionInput</a>!]!</td>
<td>

更新後の設問リスト。既存の質問はすべて差し替えられる

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="editsurveyinput.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

アンケートのタイトル

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="editsurveyinput.tokens">tokens</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

再生成する回答用トークン数(PRIVATE時のみ有効、0以上)

</td>
</tr>
</tbody>
</table>

### IntRangeInput

整数値の範囲指定。両方省略可

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="intrangeinput.max">max</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

最大値(この値以下)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="intrangeinput.min">min</strong></td>
<td valign="top"><a href="#int">Int</a></td>
<td>

最小値(この値以上)

</td>
</tr>
</tbody>
</table>

### QuestionInput

アンケートの設問の入力値

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="questioninput.options">options</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td>

選択肢の一覧。SINGLE / MULTIPLE のときは必須

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questioninput.qtext">qtext</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td>

質問文(本文)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questioninput.required">required</strong></td>
<td valign="top"><a href="#boolean">Boolean</a></td>
<td>

回答必須フラグ

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questioninput.type">type</strong></td>
<td valign="top"><a href="#questiontype">QuestionType</a></td>
<td>

質問のタイプ(TEXT: 自由記述 / SINGLE: 単一選択 / MULTIPLE: 複数選択)

</td>
</tr>
</tbody>
</table>

### SearchSurveyInput

アンケート一覧の検索・絞り込み・並び替え条件

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.answerstates">answerStates</strong></td>
<td valign="top">[<a href="#answerstate">AnswerState</a>!]</td>
<td>

回答有無でのフィルタ。指定なし=すべて

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.authtypes">authTypes</strong></td>
<td valign="top">[<a href="#surveyauthtype">SurveyAuthType</a>!]</td>
<td>

アクセス権限タイプでのフィルタ。指定なし=すべて

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.createdat">createdAt</strong></td>
<td valign="top"><a href="#daterangeinput">DateRangeInput</a></td>
<td>

作成日時の範囲条件

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.keyword">keyword</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

検索キーワード(100文字以内)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.limit">limit</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

1ページあたりの取得件数(1〜100)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.offset">offset</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

取得開始位置(0以上)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.order">order</strong></td>
<td valign="top"><a href="#sortorder">SortOrder</a>!</td>
<td>

並び順(昇順/降順)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.publishstates">publishStates</strong></td>
<td valign="top">[<a href="#publishstate">PublishState</a>!]</td>
<td>

公開状態でのフィルタ。指定なし=すべて

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.scope">scope</strong></td>
<td valign="top"><a href="#searchscope">SearchScope</a>!</td>
<td>

キーワードの検索対象範囲

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.sortby">sortBy</strong></td>
<td valign="top"><a href="#surveysortfield">SurveySortField</a>!</td>
<td>

並び替えの基準フィールド

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="searchsurveyinput.submissioncount">submissionCount</strong></td>
<td valign="top"><a href="#intrangeinput">IntRangeInput</a></td>
<td>

回答件数の範囲条件

</td>
</tr>
</tbody>
</table>

### SubmitSurveyAnswerInput

アンケートへの回答送信の入力値

<table>
<thead>
<tr>
<th colspan="2" align="left">Field</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong id="submitsurveyanswerinput.answers">answers</strong></td>
<td valign="top">[<a href="#answerinput">AnswerInput</a>!]!</td>
<td>

各設問への回答(最低1件、各回答は対応する質問IDを持つ)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submitsurveyanswerinput.respondentid">respondentId</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

回答者を識別する任意のID(クライアント発行、匿名集計に利用)

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submitsurveyanswerinput.surveyid">surveyId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td>

回答対象のアンケートID

</td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submitsurveyanswerinput.token">token</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td>

回答用トークン(PRIVATEアンケートの場合は必須)

</td>
</tr>
</tbody>
</table>

## Enums

### AnswerState

アンケートに対する回答の有無

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>HAS_ANSWERS</strong></td>
<td>

回答済み(回答が1件以上ある)

</td>
</tr>
<tr>
<td valign="top"><strong>UNANSWERED</strong></td>
<td>

未回答(回答が1件もない)

</td>
</tr>
</tbody>
</table>

### PublishState

アンケートの公開状態

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>DRAFT</strong></td>
<td>

下書き(非公開)

</td>
</tr>
<tr>
<td valign="top"><strong>PUBLISHED</strong></td>
<td>

公開中

</td>
</tr>
</tbody>
</table>

### QuestionType

質問の形式

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>MULTIPLE</strong></td>
<td>

複数選択(選択肢から複数選択可)

</td>
</tr>
<tr>
<td valign="top"><strong>SINGLE</strong></td>
<td>

単一選択(選択肢から1つだけ)

</td>
</tr>
<tr>
<td valign="top"><strong>TEXT</strong></td>
<td>

テキスト入力(自由記述)

</td>
</tr>
</tbody>
</table>

### SearchScope

キーワード検索の対象範囲

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>TITLE_AND_QUESTIONS</strong></td>
<td>

タイトルと質問文の両方を検索対象にする

</td>
</tr>
<tr>
<td valign="top"><strong>TITLE_ONLY</strong></td>
<td>

タイトルのみを検索対象にする

</td>
</tr>
</tbody>
</table>

### SortOrder

並び順

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>ASC</strong></td>
<td>

昇順

</td>
</tr>
<tr>
<td valign="top"><strong>DESC</strong></td>
<td>

降順

</td>
</tr>
</tbody>
</table>

### SurveyAuthType

アンケート回答時のアクセス制御方式

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>PRIVATE</strong></td>
<td>

発行された招待トークン保有者のみ回答可能

</td>
</tr>
<tr>
<td valign="top"><strong>PUBLIC</strong></td>
<td>

誰でもURLを知っていれば回答可能

</td>
</tr>
</tbody>
</table>

### SurveySortField

アンケート一覧の並び替え基準フィールド

<table>
<thead>
<tr>
<th align="left">Value</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td valign="top"><strong>CREATED_AT</strong></td>
<td>

作成日時

</td>
</tr>
<tr>
<td valign="top"><strong>SUBMISSION_COUNT</strong></td>
<td>

回答件数

</td>
</tr>
<tr>
<td valign="top"><strong>TITLE</strong></td>
<td>

タイトル(辞書順)

</td>
</tr>
<tr>
<td valign="top"><strong>UPDATED_AT</strong></td>
<td>

更新日時

</td>
</tr>
</tbody>
</table>

## Scalars

### Boolean

The `Boolean` scalar type represents `true` or `false`.

### DateTime

A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.

### Float

The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).

### ID

The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.

### Int

The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.

### String

The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.

