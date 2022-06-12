---
title: "1から学ぶNodeCG#2：Bundle導入編"
emoji: "📹"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["javascript", "nodejs", "nodecg"]
published: false
---

# はじめに

本記事は配信オーバーレイをWebアプリケーションで実装するNode.jsのフレームワーク**NodeCG**の解説記事の**第2回目**です。

過去記事は以下からどうぞ。

- [#1：NodeCG導入編](https://zenn.dev/cma2819/articles/start-nodecg-01)

# Bundleとは

NodeCGにおけるBundle（バンドル）とは、独立した配信レイアウトの一単位です。NodeCG本体を前回用意しましたが、本体だけでは何もできません。NodeCGの機能を活用するbundleを構築することで、配信レイアウトが実現できます。

本記事では、 bundle を構成する NodeCG の機能を理解した上で、前回導入した NodeCG に既存の bundle を導入してみます。

## Replicant

Replicant とは、NodeCG におけるデータ保存の仕組みです。配信レイアウトに必要なデータを保持し、上述した dashboard, graphics 及び extensions の間でデータを共有することができます。

また、他の bundle で管理されている Replicant を読み込み・変更することもできるため、様々なレイアウトで利用できる汎用的な bundle や、メインの bundle を想定して拡張するための bundle など、柔軟な実装が可能です。

### 配信オーバーレイに特化した特徴

Replicant の特徴をいくつか紹介します。

配信レイアウトという特性上、 NodeCG で実現されるアプリケーションではリアルタイムな画面描画が求められます。
この Replicant の変更はほぼリアルタイムに各機能に通知され、高速な画面更新を実現することができます。

また、Replicant で管理されるデータはファイルに保存されるため、NodeCG が停止してしまった場合も停止前のデータを維持することができます。

### スキーマ（JSON Schema）を利用したデータ検証

Replicant にスキーマ（データの定義）を設定することで、