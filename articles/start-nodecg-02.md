---
title: "【2020年版】1から学ぶNodeCG#2：Bundle導入編"
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