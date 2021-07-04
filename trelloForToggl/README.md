# togglo's Description

## what is togglo

trello のタスク消化の実績時間を自動で計測してくれるツールです。
trello の作業中レーンに自分のタスクが移動すると toggl の計測を開始します。

## permissions

#### `*://*.toggl.com/*`,`*://*.trello.com/*`

以下のサイトにアクセスするために必要です。

- [toggl.com](https://toggl.com/)
- [trello.com](https://trello.com)

#### `notifications`

toggl の計測開始、計測終了をユーザに通知するために必要です。
chrome.notifications API を使用します。

#### `storage`

ユーザの togglo の設定を保存しておくために必要です。
以下の項目を storage に保存しておきます。

- 作業前を表す trello のレーンの名前
- 作業中を表す trello のレーンの名前
- 作業完了を表す trello のレーンの名前
- trello の API キー
  [ここから入手します](https://trello.com/app-key)
- trello のトークン
  入手した trello の API キーをもとに、以下の URL にアクセスして入手します。 - `https://trello.com/1/authorize?key=[your API Key]&name=&expiration=never&response_type=token&scope=read,write`
- toggl のトークン
  [toggl のプロフィール欄にある「API token」の項目です。](https://toggl.com/app/profile)

#### `background`

クロスオリジンアクセスを background で行うために必要です。
