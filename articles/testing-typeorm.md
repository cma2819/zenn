---
title: "TypeORM + jest で DB アクセスを伴うテストを書いてみた"
emoji: "🛠️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["typescript", "typeorm"]
published: true
---

## はじめに

TypeORM を用いたプロジェクトで、実際のDBに問い合わせるリポジトリのテストができていない課題がありました。

PHP の Web フレームワーク Laravel 等ではテスト毎にDBをリセットする仕組みがあり、リクエスト～レスポンスまで一貫してモックせずDBアクセスまでテストすることもできます。車輪の再発明感はありますが、後学のために同様の仕組みを TypeORM に対応する形で構築してみようと思います。

:::message
本記事の実装では残課題があります。参考にされる際は予め[こちら](#課題)をご参照ください。
:::

## テスト用アプリケーション

TypeORM が提供しているクイックスタートのプロジェクトがあるので、これをそのまま利用しました。

https://typeorm.io/

ここにドメインモデルやリポジトリを追加する形で実装・検証します。

### モデル・リポジトリ構築

既存の TypeORM エンティティを元に、それっぽいモデルを作成します。

```typescript:models/user.ts
import { Name } from './name';

export type User = {
    id?: number;
    name: Name;
    age: number;
}

export const newUser = (name: Name, age: number): User => {
    return {
        name,
        age
    };
}

export const ageUser = (user: User): User => {
    return {
        ... user,
        age: user.age + 1,
    };
}
```

```typescript:models/name.ts
export type Name = {
    first: string;
    last: string;
}

export const makeName = (first: string, last: string): Name => {

    if (!first || !last) {
        throw new Error("Give me name plz");
    }

    return {
        first,
        last,
    }
}
```

リポジトリも定義して、インメモリ実装とそのテストまで作ります。

```typescript:repository/user.ts
import { User } from '../models/user';
import * as Name from '../models/name';
import { AppDataSource } from '../data-source'
import { User as UserEntity } from '../entity/User';

export type UserRepository = {
    getUser: (id: number) => Promise<User | null>;
    save: (user: User) => Promise<User>;
    listUsers: () => Promise<User[]>;
}
```

```typescript:repository/user.inmemory.ts
import { describe, expect, test } from '@jest/globals';
import { makeName } from '../models/name';
import { ageUser, newUser, User } from '../models/user';
import { InmemoryUserRepository } from './user.inmemory';

describe('UserRepository implements with inmemory', () => {
    describe('getUser', () => {

        const repository = new InmemoryUserRepository([
            { id: 1, name: { first: 'Yamada', last: 'Taro'}, age: 20},
            { id: 2, name: { first: 'Tanaka', last: 'Kakuei'}, age: 75},
            { id: 3, name: { first: 'Otani', last: 'Shohei'}, age: 28},
        ]);

        test('returns user with received id', async () => {
            const user = await repository.getUser(2);
            expect(user?.id).toEqual(2);
            expect(user?.name.first).toEqual('Tanaka');
            expect(user?.name.last).toEqual('Kakuei');
            expect(user?.age).toEqual(75);
        });

        test('returns null if the user doesn\'t exist', async () => {
            expect(await repository.getUser(99)).toBeNull();
        });
    });
    
    describe('listUsers', () => {
        ...
```

https://github.com/cma2819/zenn/tree/master/works/typeorm-testing/src/repository

これとほぼ等価なテストを TypeORM を用いた実装クラスで実現することを目標にします。

## テスト用DBの構築

テスト用のDBを用意し、接続するための `DataSource` を用意します。 TypeORM は豊富なDBドライバをサポートしており、最も手軽に導入できるのは `sqlite` でしょう。

https://typeorm.io/data-source-options#sqlite-data-source-options

ただ、以下の理由で今回は `PostgreSQL` のDBを使います。

- `timestamp with time zone` を採用しているカラムがあり、sqlite では対応していなかった
- プロダクトコードに近い環境でテストすることで、バグや問題の検知率を上げたい

特に事情がなければ、テストとプロダクトで環境に差を作らない方が良いと思います。一旦手軽にテストできるようにしたいとかであれば、sqlite を使ってみるのも良いと思います。

開発用の `docker-compose` 定義にテスト用DBのサービスを追加して、テスト用の `DataSource` 定義も用意します。今回は物理的に分けてますが、論理DBだけ分ける構成でもよいと思います。

```yaml
  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: "test"
      POSTGRES_USER: "test"
      POSTGRES_DB: "test"
    ports:
      - "5432:5432"
  db-testing:
    image: postgres
    environment:
      POSTGRES_PASSWORD: "test"
      POSTGRES_USER: "test"
      POSTGRES_DB: "testing"
    ports:
      - "15432:5432"
```

```typescript:tests/data-source.ts
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entity/User"

export const TestingDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 15432,
    username: "test",
    password: "test",
    database: "testing",
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
})
```

## テスト時にDBをリセットするためのコード

Laravel を参考にDBリセット用の仕組みとして、 `refreshDatabase` と称してテスト毎にDBをリセットするコードを用意します。

以下のような戦略で実装してみました。

- テスト開始時にDBの各テーブルを削除、migration を再実行する
  - 本来は全テストの前にしたかったが、今回は各テスト毎に `beforeAll` で実行してもらう形で妥協
- テスト内のクエリを同一トランザクションで実行し、テストケース毎に rollback する

ほぼ Laravel の `RefreshDatabase` と同様の方針です。

```typescript:tests/refreshDatabase.ts
import { DataSource, EntityManager } from 'typeorm';
import { User } from '../entity/User';
import { TestingDataSource } from './data-source';

let connection: DataSource;

export const refreshDatabase = async (test: (_conn: EntityManager) => Promise<unknown>) => {
    if (!connection) {
        throw new Error('Connection must be initialized!');
    }
    const qb = await connection.createQueryRunner();
    await qb.startTransaction();
    await test(qb.manager);
    await qb.rollbackTransaction();
    await qb.release();
}

export const initConnection = async () => {
    connection = await TestingDataSource.initialize();
    await cleanTables(connection);
    const migrations = connection.migrations;
    migrations.forEach(async (_) => {
        await connection.undoLastMigration();
    });
    connection.runMigrations();
};

export const destroyConnection = async () => {
    connection.destroy();
}

const cleanTables = async (connection: DataSource) => {
    const queryRunner = connection.createQueryRunner();
    const truncates = connection.entityMetadatas.map(async (metadata) => {
        await queryRunner.query(`TRUNCATE TABLE \"${metadata.tableName}\"`);
    })

    return Promise.all(truncates);
}
```

テストコードは以下のように、`beforeAll` でセットアップ、`afterAll` で connection の破棄までして終了します。

```typescript:user.pg.spec.ts
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { User } from '../entity/User';
import { makeName } from '../models/name';
import { ageUser, newUser } from '../models/user';
import { destroyConnection, initConnection, refreshDatabase } from '../tests/refreshDatabase';
import { PgUserRepository } from './user.pg';

describe("test", () => {
    beforeAll(async () => {
        await initConnection();
    });

    afterAll(async () => {
        await destroyConnection();
    })
     
    describe('getUser', () => {
        test('returns user with received id', async () => {
            await refreshDatabase(async (manager) => {

                const [yamada,] = await Promise.all([
                    manager.save(User, {firstName: 'Yamada', lastName: 'Taro', age: 20}),
                    manager.save(User, {firstName: 'Tanaka', lastName: 'Kakuei', age: 75}),
                    manager.save(User, {firstName: 'Otani', lastName: 'Shohei', age: 28}),
                ])

                const repository = new PgUserRepository(manager);
                const user = await repository.getUser(yamada.id);
                expect(user?.name.first).toEqual('Yamada');
                expect(user?.name.last).toEqual('Taro');
                expect(user?.age).toEqual(20);
            })
        });

        test('returns null if the user doesn\'t exist', async () => {
            await refreshDatabase(async (manager) => {
                const repository = new PgUserRepository(manager);
                expect(await repository.getUser(99)).toBeNull();
            });
        });
    });

    ...
})
```

※参考 `PgUserRepository` 

https://github.com/cma2819/zenn/blob/master/works/typeorm-testing/src/repository/user.pg.ts

これで各テストケースに影響せず、実際にDBにアクセスしてリポジトリをテストすることができました。

## 課題

実用のためには、以下のような課題が残っています。

- migration の実行がテスト毎に回ってしまうので、テスト自体に時間がかかる。全テストで1度きりにしたい
- `refreshDatabase` するテストが並列で動いても問題ないか
  - これは少し実装を増やして改めて検証してみたいと思います
- postgres のシーケンスがリセットできていない。そのため連番IDがテストを跨いで連番になっている
  - DBリセット時にシーケンスも削除するような実装が必要そう

## 実装コード

今回実装したものは以下のリポジトリをご参照ください。

https://github.com/cma2819/zenn/tree/master/works/typeorm-testing