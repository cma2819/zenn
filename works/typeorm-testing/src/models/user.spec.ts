import { test, expect } from '@jest/globals'
import * as User from './user';
import * as Name from './name';

test('user should be created without id', () => {
    const user = User.newUser(Name.makeName('Yamada', 'Taro'), 20);
    expect(user.id).toBeUndefined();
    expect(user.name).toEqual(Name.makeName('Yamada', 'Taro'));
    expect(user.age).toEqual(20);
});

test('user should be aged', () => {
    const user = User.newUser(Name.makeName('Yamada', 'Taro'), 20);
    expect(user.age).toEqual(20);
    expect(User.ageUser(user).age).toEqual(21);
});