import { expect, test } from '@jest/globals';
import * as Name from './name';

test('name should be made with first and last name', () => {
    const name = Name.makeName('Yamada', 'Taro');
    expect(name.first).toEqual('Yamada');
    expect(name.last).toEqual('Taro');
});

test.each([
    ['', 'Taro'],
    ['Yamada', ''],
])('both of names "first" and "last" must be specified', (first, last) => {
    expect(() => {
        Name.makeName(first, last)
    }).toThrowError();
})