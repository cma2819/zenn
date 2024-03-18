---
title: "Pkl 入門してみた"
emoji: "📘"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["pkl"]
published: false
---

設定ファイル管理のために開発されたプログラミング言語 PKL に入門してみた記録です。

https://pkl-lang.org/index.html

## 環境構築

公式ドキュメントに従って導入していきますが、 Windows 向けのインストール方式がなく、 jar をインストールするのも何かアレなので、Docker でたてた適当な Linux 上にインストールしてみます

Oracle Linux でテスト済みとのことなので、それに従って Oracle Linux のイメージを採用してみます

```Dockerfile
FROM oraclelinux:8-slim

RUN curl -L -o pkl https://github.com/apple/pkl/releases/download/0.25.2/pkl-linux-amd64
RUN chmod +x pkl
CMD ["./pkl", "--version"]
```

```sh
docker build --pull --rm -f "work\pkl\Dockerfile" -t zenn-pkl:latest "work\pkl" 
docker run --rm zenn-pkl:latest
# Pkl 0.25.2 (Linux 5.15.0-1050-aws, native)
```

pkl コマンドを呼びやすいようにちょっと修正

```Dockerfile
FROM oraclelinux:8-slim

RUN curl -L -o pkl https://github.com/apple/pkl/releases/download/0.25.2/pkl-linux-amd64
RUN chmod +x pkl
ENTRYPOINT [ "./pkl" ]
```

```sh
docker run --rm zenn-pkl:latest --version
# Pkl 0.25.2 (Linux 5.15.0-1050-aws, native)
```

## チュートリアルを触ってみる

### VSCode 拡張

`.pkl` ファイルを触るにあたってさすがにハイライトくらいは効いて欲しい

VSCode Marketplace では配布していないが、公式が拡張を提供していた

https://pkl-lang.org/vscode/current/installation.html

```sh
code --install-extension pkl-vscode-0.17.0.vsix
# Installing extensions...
# (node:13708) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
# (Use `Code --trace-deprecation ...` to show where the warning was created)
# Extension 'pkl-vscode-0.17.0.vsix' was successfully installed.
```

![](https://storage.googleapis.com/zenn-user-upload/bd18aad3b3d4-20240318.png)

コードハイライトがつくようになりました！嬉しい

### 基本の例

```pkl:intro.pkl
name = "Pkl: Configure your Systems in New Ways"
attendants = 100
isInteractive = true
amountLearned = 13.37
```

`eval` で pkl ファイルを評価、出力する

`-f` オプションでフォーマットを指定できる。結構選択肢が多い。

- json
- jsonnet
- pcf
- plist
- properties
- textproto
- xml
- yaml

```json
{
  "name": "Pkl: Configure your Systems in New Ways",
  "attendants": 100,
  "isInteractive": true,
  "amountLearned": 13.37
}
```

```yaml
name: 'Pkl: Configure your Systems in New Ways'
attendants: 100
isInteractive: true
amountLearned: 13.37
```

まぁなるほどという感じ

チュートリアルでは Properties, Elements, Entries など細かい定義もあるが、一旦割愛

### Amending

`Amending` は、他の設定ファイルを拡張する仕組みで、継承みたいなことができる。

```pkl
bird {
  name = "Pigeon"
  diet = "Seeds"
  taxonomy { // Object をネストする書き方
    kingdom = "Animalia"
    clade = "Dinosauria"
    order = "Columbiformes"
  }
}

parrot = (bird) {
  name = "Parrot"
  diet = "Berries"
  taxonomy {
    order = "Psittaciformes"
  }
}
```

これを eval すると以下のようになる。

```sh
docker run --rm zenn-pkl:latest eval -f yaml ./src/amendingObjects.pkl
```

```yaml
bird:
  name: Pigeon
  diet: Seeds
  taxonomy:
    kingdom: Animalia
    clade: Dinosauria
    order: Columbiformes
parrot:
  name: Parrot
  diet: Berries
  taxonomy:
    kingdom: Animalia
    clade: Dinosauria
    order: Psittaciformes
```

`parrot` は `bird` のうち異なるプロパティを上書きしている。

### Types

型を定義することで、よりファイル評価時のチェックを厳密にすることができる。

```pkl:amendingObjectsWithType.pkl
class Taxonomy {
  kingdom: String
  clade: String
  order: String
}

class Definition {
  name: String
  diet: String
  taxonomy: Taxonomy
}

bird: Definition = new {
  name = "Pigeon"
  diet = "Seeds"
  taxonomy {
    kingdom = "Animalia"
    clade = "Dinosauria"
    order = "Columbiformes"
  }
}

parrot = (bird) {
  name = "Parrot"
  diet = "Berries"
  taxonomy {
    order = "Psittaciformes"
  }
}
```

Amending では、元となるオブジェクトに存在しないプロパティを追加することができない（型を変えることはできない）。

```pkl:amendingObjectsButAddProp.pkl
class Taxonomy {
  kingdom: String
  clade: String
  order: String
}

class Definition {
  name: String
  diet: String
  taxonomy: Taxonomy
}

bird: Definition = new {
  name = "Pigeon"
  diet = "Seeds"
  taxonomy {
    kingdom = "Animalia"
    clade = "Dinosauria"
    order = "Columbiformes"
  }
}

parrot = (bird) {
  name = "Parrot"
  diet = "Berries"
  taxonomy {
    order = "Psittaciformes"
  }
  speaking = true
}
```

上記は eval するとエラーになる

```sh
docker run --rm zenn-pkl:latest eval -f yaml ./src/amendingObjectsButAddProp.pkl
–– Pkl Error ––
Cannot find property `speaking` in object of type `amendingObjectsButAddProp#Definition`.

29 | speaking = true
     ^^^^^^^^
at amendingObjectsButAddProp#parrot (file:///src/amendingObjectsButAddProp.pkl, line 29)

Available properties:
diet
name
taxonomy

106 | text = renderer.renderDocument(value)
```

### Modules

`.pkl` ファイルの単位でモジュールとなり、外部のモジュールから import することができる。

```pkl:modules/pigeon.pkl
name = "Common wood pigeon"
diet = "Seeds"
taxonomy {
  species = "Columba palumbus"
}
```

```pkl:parrot.pkl
import "modules/pigeon.pkl"

parrot = (pigeon) {
  name = "Great green macaw"
  diet = "Berries"
  taxonomy {
    species = "Ara ambiguus"
  }
}
```

```sh
docker run --rm zenn-pkl:latest eval -f yaml ./src/parrot.pkl
```

```yaml
parrot:
  name: Great green macaw
  diet: Berries
  taxonomy:
    species: Ara ambiguus
```

以下のように `amends` を用いると、他のモジュールを再利用したモジュールを再定義することができる。

```pkl:parrotWithAmends
amends "modules/pigeon.pkl"

name = "Great green macaw"
```

```sh
docker run --rm zenn-pkl:latest eval -f yaml ./src/parrotWithAmends.pkl
```

```yaml
name: Great green macaw
diet: Seeds
taxonomy:
  species: Columba palumbus
```

イメージとしては、 `.env.base` 的なものがあり、これを amends して `.env.local` を構築、さらに amends して、個人毎の差異を埋めて `.env` ができる、みたいなことが可能な感じ。

### Template

pkl の特徴として、 `.pkl` ファイルはモジュールとしても、テンプレートとしても扱うことができ、コード定義の段階ではここに差異はないらしい。

例えば以下の .pkl は、

```pkl:templates/acmecicd.pkl
module temp.acmecicd // モジュールに名前をつけることもできる（URIインポート時に活用されたりするらしい）

class Pipeline {
  name: String(nameRequiresBranchName)?

  hidden nameRequiresBranchName = (_) ->
      if (branchName == null)
        throw("Pipelines that set a 'name' must also set a 'branchName'.")
      else true

  branchName: String?
}

// 誓約つきの型
timeout: Int(this >= 3)

pipelines: Listing<Pipeline>

output {
  // output.renderer を定義すると、モジュールを eval したときの出力を決められる
  renderer = new JsonRenderer {}
}
```

これを以下のような pkl ファイルで扱えば、テンプレートのように活用できる。

```pkl
amends "templates/acmecicd.pkl"

timeout = 3
pipelines {
  new {
    name = "prb"
    branchName = "main"
  }
}
```

```

```sh
docker run --rm zenn-pkl:latest eval -f yaml ./src/cicd.pkl
```

```json
{
  "timeout": 3,
  "pipelines": [
    {
      "name": "prb",
      "branchName": "main"
    }
  ]
}
```

この辺り公式でも「どれが Template、どれが Module」と言っていることがなく、この双方に垣根がない（如何様にも再利用可能）なことが特徴なんだと理解した。

## 型付けいろいろ

### Class

Class はオブジェクトの型表現になる

```pkl
class Event {
  name: String

  year: Int
}

event: Event
```

### Listing, Mapping

オブジェクトのコレクションには `Listing` `List` （使い分けがあるらしいが、文章だけだとわからなかった）

```pkl
class Session {
  time: Duration

  date: String
}

sessions: Listing<Session>
```

キーバリューを持つには `Mapping`

```pkl
assistants: Mapping<String, String>
```

### プリミティブ

時間やデータサイズのための表現なんかもある

```pkl
name: String

part: Int

hasExercises: Boolean = true

amountLearned: Float = 13.37

duration: Duration = 30.min

bandwidthRequirementPerSecond: DataSize = 50.mb
```

## パッケージの公開

エアプですが、`pkl project package` で作成したパッケージを配布できるみたい。

https://pkl-lang.org/main/current/pkl-cli/index.html#command-project-package

HTTPS サーバー上で公開しておけば、パッケージとして import して再利用できる。

パッケージ化せずとも、 `.pkl` ファイル自体を置いておくだけでもいいっぽい。

## 所感

- 本質的な強みはモジュールの配布と再利用にありそう
- tsconfig の `extends` だったり、`.env` の上書きだったり、ものによってバラバラだった設定周りの仕組みを考えないで良いのは嬉しい
- 一方で、どうしても `.pkl` から設定ファイルをレンダーしないといけないのはひと手間ある
  - ビルトインで設定を読む側がサポートしてくれると嬉しいが、各言語のインテグレーションはまだまだみたい
- 手ごたえはとてもいいので、個人開発で使ってみようかなと思いました