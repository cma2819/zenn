import { User } from '../models/user';
import * as Name from '../models/name';
import { AppDataSource } from '../data-source'
import { User as UserEntity } from '../entity/User';

export type UserRepository = {
    getUser: (id: number) => Promise<User | null>;
    save: (user: User) => Promise<User>;
    listUsers: () => Promise<User[]>;
}
