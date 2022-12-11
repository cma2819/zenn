---
title: "React + Material UI で名刺を作ってみた"
emoji: "📇"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["react", "nextjs", "typescript"]
published: false
---

最近、趣味で関わっているRTAのコミュニティでは、オフイベントで顔を合わせた際にオリジナルの名刺で自己紹介するのが流行しています。

デザインするツールを持ち合わせていなかったり、そもそもデザインの知見もなかったので、 GitHub Pages で公開しているプロフィールページをもとに React + Material UI でデザインしてみよう、ということでやってみました。

# プロフィールページ

GitHub Pages でドメインを割り当てて公開しています。

https://cmario.net

構成は以下の通りです。

- Next.js + TypeScript
  - [GitHub Actions](https://github.com/peaceiris/actions-gh-pages) で master の内容を静的ビルド、デプロイ
  - 今は[公式で提供されているよう](https://github.blog/2022-08-10-github-pages-now-uses-actions-by-default/)なのでこちらの方がよいかも
- Material UI

## Next.js

https://nextjs.org/

API Route や SSR 等のサーバーサイド機能は使えませんが、事前ビルドによる静的ページの提供を前提に採用しています。

そもそも自己紹介ページを作ったのが Next.js の入門のためだったので、そのまま使い続けています。`next build` `next export` のおかげでバンドラを意識する必要がないので、この用途においても十分に恩恵はあります。

## Material UI

https://mui.com/

ドキュメントで書かれている通りに実装してもある程度整った見た目になってくれること、Flex や Grid Layout がコンポーネントの API で提供されて扱いやすいことなどから、好んで使っています。

# アプローチとアイデア

Web上に公開したページをどう名刺にするかですが、アプローチとしてはシンプルで、

1. ブラウザの印刷機能で PDF 化する
2. PDF を入稿に使える業者を選定して入稿、印刷してもらう

といった方針にしました。

せっかくこのような方法を取るので、最低限のこだわりとして、

- PDF化後の加工は基本的にはしない
  - 加工せずとも入稿できる程度のデザインになるようにする
- Webページとしての体裁も崩さない
- 名刺からWeb上のページにアクセスできるようにする
  - Webページがもとになっていることが伝われば嬉しい

この辺りを意識して実装しました。

# 名刺用のページ

印刷元のページが[こちら](https://cmario.net/card)です。

これを印刷して入稿、完成したのが前述の写真のものなのですが、掘り下げられそうなポイントだけ取り上げてみます。

## 配置は flex でレスポンシブに

Web上で見ても名刺上でも配置が崩れないことが要件なので、flex を活用します。

Mui には [Grid Component](https://mui.com/material-ui/react-grid/) という直感的に flex レイアウトを実装できるコンポーネントがある他、各コンポーネントに flex に関する API が共通して定義されているため、CSS なしで flex の実装ができました。

```tsx
<Grid container direction='column' sx={{
  height: '100vh',
  padding: 2,
}}>
  <Grid item xs>
    // 自動リサイズしてほしい要素, メインで表示したい名前など
  </Grid>

  <Grid item>
    // 最低限のサイズにしてほしい要素, SNS情報など
  </Grid>
</Grid>
```

```tsx
<Box
  display='flex'
  flexDirection='column'
  justifyContent='center'
  alignItems='center'
  sx={{
    height: '100vh',
    '@media not print': {
      display: 'none',
    }
  }}
>
  <Stack
    alignItems='center'
    spacing={2}
  >
    <QrCode />
    <AddressBar />
  </Stack>
</Box>

```

## 名刺には載せたくないものは `@media print` で表現

関連ページへのリンクなどは、Web上はリンクとしてスタイルが効いて欲しいですが、名刺に載る上では不要なスタイルになります。

こういったものは印刷時にのみ有効になる CSS `@media print` を使います。

```tsx
const CardLink = styled(Link)({
  '@media print': {
    color: 'inherit',
    textDecoration: 'none',
  }
});
```

## Webページへの導線デザイン

Webページと名刺のリンク感が出たらいいなと、Safari のアドレスバー風にしてみました。気に入ってます。

![](https://storage.googleapis.com/zenn-user-upload/6cec84931d9b-20221212.png)

# 完成品

完成したものがこちらです。

![](https://storage.googleapis.com/zenn-user-upload/f768f78e1e00-20221212.jpg)
![](https://storage.googleapis.com/zenn-user-upload/0b6294101db4-20221212.jpg)

文字ちっちゃ～～～～～～い。

わかりやすい反省点はあるものの、概ねやりたかったことはできたので、あとはプロフィールページをアップデートしていくのみですね。

# おわりに

デザイン的には無個性な名刺ですが、「作り方」という見えないところで少し凝ってるところが個人的には好きです。エンジニアらしくて。

プロフィールが更新されても名刺の更新が容易なのもいいですね。今後もアップデートしていこうと思います。名刺のどこかにバージョンでも載せてもいいかもしれないですね。