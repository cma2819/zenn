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
    
    describe('listUsers', () => {

        test('returns all users', async () => {
            await refreshDatabase(async (manager) => {
                const repository = new PgUserRepository(manager);
                const users = await Promise.all([
                    repository.save({ name: { first: 'Yamada', last: 'Taro'}, age: 20 }),
                    repository.save({ name: { first: 'Tanaka', last: 'Kakuei'}, age: 75 }),
                    repository.save({ name: { first: 'Otani', last: 'Shohei'}, age: 28 }),
                ])

                const results = await repository.listUsers();
                expect(results).toContainEqual(users[0]);
                expect(results).toContainEqual(users[1]);
                expect(results).toContainEqual(users[2]);
            })
        });
    });

    describe('save', () => {

        test('saves user with new id', async () => {
            await refreshDatabase(async (manager) => {
                const repository = new PgUserRepository(manager);
                await Promise.all([
                    repository.save({ name: { first: 'Yamada', last: 'Taro'}, age: 20 }),
                    repository.save({ name: { first: 'Tanaka', last: 'Kakuei'}, age: 75 }),
                    repository.save({ name: { first: 'Otani', last: 'Shohei'}, age: 28 }),
                ])

                const saved = await repository.save(newUser(makeName('Matsui', 'Hideki'), 48));

                expect(saved.id).not.toBeNull();
                expect(saved.name.first).toEqual('Matsui');
                expect(saved.name.last).toEqual('Hideki');
                expect(saved.age).toEqual(48);
            });
        })

        test('saved user already exists, it should be updated', async () => {
            await refreshDatabase(async (manager) => {
                const repository = new PgUserRepository(manager);
                const [, tanaka, ] = await Promise.all([
                    repository.save({ name: { first: 'Yamada', last: 'Taro'}, age: 20 }),
                    repository.save({ name: { first: 'Tanaka', last: 'Kakuei'}, age: 75 }),
                    repository.save({ name: { first: 'Otani', last: 'Shohei'}, age: 28 }),
                ])

                const agedTanaka = ageUser(tanaka);

                const saved = await repository.save(agedTanaka);
    
                expect(saved.age).toEqual(76);
                expect(await repository.getUser(tanaka.id as number)).toEqual(saved);
            });
        })
    })
})