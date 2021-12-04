---
title: "[NodeCG] イベントの演目時間を管理するバンドル \"nodecg-timekeeper\""
emoji: "🕒"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["nodecg", "react", "webpack", "nodejs"]
published: true
---

# はじめに

昨今, 技術講演やイベントのオンライン化が進んでいるかと思います.

著者は RTA コミュニティにおいてオンラインイベントを主催しておりますが, RTA のイベントにおいては以下のような課題がありました.

- RTA を数珠つなぎにリレーしていく形式のため, 各 RTA のスケジュールが流動的である
  - "13:00～14:00" といった固定時間ではなく, "1時間" を持ち時間として割り振るようなやり方が一般的
- 開始時間・終了時間が流動的であるため, プレイヤー・運営が演目の時間を管理しづらい
- 演目の経過時間を管理する人的リソースの不足や, 経過時間をプレイヤーに伝える設備への障壁
  - オンライン環境では, プレイヤーに「巻いて」「延ばして」と伝えるのが純粋に難しい

このような課題への対策の1つとして, イベントで導入している配信オーバーレイフレームワーク `NodeCG` で演目時間の管理を行ってみました.

RTA イベントに限らず, オンラインイベントでの時間管理に悩んでいる方の助けとなればと思います.

# Why NodeCG?

今回 NodeCG バンドルとして実装したのにはいくつかの理由があります.

### 配信オーバーレイのフレームワークを流用できる

イベント自体の生配信オーバーレイフレームワークが NodeCG なので, 同じ環境の別バンドルとして動かすことができます.

また, バンドル間のメッセージング機能も提供されているため, イベント用バンドルとの連携も容易です.

### リアルタイムなデータ変更に適している

NodeCG の特徴ですが, ホストを跨いだリアルタイムなデータ変更が得意です.

運営がタイマー開始の操作をすると, ほぼノータイムでタイマー映像（Webブラウザ上）に反映されます. 時間管理という特性上, データの変更に時差がないことは重要です.

### データ保持の仕組みがある

NodeCG をホストするサーバが落ちた場合にも, データを保持してくれるのも NodeCG の強みです.

RTA イベントでこのフレームワークが好まれるのは, ゲームタイマーなどの情報が配信トラブルの際にも欠落しないことが大きな理由となっています.

# インストール方法

[NodeCG](https://www.nodecg.dev/) が動作する環境が必要です.

- [NodeCG のインストール手順](https://www.nodecg.dev/docs/installing)^[日本語記事がないので公式ドキュメントです. 機会があればインストールや運用に関する記事も書きます...]

`nodecg-cli` が導入されていれば, NodeCG がインストールされたディレクトリで以下のコマンドでインストールできます.

```
nodecg install cma2819/nodecg-timekeeper
```

# 基本機能

`cma2819/nodecg-timekeeper` がインストールされた NodeCG を起動します.

```
cd nodecg
nodecg start
```

## タイマーを操作する

`http://localhost:9090/dashboard/` でダッシュボードを開きます.

![タイマー操作盤](https://storage.googleapis.com/zenn-user-upload/e9f803eefa49-20211204.png)

書くまでもない程シンプルですが, 各ボタンの説明です.

#### START

タイマーを0秒から開始します. 演目が始まったら押下します.

#### FINISH

タイマーを終了します. リセットされるので再開はできません. 演目の終了時に押下します.

終了時のタイムはパネル下部に履歴として残ります.

#### RESUME

一時停止したタイマーを再開します.

#### PAUSE

タイマーを一時停止します. 何か演目中に問題が起きた場合などに押下します.

#### RESET HISTORY

タイム履歴をクリアします. 履歴が積み上がりすぎて見づらい場合などに押してください.

## 演目の時間を共有する

経過時間は graphics として表示、共有します. `nodecg-timekeeper` 自体にシンプルなタイム表示を実装していますので, 基本的にはこちらで十分使えるかと思います.

graphics は本来配信オーバーレイグラフィックを提供しますが, そもそもは Web のページですので, ブラウザで開くことも容易です. `localhost:9090/bundles/nodecg-timekeeper/graphics/timekeeper.html` を開くと経過時間を確認できます.

![](https://storage.googleapis.com/zenn-user-upload/a3a4b0af10ba-20211204.png)

この URL を演者に共有し, 「ブラウザで表示しておいてください」と一言伝えるだけで, 演目の経過時間を共有できます.

# 他のバンドルとの連携

応用として, 他のバンドルと連携してタイマーを操作したり, 新たな graphics にタイムを表示することができます.

一例ですが, `nodecg.sendMessageToBundle()` でタイマーを開始するコードは以下のようになります.

```js
nodecg.sendMessageToBundle('nodecg-timekeeper', 'start')
  .then(() => {
    // タイマースタート後のコールバック処理
  })
  .catch((error: Error) => {
    console.error(error);
  });
```

メッセージングに関しては, 以下をご参照ください.

- [sendMessage | NodeCG](https://www.nodecg.dev/docs/classes/sendMessage)
- [cma2819/nodecg-timekeeper | Extension messages](https://github.com/cma2819/nodecg-timekeeper/blob/master/docs/md/extension.md)

各データの仕様については [こちら](https://github.com/cma2819/nodecg-timekeeper#replicant-schema) をご参照ください。

# 実装について

dashboard/graphics は React + TypeScript, extensions は TypeScript で実装し, バンドラには Webpack を利用しています.

## dashboard/graphics

シンプルな構成なので特筆すべき点はありませんが, NodeCG 上のデータ（Replicant）の読み込みには [Context](https://reactjs.org/docs/context.html) を利用しています.

:::details ReplicantProvider.tsx
```tsx:ReplicantProvider.tsx
import { clone } from 'lodash';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { History, Timekeeping } from '../nodecg/generated';
import { BundleNodecgInstance } from '../nodecg/nodecg';

interface Replicants {
  timekeeping: Timekeeping;
  history: History;
}

const defaultValues: Replicants = {
  timekeeping: {
    time: {
      display: '00:00',
      rawInSecond: 0,
    },
    status: 'finished',
  },
  history: [],
};

export const ReplicantContext = createContext<Replicants>(defaultValues);

type Props = {
  children: ReactNode;
}

export const ReplicantProvider = ({ children }: Props) => {

  const [timekeeping, setTimekeeping] = useState<Timekeeping>(defaultValues.timekeeping);
  const [history, setHistory] = useState<History>(defaultValues.history);

  useEffect(() => {
    nodecg.Replicant('timekeeping').on('change', (newVal) => {
      setTimekeeping(clone(newVal));
    });
    nodecg.Replicant('history').on('change', (newVal) => {
      setHistory(clone(newVal));
    });
  }, []);

  return (
    <ReplicantContext.Provider value={{
      timekeeping,
      history,
    }}>
      { children }
    </ReplicantContext.Provider>
  );
}
```
:::

dashboard から直接 Replicant を変更することはせず, extensions へのメッセージングを介するようにします.

::: details dashboard のコンポーネント例
```tsx:dashboard/component/Timekeeper/TimekeepingControl.tsx

type Props = {
  status: 'in_progress' | 'paused' | 'finished';
};

type MessageKey = keyof MessageMap;

export const TimekeepingControl = ({ status }: Props) => {

  const action = (message: MessageKey) => {
    (nodecg as BundleNodecgInstance).sendMessage(message);
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Button
          color="primary"
          startIcon={<FiberManualRecordIcon />}
          disabled={ status !== 'finished' }
          variant="contained"
          fullWidth
          onClick={() => { action('start') }}
        >
          Start
        </Button>
      </Grid>

    ...

    </Grid>
  )
}
```
:::

NodeCG ではエンドポイントとして html ファイルが必要なので, page コンポーネントを entry として, [HtmlWebpackPlugin](https://webpack.js.org/plugins/html-webpack-plugin/) によって html を出力しています.

:::details webpack.config
```ts:webpack.config.browser.ts
import { Configuration, Entry } from 'webpack';
import path from 'path';
import globby from 'globby';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const targets = ['dashboard', 'graphics'];

const makeBrowserConfig = (target: string): Configuration => {

  const entry: Entry = Object.fromEntries(
    // path from root (where webpack.config.ts is in)
    globby.sync(`./src/browser/${target}/pages/*.tsx`).map(
      tsx => [ path.basename(tsx, '.tsx'), tsx ]
    )
  );

  return {
    entry,
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, '../src/browser/tsconfig.json'),
            }
          },
          exclude: /node_modules/,
        },
        {
  
          test: /\.css$/i,
  
          use: ['style-loader', 'css-loader'],
  
        },
        {
          test: /\.png/,
          type: 'asset/resource',
        },
        {
  
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
  
          type: 'asset/resource',
  
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, `../${target}`),
    },
    plugins: [
      ...
      Object.keys(entry).map(
        name => new HtmlWebpackPlugin({
          title: `${name}`,
          filename: `${name}.html`,
          chunks: [name],
          template: path.resolve(__dirname, `./templates/${target}.html`),
        })
      )
    ],
  };
}

export const browserConfig: Array<Configuration> = targets.map(t => makeBrowserConfig(t));
```
:::

## extensions

こちらもシンプルな Node.js の実装ですが, タイマー部分は jest でのテストを書いています. NodeCG に依存するテストがあまりできていないのは課題ですね. 実践されている方はぜひ教えて下さい.

```shell
src/extension
│  index.ts
│  nodecg.d.ts
│  timekeeper.ts
│  tsconfig.json
│
├─lib
│      Time.ts
│      Timekeeper.ts # タイマー実装を NodeCG から疎にして,
│
└─__test__
        Timekeeper.test.ts # タイマー実装に絞ってテストを実装しています.
```

# まとめ

シンプルなタイマーバンドル **nodecg-timekeeper** のご紹介でした.

利用方法・実装ともに非常にわかりやすいと思いますので, NodeCG 導入のキッカケにぜひ使ってみてください.

また, ゲームイベントだけでなく, 技術関連の講演などでの利用報告もお待ちしています.

