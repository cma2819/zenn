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

        const users = [
            { id: 1, name: { first: 'Yamada', last: 'Taro'}, age: 20},
            { id: 2, name: { first: 'Tanaka', last: 'Kakuei'}, age: 75},
            { id: 3, name: { first: 'Otani', last: 'Shohei'}, age: 28},
        ];

        const repository = new InmemoryUserRepository(users);

        test('returns all users', async () => {
            const results = await repository.listUsers();
            expect(results).toContainEqual(users[0]);
            expect(results).toContainEqual(users[1]);
            expect(results).toContainEqual(users[2]);
        });
    });

    describe('save', () => {
        
        const repository = new InmemoryUserRepository([
            { id: 1, name: { first: 'Yamada', last: 'Taro'}, age: 20},
            { id: 2, name: { first: 'Tanaka', last: 'Kakuei'}, age: 75},
            { id: 3, name: { first: 'Otani', last: 'Shohei'}, age: 28},
        ]);

        test('saves user with new id', async () => {
            const saved = await repository.save(newUser(makeName('Matsui', 'Hideki'), 48));

            expect(saved.id).not.toBeNull();
            expect(saved.name.first).toEqual('Matsui');
            expect(saved.name.last).toEqual('Hideki');
            expect(saved.age).toEqual(48);
        })

        test('saved user already exists, it should be updated', async () => {
            const matsui = await repository.getUser(1);

            const agedMatsui = ageUser(matsui as User)

            const saved = await repository.save(agedMatsui);

            expect(saved.age).toEqual(49);
            expect(await repository.getUser(1)).toEqual(saved);
        })
    })
})