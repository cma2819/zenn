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