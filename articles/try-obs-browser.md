---
title: "OBSをブラウザソースから操作する \"obs-browser\" を試してみた"
emoji: "📹"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["javascript", "nodejs", "OBS", "react"]
published: true
---

# はじめに

OBS Studio（以下 OBS） のリモートコントロールには Websocket を使う方法がありますが、「obs-browser」ではブラウザソースから OBS にアクセスすることができます。

https://github.com/obsproject/obs-browser

Websocket に比べて導入のハードルが低いため、オンラインイベントでの活用を視野に試してみることにしました。

# 導入

obs-browser は OBS のパッケージにデフォルトで含まれており、 obs-browser 自体の導入は必要ありません。

TypeScript で開発したい場合は、型定義ファイルのみ導入が必要です。

```
npm i -D @types/obs-studio
```

# 使ってみる

## OBS オブジェクトにアクセスしてみる

OBS 上のブラウザソースで開かれたページでは `window.obsstudio` で OBS オブジェクトを参照できます。

```tsx
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => {

  const obs = window.obsstudio;

  return (
    <>OBS: { obs.pluginVersion }</>
  )
}

ReactDOM.render(<App />, document.getElementById('root'));
```

![](https://storage.googleapis.com/zenn-user-upload/253dc0ff0ba6-20231205.png)

これだけ。本当にシンプルですね。

OBS 側ではブラウザからのアクセスレベルを制限することができます。

![](https://storage.googleapis.com/zenn-user-upload/ede3a63c882c-20231205.png)

デフォルトは読み取りのみ可能な権限になっているので、意図していない限りはデフォルト権限のままにしておきましょう。

## OBS からのイベントを受け取る

obs-browser は、`window` に対して OBS 操作のイベントを通知します。例えば、 `obsSceneChanged` イベントは、 OBS のシーン変化を通知するイベントです。

試しに、OBS からのイベントを受けるコンポーネントを定義して、 `obsSceneChanged` イベントを購読してみます。

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { ObsEventListener } from '../components/ObsEventListener';

const App = () => {

  const obs = window.obsstudio;

  return (
    <>
      <div>OBS: { obs.pluginVersion }</div>
      <ObsEventListener obs={obs} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'));
```

```tsx
export const ObsEventListener = ({ obs }: Props) => {

  const [ scene, setScene ] = useState<string>('');

  useEffect(() => {
    obs.getControlLevel((level) => {
      console.log(`OBS Studio control level: ${level}`);
    })
    window.addEventListener('obsSceneChanged', (event) => {
      setScene(event.detail.name);
    });
  }, [])

  return <>{ scene }</>
}
```

![](https://storage.googleapis.com/zenn-user-upload/b6197e1e10b5-20231206.png)

変化後のシーン名を取得することができました。

## OBS の情報を取得・操作する

イベントを受け取る他にも、OBS の情報を取得・権限があれば操作することもできます。

例えば以下のように、シーンの一覧を取得・ランダムにシーンを切り替えるボタンを設置してみます。

```tsx

export const ObsEventListener = ({ obs }: Props) => {

  const [ scene, setScene ] = useState<string>('');
  const [ scenes, setScenes ] = useState<string[]>([]);

  useEffect(() => {
    obs.getControlLevel((level) => {
      console.log(`OBS Studio control level: ${level}`);
    })
    window.addEventListener('obsSceneChanged', (event) => {
      setScene(event.detail.name);
    });

    obs.getScenes(scenes => {
      setScenes(scenes);
    });
  }, []);

  const pickRandomScene = () => {
    const index = Math.floor(Math.random() * scenes.length);
    return scenes[index]
  }

  const changeSceneRandom = () => {
    obs.setCurrentScene(pickRandomScene());
  }

  return <>
    { scene }
    <button type='button' onClick={changeSceneRandom}>change scene</button>
  </>
```

![](https://storage.googleapis.com/zenn-user-upload/37f4bfa5fe7a-20231206.gif)

OBS の対話モードでブラウザを操作すると、ランダムなシーンに切り替えることができました。

# ドキュメント

購読できるイベントや可能な操作の一覧は README にまとまっています。

https://github.com/obsproject/obs-browser#register-for-event-callbacks

https://github.com/obsproject/obs-browser#control-obs

# まとめ

イベントの購読や簡単な操作を試してみましたが、やはり Websocket に比べてブラウザソースを読み取るだけでいい obs-browser は手軽だなと感じました。

反面、OBS 内のソースは触れないため、用途には限度がありそうです。イベント運営ではシーンの変化と同期して音声デバイスのミュートを切り替えたかったのですが、音声デバイスも触ることができなそうです。

それでも運用次第で十分 obs-browser を活かすことはできそうです。

余談ですが、RTAイベントのレイアウトでは NodeCG という Web フレームワークを使っています。obs-browser を用いるモチベーションは、 NodeCG との親和性という点もあります。

https://www.nodecg.dev/

今後機会があれば、これらを組み合わせたレイアウトも実装してみたいと思います。
