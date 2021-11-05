---
title: "【2020年版】1から学ぶNodeCG#1：NodeCG導入編"
emoji: "📹"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["javascript", "nodejs", "nodecg"]
published: true
---

# はじめに

主に海外のRTAコミュニティで活用され、国内では[RTA in Japan](https://rtain.jp)をキッカケに注目されてきた**NodeCG**ですが、ここ1～2年ほどで国内でもNodeCGによる配信レイアウトが散見されるようになりました。

それはRTAコミュニティに留まらず、自分の知る限りでは格闘ゲームやスプラトゥーン向けのものもあるようです。

RTAコミュニティ内、特にイベント運営に関わる方々の間では**NodeCG**という固有名詞もかなり一般的になり、NodeCGを使ってみたい！レイアウトを作ってみたい！という方も多くいるようなので、改めて導入方法～実際にレイアウトを作ってみるところまでを紹介できればいいなと思っています。

::: message
本記事は、以前Qiitaに投稿したものを現在の情報に更新したものです。本記事以降はZennにて書き進めていく予定です。
:::

# 対象読者

- NodeCGについてよく知らないが、とにかく動かしてみたい人
- ゆくゆくはNodeCGで配信レイアウトを作成したいが、何をしたら良いかわからない人
- NodeCGの公式ドキュメントであっても、英語を読むことだけは避けたい人

# NodeCGとは

NodeCGはNode.jsのフルスタックフレームワークです。主にライブ配信のレイアウト（オーバーレイ）を作成することを目的としています。

配信レイアウトを構成する基本的なアーキテクチャや、リアルタイム性の高いデータベースシステム、外部からファイルを注入するアセット機能など、配信レイアウト作成に特化した様々な仕組みを提供してくれています。

NodeCGについてより詳しく知りたい方は、NodeCGのメンテナーでもあるHoishinさんの記事[ライブ配信レイアウトを作るNode.jsのフレームワーク(Qiita)](https://qiita.com/Hoishin/items/36dcea6818b0aa9bf1cd)をご一読ください。

小難しいことは一旦置いておいて手を動かしたい！という方は、とりあえず以下の引用だけご認識いただければと思います。

> 噛み砕くと
> Twitch、YouTube Live、ニコニコ生放送などのライブ配信で
> 動的でリッチな見た目の画面表示を作るための
> 大枠の仕組みを提供するフルスタックフレームワーク
> です。

要するに、**ライブ配信上のレイアウトを作成・操作・表示**するための枠組みを提供してくれるのがこのNodeCGです。

この導入編では、今ブラウザでこの記事を見ているだけの状態から、NodeCGを実行するまでの手順を記載していきます。

# 公式ドキュメントを読もう！

まずはNodeCGについての情報源である公式ドキュメントを読むことにします。NodeCGのウェブサイトは[こちら](https://www.nodecg.dev/)です。ブックマークしましょう。

![NodeCG ウェブサイトトップ](https://storage.googleapis.com/zenn-user-upload/zl1tp1sov6khqhu9p3k0n77lxroh)

NodeCGの機能説明や仕様が載っています。日本語の情報は現状ほぼないので、基本的にはこのページと既存のプログラムを見てお勉強することになります。

この記事でも、基本は公式ページの記載に則って導入を進めていこうと思います。

# Installing NodeCG - NodeCGのインストール

ドキュメントのインストール手順に従って、インストールを進めます。

[https://www.nodecg.dev/docs/installing](https://www.nodecg.dev/docs/installing)

インストール手順が記載されているので、順番に進めていきましょう。

## Node.jsのインストール

> Install Node.js (version 8.3 or greater) & npm (version 2 or greater). 

NodeCGは**Node.js**というプログラミング技術上で動作するフレームワークなので、Node.jsのインストールが必要です。また、Node.jsのライブラリ管理ツールである**npm**も必要になりますが、こちらはNode.jsと同時にインストールされます。

Node.jsは、JavaScriptというプログラミング言語をサーバ上で実行する技術です。JavaScript自体はWebブラウザでの動作が主目的なのに対して、Node.jsは主にWebアプリケーション開発に使われています。詳しく知りたい方は[こちらの記事（Qiita）](https://qiita.com/hshimo/items/1ecb7ed1b567aacbe559)が概要としてはオススメです。

ドキュメント上のリンクから、Node.jsのウェブサイトに飛べます。Node.jsのページには[日本語版もあります](https://nodejs.org/ja/)。

![Node.js 日本語](https://storage.googleapis.com/zenn-user-upload/tyejnykblzvyswqd3fanzo50bgep)

NodeCGのドキュメントではバージョン8.3以上と指定されていますが、特に事情がない限りLTS(Long Time Support)のバージョンをインストールしましょう。レイアウトによってはNode.jsのバージョンが指定されているものもありますが、今は気にしなくて良いと思います。

Windows環境であればインストーラがダウンロードできるので、インストーラを起動してインストールを進めていけばOKです。保存先ディレクトリ等の指定がしたい場合は、インストーラ上で適宜行ってください。

![](https://storage.googleapis.com/zenn-user-upload/6oy9pl6xbuzu7lvw9jwfkctn9ckx)

Node.jsのインストールが完了すると、以下のコマンドでバージョンを確認できます。

```
$ node --version
v14.15.0
$ npm --version
7.0.7
```

前述の通り、Node.jsをインストールするとnpmも一緒にインストールされます。npmはNode.jsのパッケージ管理ツールで、Node.js開発時に使用するパッケージのインストール・アンインストールや、共有するための機能などなどを行います。今後も**npm**で外部パッケージをインストールして利用します。

詳しいことはググっていただければと思います。その辺りは一旦置いておきたい、という方も、**nodeコマンドが出てきたら、Node.jsを使っている**とか、**npmコマンドが出てきたら、npmでパッケージをいじっているんだな**くらいの認識はしておくことをオススメします。

## nodecg-cli

ここまででNodeCGに必要なNode.jsとnpmのインストールが完了しました。

いよいよNodeCG本体のインストールに進みますが、ドキュメント上では2つの方法が記載されています。

> Using nodecg-cli:

> Cloning from GitHub:

ここでは**nodecg-cli**を用いたインストール方法を記載します。今後もこのCLIツールを用いる機会が多いため、この時点で導入しておきます。

nodecg-cliは、NodeCGを扱う上で便利な操作をコマンドとして揃えてくれているツールです。NodeCG本体のインストールや、各種レイアウトを外部からインストールしたり、設定ファイルを作成したりと、NodeCGレイアウトの開発中にはよく登場します。

nodecg-cliのインストールには、npmを使います。ドキュメントに記載されている、インストールコマンドを実行します。

```
npm install --global nodecg-cli
```

`npm install`ではnpmで管理されているパッケージをインストールします。デフォルトではコマンドを実行しているディレクトリ上にインストールしますが、オプション`--global`を指定することで、どのディレクトリでも実行できるものとしてインストールできます。コマンドについての詳細な説明は各自ググってみてください。

これで`nodecg-cli`のインストールは完了しました。試しにコマンドで`nodecg`を実行してみてください。nodecg-cliの使い方が表示されます。

```
$ nodecg
Usage: nodecg <command> [options]

Options:
  -V, --version                 output the version number
  -h, --help                    output usage information

Commands:
  defaultconfig [bundle]        Generate default config from configschema.json
  install [options] [repo]      Install a bundle by cloning a git repo. Can be a GitHub owner/repo pair or a git url.
                    If run in a bundle directory with no arguments, installs that bundle's dependencies.
  schema-types [options] [dir]  Generate d.ts TypeScript typedef files from Replicant schemas and configschema.json (if present)
  setup [options] [version]     Install a new NodeCG instance
  start                         Start NodeCG
  uninstall [options] <bundle>  Uninstalls a bundle.
```

## NodeCG本体のインストール

ここからいよいよNodeCG本体をインストールします。NodeCGの本体はNode.jsで書かれたアプリケーションであり、アプリケーションを構成する一通りのファイルを用意することになります。今までのインストーラを起動してPCにインストールされるようなものとは異なるので注意です。

NodeCGを格納するディレクトリを用意し、作成したディレクトリ内で`nodecg setup`コマンドを実行します。ここでインストールしたNodeCGはいつでも削除できる使い捨て的なものなので、場所や名前はどこでも大丈夫です。公式ドキュメントでは`nodecg`という名前のディレクトリを作成しています。

```
$ mkdir nodecg
$ cd nodecg
$ nodecg setup
Finding latest release... done!
Cloning NodeCG... done!
Checking out version v1.7.1... done!
Installing production npm dependencies... done!
NodeCG (v1.7.1) installed to <作成したディレクトリ>
```

これで、用意したディレクトリ内にNodeCGの本体一式がダウンロードされ、npmで必要なパッケージがインストールされました。npmコマンドは実行していませんが、nodecg-cliが勝手にやってくれています。ちなみに、npmによってインストールされたパッケージ群は`node_modules`フォルダに保存されています。フォルダを開いてみると、非常に多くのパッケージが必要になっていることがわかると思います。

# Start - NodeCGの実行

必要なファイルも揃い、パッケージもインストールされているので、NodeCGを実行しましょう。実行手順は非常に簡単です。

> Run node index.js or nodecg start in the root nodecg folder.

NodeCGのルートディレクトリ（先ほど用意したディレクトリ上）でコマンドを実行します。ドキュメントでは`node index.js`と`nodecg start`の2つが挙げられていますが、どちらでもやることは同じです。せっかくnodecg-cliが入っているので、`nodecg start`コマンドで実行してみましょう。

```
nodecg start
[nodecg] No config found, using defaults.
info: [nodecg/lib/server] Starting NodeCG 1.7.1 (Running on Node.js v14.15.0)
info: [nodecg/lib/server] NodeCG running on http://localhost:9090
```

※LTSのNode.jsで実行した場合Warningが出るようです。ここでは気にせず続行しますが、気になる方はNode.jsのバージョンを落として試してみてください。

コマンドの最後の行に表示されたURL（デフォルトでは`http://localhost:9090`）をWebブラウザで開き、以下のような画面が表示されればNodeCGが実行されています。

![](https://storage.googleapis.com/zenn-user-upload/2g09tw3v6vk693q6lft7elog57fo)

ほぼ何も表示されていませんが、これがNodeCGの操作画面であり「ダッシュボード」と呼ばれる画面です。
今後、インストールされたNodeCGに実際のレイアウトのファイルを導入していくと、このダッシュボードに操作UIが表示されます。

コマンド上でCtrl + CすることでNodeCGは終了します。NodeCGが終了すると、先ほどのURLにアクセスしても何も表示されなくなります。

# まとめ

以上で、NodeCGを導入するための準備＋NodeCGの導入・実行までが完了しました。

始めに述べた通り、NodeCGはあくまでも**フレームワーク**であり、アプリケーションの**枠組み**です。レイアウト自体を導入しなければ、まだ何も表示できません。

ということで次回は、Bundle導入編と題して、既存のレイアウトの導入～配信ソフトでの表示までをご紹介していく予定です。
※と言いつつ前回は1年以上放置することになってしまったので、今回こそはなるべく早く次回を投稿したいです。

NodeCGがイベントで使われている例は多くはなく、日本語の情報も非常に少ないのが現状です。RTAイベントでの事例が多いですが、冒頭で述べた通りイベントの規模やゲームジャンルを問わず、様々なユースケースで活用できるフレームワークです。以下は著者が作成したNodeCGレイアウトを使用しているイベントですので、参考にしてみてください。

- [RTA 1n Kagawa Online](https://www.twitch.tv/collections/Ikv6MCif-hU0Iw)
  - RTAマラソンイベントの標準的なレイアウトとして、RTA中の情報表示やセットアップ画面の表示、投稿されたツイートのインタラクティブ表示
- [RTA Station](https://youtu.be/sg44ezuhQB8)
  - RTA中の情報表示の他、テレビ風のテロップ・ロゴ表示等
- [RTAコミュニティ内でのレース](https://youtu.be/a7LP6lYF2Jk)
  - 定例開催されるような小規模イベントでの活用。
  - 中央のビンゴ・タイマー表示と画面枠・プレイヤー名の実装を行っている。背景画像やDiscord表示、チャット表示はOBSで別途オーバーレイ。

# Discord

NodeCGコミュニティに触れてみたいという方はぜひ[Discordサーバ](https://discord.gg/NNmVz4x)へどうぞ。日本語チャンネルもあります。

以上で#1は終わりです。#2に続きます。