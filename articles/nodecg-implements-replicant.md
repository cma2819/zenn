---
title: "【NodeCG】実践Replicant"
emoji: "📹"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["javascript", "nodejs", "nodecg"]
published: false
---

# 本記事の目的

NodeCGを学習されている方の中で、Replicantの使い方で詰まった、よくわからないという声があったので、できるだけ実例に近い形で使い方を解説します。

# 対象読者

- NodeCGはある程度知っている
- NodeCGを使った開発を始めている、始めようとしている

NodeCGについては導入記事である[【2020年版】1から学ぶNodeCG#1：NodeCG導入編](https://zenn.dev/cma2819/articles/start-nodecg-01)をご参照ください。

# Replicantとは

[https://nodecg.com/docs/concepts-and-terminology#replicants](https://nodecg.com/docs/concepts-and-terminology#replicants)

Replicantについて、公式ドキュメントでは以下のように記載されています（著者訳）。

*Replicantsは、extensions、dashboard、graphicsの間でデータを保持・複製するNodeCGの仕組みです。messagesのようなイベントというよりも、Replicantsは（任意ではありますが）永続的なものです。*

ドキュメント上[messages（メッセージ）](https://nodecg.com/docs/concepts-and-terminology/#messages)という別の機能と比較されているので、この文章だけだとわかりづらい点もありますが、要は**NodeCG上のデータベースシステム＋extensions・dashboard・graphicsで同一のデータを扱う仕組み**がReplicantです。

次の一文も見てみます。

*NodeCGはReplicantsのデータベースへの即時的な接続を持っているため、サーバーサイドであるextensionsにおいてはReplicantsを同期的に読み込むことができます。ですが、dashboardやgraphicsにおいては、`change`イベントを検知して非同期的に読み込むべきです。*

dashboardやgraphicsでは、更新されたReplicantの値を表示します。明示的にReplicantの値を取得するよりも、Replicantの値が更新されるたびに描画を更新するコードを実装する方がより自然でわかりやすいはずです。詳細な実装については後述します。

# サンプルbundle

本記事用にReplicantを利用するサンプルbundleを作成しました。本記事内でのコード例もサンプルから引用しますので、別タブで表示する等して併せてご参照ください。

[train-replicants](https://github.com/cma2819/train-replicants)

# Replicantオブジェクト

NodeCGのReplicantは`nodecg.Replicant(name, *namespace, *opts)`で取得できます。扱うReplicant名を引数で指定してReplicantオブジェクトとして取得します。

オプションでデフォルト値を与えることもできます。extensionでReplicantの初期化を行う場合によく使います。

``` js:/extension/speedruncom.js
const speedruncomUsersRep = nodecg.Replicant('speedruncomUsers', {
    defaultValue: []
});
```

namespaceを与えることで他bundleのReplicantを取得することもできます。詳細は[ドキュメント](https://nodecg.com/docs/classes/replicant)をご参照ください。

# Replicantの値を更新する（書き込み）

Replicantの値を更新するには、Replicantオブジェクトの`value`プロパティを更新します。以下の例は、inputに入力された値で`runner`Replicantの値を更新します。

``` html:/dashboard/panel.html
<label for="runnerName">走者名</label>
<input type="text" name="runner-name" id="runnerName" />
<button id="updateRunnerNameBtn">更新</button>
```

``` js
document.getElementById('updateRunnerNameBtn').addEventListener('click', () => {
    const runnerName = document.getElementById('runnerName').value;
    nodecg.Replicant('runner').value = runnerName;
    // // もちろん下記のような書き方でもOK
    // const runnerRep = nodecg.Replicant('runner');
    // runnerRep.value = runnerName;
});
```

構造を持たせたければJSONのデータとして保存することもできます。以下は、Speedrun.comのAPIレスポンスデータでReplicantの値を更新しています。

``` js:/extension/speedruncom.js
axios.get(`https://www.speedrun.com/api/v1/users?lookup=${name}`)
    .then((response) => {
        speedruncomUsersRep.value = response.data.data;
    })
    .catch((err) => {
        nodecg.log.warn('Speedrun.comAPIの実行に失敗しました。');
        nodecg.log.warn(err);
    });
}
```

補足として、Speedrun.comのAPIレスポンスは以下のようなJSON形式です（<user>もまたユーザー情報を表すJSONです）。

``` json
{
  "data": [
    <user>,
    <user>,
    <user>,
    <user>,
    ...
  ]
}
```

Replicantオブジェクトのvalueを更新するだけなので、そこまで難しいことはないと思います。

# Replicantの値を取得する（読み込み）

Replicantの値を取得する方法としては、前述のReplicantオブジェクトから取得する方法と、`readReplicant`メソッドを利用する方法があります。

## Replicantオブジェクトのvalueプロパティで取得する

値の更新と同じように、`Replicant.value`で値を取得できます。

``` js
const repValue = nodecg.Replicant('hoge').value;
```

## readReplicantメソッドで取得する

[readReplicant](https://nodecg.com/docs/classes/readReplicant)メソッドでは、実行時のReplicantの値を取得します。以下のコードでは、`runner`Replicantの値を取得して後続の処理に使用しています。

``` js:/extension/speedruncom.js
const name = nodecg.readReplicant('runner');

axios.get(`https://www.speedrun.com/api/v1/users?lookup=${name}`)
    .then((response) => {
        ...
```

上記のコードはextensionでのみ動作します。dashboard及びgraphicsにおいては、Replicantの値を同期的に取得することができないので、コールバックを用いる必要があります。以下のコードは[ドキュメントからの引用](https://nodecg.com/docs/classes/readReplicant#example)です。

``` js
nodecg.readReplicant('myRep', 'some-bundle', value => {
    // I can use 'value' now!
    console.log('myRep has the value ' + value + '!');
});
```

コールバックを用いた取得の場合、`nodecg.readReplicant`実行時に即座にReplicantを用いた処理が実行されるのではなく、NodeCGサーバからReplicantの値が取得でき次第コールバックが実行されます。以下のようなコードを実装するのはNGです。

``` js
var someData = null;

nodecg.readReplicant('someRep', (value) => {
    someData = value.needData;
});

// someDataが設定された前提の処理
// このコードに到達した時点ではまだsomeDataが更新されていない
anyFun(someData);
```

dashboardやgraphicsでのReplicantの表示は、後述する`change`イベントを検知する方法を取るのが良いです。

## Replicantの変更を検知する

ReplicantはNodeCGのアプリケーション共有のデータベースです。複数のユーザが想定されている場合は、常に最新のReplicantの状態を表示しておく必要があります。

例えば、以下のようなコードでdashboardを実装したとします。

``` html
<label for="runnerName">走者名</label>
<input type="text" name="runner-name" id="runnerName" />

...

<script>
nodecg.readReplicant('runner', (runnerName) => {
    document.getElementById('runnerName').value = runnerName;
});
</script>
```

初期表示時、`nodecg.readReplicant`で`runner`Replicantを取得してinputタグに設定しています。初期表示時にはその時のReplicantの値が取得できるので、他のユーザがReplicantを変更していても反映されるでしょう。また、この後に自身でinputタグを変更・操作を行っても、Replicantの値と同等の値が表示されていることになります。

しかしながら、初期表示の後に、別のユーザが`runner`Replicantを変更した場合は、その変更がinputタグに反映されることはありません。dashboardだけを見ていると、ユーザはその変更に気づくことができず、もしかしたら大切なデータを上書きしてしまうかもしれません。

そこで、常に最新の情報を表示する必要がある場合は、以下のような実装にします。

``` html /dashboard/panel.html
<!-- html部は変更なし -->
<label for="runnerName">走者名</label>
<input type="text" name="runner-name" id="runnerName" />

```

``` js
nodecg.Replicant('runner').on('change', (newVal) => {
    document.getElementById('runnerName').value = newVal;
});
```

Replicantオブジェクトの`change`イベントを検知することで、`runner`Replicantに変更があった場合、常にdashboardのinputを更新するように変更しました。また、感覚的には初期表示後の変更を検知するように見えますが、初期表示時にも`change`イベントは発火してくれるので、`nodecg.readReplicant`による初期値取得も不要です。

graphicsも同様に、`change`イベントを検知して最新のReplicantを表示するよう実装します。

``` html: /graphics/index.html
<p>Runner: <span id="runnerName"></span></p>

<h2>Speedrun.com検索結果</h2>
<ul id="speedruncomUsers"></ul>
```

``` js
nodecg.Replicant('runner').on('change', (newVal) => {
    document.getElementById('runnerName').textContent = newVal;
});

nodecg.Replicant('speedruncomUsers').on('change', (newVal) => {
    const speedruncomUserList = document.getElementById('speedruncomUsers');

    while (speedruncomUserList.firstChild) {
        speedruncomUserList.removeChild(speedruncomUserList.firstChild);
    }

    const speedruncomUserNodes = newVal.forEach((speedruncomUser) => {
        const userElement = document.createElement('li');
        userElement.innerHTML = `
            <a href="${speedruncomUser.weblink}" target="_blank">${speedruncomUser.names.international}[${speedruncomUser.id}]</a>
        `;

        speedruncomUserList.append(userElement);
    });

})
```

ということで、dashboard/graphicsにおいては`change`イベントを検知した取得処理を原則使いましょう。

# バリデーション

[https://nodecg.com/docs/replicant-schemas](https://nodecg.com/docs/replicant-schemas)

Replicantにはjsで表現できるデータであれば文字列であろうと数値であろうとJSONであろうと何でも設定することができます。しかし、データの型というのは重要なもので、想定と異なるデータがReplicantに設定されることがバグに繋がります。それをNodeCGフレームワーク上で防ぐための**バリデーション**という仕組みがあります。

バリデーションを有効にするには、bundle内に`schemas`フォルダを作り、その中に[JSONスキーマ](http://json-schema.org/)のファイルを作成します。チェックしたいReplicant名をスキーマファイル名と統一することで、NodeCGは自動的に同名のReplicantに対してバリデーションを行います。

`runner`Replicantをバリデーションするためのファイル`/schemas/runner.json`は以下のようになっています。

``` json:/schemas/runner.json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "type": "string",
  "default": ""
}
```

この定義から、`runner`Replicantは文字列型でなければなりません。スキーマに反した値に更新しようとした場合にはNodeCGがエラーを送出し、Replicantの更新は行われません。

JSONスキーマの記法は別途お調べください。英語では公式ドキュメントの[こちら](http://json-schema.org/understanding-json-schema/)を読めば網羅できます。

Replicantオブジェクトの取得時に、デフォルト値を与えていたのはご覧になったかと思います。

``` js:/extension/speedruncom.js
const speedruncomUsersRep = nodecg.Replicant('speedruncomUsers', {
    defaultValue: []
});
```

JSONスキーマでもデフォルト値を与えることができますが、Replicant取得時のものが優先されます。Replicantオブジェクトの取得時にデフォルト値が設定されておらず、Replicantも未設定の状態の時にJSONスキーマのデフォルト値が設定されます。デフォルト値のオプション設定漏れを防ぎたいときなどには有効かと思われます。

もちろんJSONデータのバリデーションも可能です。

``` json:/schemas/speedruncomUsers.json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "type": "array",
  "items": {
    "$ref": "types/speedruncomUser.json"
  }
}
```

``` json:/schemas/types/speedruncomUser.json
{
  "$schema": "http://json-schema.org/draft-07/schema",
  "type": "object",
  "additionalProperties": true,
  "properties": {
    "id": {
      "type": "string"
    },
    "names": {
      "type": "object",
      "properties": {
        "international": {
          "type": "string"
        },
        "japanese": {
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "international",
        "japanese"
      ]
    }
  },
  "required": [
    "id",
    "names"
  ]
}
```

上記のJSONスキーマでは、`$ref`で指定することで別ファイルの定義を参照しています。こちらもJSONスキーマの記法の範疇なので、調べてみてください。

# Tips

実際のレイアウト開発で意識しているReplicantの使い方等を書いておきます。基本的には先人のコードから学んだものです。今は薄いですが気づき次第追記します。

## Replicantの更新は全てextension内で行う

Replicantの更新自体を全てextensionに実装し、dashboard/graphicsはReplicantの表示のみを行うようにしています。dashboardは[message](https://nodecg.com/docs/concepts-and-terminology#messages)でextensionに操作を伝えるようにし、extensionが操作の内容をReplicantに反映します。

Replicantの操作が全てextensionに集約されることで、Replicantを操作する実装範囲が限られるため、処理の見通しがよくなります。今回のサンプルのようなシンプルなReplicantであればこの限りではないですが、著者自身は例外なく全てextensionで実装するようにしています。

## schemaファイルからTypeScriptの型定義を出力できる

`nodecg-cli`の機能として、`schemas`内のJSONスキーマからTypeScriptの型定義ファイルを出力することができます。

```
nodecg schema-types
```

TypeScriptを用いた開発の場合、Replicantの型定義として、これで出力した型定義を利用します。また、NodeCGメンテナーのHoishinさんの[ts-nodecg](https://github.com/hoishin/ts-nodecg)`を併用することで、取得したReplicantオブジェクトに対して自然に型が効くようになります。

著者はNodeCGをキッカケにTypeScriptを始めた人間ですが、生JSでコードを書くのが苦痛に近い程度にはTypeScriptの恩恵に預かっているので、ぜひTypeScriptの導入も検討してみてください。

# 終わりに

配信オーバーレイという特性上、Replicantを扱うのはNodeCGの基本です。Replicantのリアルタイム性こそNodeCGの良さだと思いますし、このような仕組みを我々が意識せずともAPIで利用できるNodeCGフレームワークはやはり偉大だなと感じています。

著者自身もフレームワークとしては1ユーザの域を出ませんが、もう少し深く知りたい方はHoishinさんの記事の[この辺り](https://qiita.com/Hoishin/items/36dcea6818b0aa9bf1cd#%E3%81%99%E3%81%93%E3%81%97%E8%A9%B3%E3%81%97%E3%81%8F%E8%AA%AC%E6%98%8E)を読んでみたり、浅めのところからNodeCGのソースも読んでみてください。サーバサイドを少し読んだだけでも面白かったです。

NodeCGコミュニティに触れてみたいという方はぜひ[Discordサーバ](https://discord.gg/NNmVz4x)へどうぞ。日本語チャンネルもあります。
