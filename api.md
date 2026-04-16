# Schema Types

<details>
  <summary><strong>Table of Contents</strong></summary>

- [Query](#query)
- [Mutation](#mutation)
- [Objects](#objects)
  - [Answer](#answer)
  - [CorrelationResult](#correlationresult)
  - [LoginResponse](#loginresponse)
  - [OptionResult](#optionresult)
  - [Question](#question)
  - [QuestionOption](#questionoption)
  - [QuestionResult](#questionresult)
  - [Submission](#submission)
  - [Survey](#survey)
  - [SurveyResult](#surveyresult)
  - [User](#user)
- [Inputs](#inputs)
  - [AnswerInputType](#answerinputtype)
  - [CreateSurveyInput](#createsurveyinput)
  - [EditSurveyInput](#editsurveyinput)
  - [QuestionInput](#questioninput)
  - [SubmitSurveyAnswerInput](#submitsurveyanswerinput)
- [Scalars](#scalars)
  - [Boolean](#boolean)
  - [DateTime](#datetime)
  - [Float](#float)
  - [ID](#id)
  - [Int](#int)
  - [String](#string)

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
<td colspan="2" valign="top"><strong id="mutation.signup">signUp</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">username</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">password</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="mutation.login">login</strong></td>
<td valign="top"><a href="#loginresponse">LoginResponse</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">username</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">password</td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
</tbody>
</table>

## Objects

### Answer

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
<td colspan="2" valign="top"><strong id="answer.id">id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answer.text">text</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answer.selectedoptions">selectedOptions</strong></td>
<td valign="top">[<a href="#questionoption">QuestionOption</a>!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answer.question">question</strong></td>
<td valign="top"><a href="#question">Question</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answer.submission">submission</strong></td>
<td valign="top"><a href="#submission">Submission</a>!</td>
<td></td>
</tr>
</tbody>
</table>

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
<td colspan="2" valign="top"><strong id="correlationresult.option1id">option1Id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="correlationresult.option2id">option2Id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="correlationresult.cooccurrencecount">coOccurrenceCount</strong></td>
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
<td colspan="2" valign="top"><strong id="optionresult.optionid">optionId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="optionresult.text">text</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="optionresult.count">count</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="optionresult.percentage">percentage</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
</tbody>
</table>

### Question

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.qtext">qtext</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.options">options</strong></td>
<td valign="top">[<a href="#questionoption">QuestionOption</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.survey">survey</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="question.answers">answers</strong></td>
<td valign="top">[<a href="#answer">Answer</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### QuestionOption

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionoption.text">text</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionoption.order">order</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionoption.question">question</strong></td>
<td valign="top"><a href="#question">Question</a>!</td>
<td></td>
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
<td colspan="2" valign="top"><strong id="questionresult.questionid">questionId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.qtext">qtext</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.totalanswersforthisquestion">totalAnswersForThisQuestion</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questionresult.options">options</strong></td>
<td valign="top">[<a href="#optionresult">OptionResult</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### Submission

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
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submission.submitted_at">submitted_at</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submission.survey">survey</strong></td>
<td valign="top"><a href="#survey">Survey</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submission.answers">answers</strong></td>
<td valign="top">[<a href="#answer">Answer</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### Survey

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
<td colspan="2" valign="top"><strong id="survey.id">id</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.shareid">shareId</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.owner">owner</strong></td>
<td valign="top"><a href="#user">User</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.questions">questions</strong></td>
<td valign="top">[<a href="#question">Question</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.published">published</strong></td>
<td valign="top"><a href="#boolean">Boolean</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.created_at">created_at</strong></td>
<td valign="top"><a href="#datetime">DateTime</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="survey.submissions">submissions</strong></td>
<td valign="top">[<a href="#submission">Submission</a>!]!</td>
<td></td>
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
<tr>
<td colspan="2" valign="top"><strong id="surveyresult.questions">questions</strong></td>
<td valign="top">[<a href="#questionresult">QuestionResult</a>!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="surveyresult.correlations">correlations</strong></td>
<td valign="top">[<a href="#correlationresult">CorrelationResult</a>!]</td>
<td></td>
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
<td colspan="2" valign="top"><strong id="user.username">username</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="user.surveys">surveys</strong></td>
<td valign="top">[<a href="#survey">Survey</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

## Inputs

### AnswerInputType

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
<td colspan="2" valign="top"><strong id="answerinputtype.questionid">questionId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answerinputtype.text">text</strong></td>
<td valign="top"><a href="#string">String</a></td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="answerinputtype.selectionids">selectionIds</strong></td>
<td valign="top">[<a href="#int">Int</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### CreateSurveyInput

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
<td colspan="2" valign="top"><strong id="createsurveyinput.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="createsurveyinput.questions">questions</strong></td>
<td valign="top">[<a href="#questioninput">QuestionInput</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### EditSurveyInput

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
<td colspan="2" valign="top"><strong id="editsurveyinput.id">id</strong></td>
<td valign="top"><a href="#float">Float</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="editsurveyinput.title">title</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="editsurveyinput.questions">questions</strong></td>
<td valign="top">[<a href="#questioninput">QuestionInput</a>!]!</td>
<td></td>
</tr>
</tbody>
</table>

### QuestionInput

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
<td colspan="2" valign="top"><strong id="questioninput.qtext">qtext</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questioninput.type">type</strong></td>
<td valign="top"><a href="#string">String</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="questioninput.options">options</strong></td>
<td valign="top">[<a href="#string">String</a>!]</td>
<td></td>
</tr>
</tbody>
</table>

### SubmitSurveyAnswerInput

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
<td colspan="2" valign="top"><strong id="submitsurveyanswerinput.surveyid">surveyId</strong></td>
<td valign="top"><a href="#int">Int</a>!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong id="submitsurveyanswerinput.answers">answers</strong></td>
<td valign="top">[<a href="#answerinputtype">AnswerInputType</a>!]!</td>
<td></td>
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
