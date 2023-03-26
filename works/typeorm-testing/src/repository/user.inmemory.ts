import { User } from '../models/user';
import { UserRepository } from './user';

export class InmemoryUserRepository implements UserRepository {
    
    private userStorage: {[k: number]: User} = {};
    private incremental = 0;

    constructor(defaultData: User[] = []) {
        this.userStorage = Object.fromEntries(defaultData.map(u => [u.id, u]));
    }

    getUser = (id: number) => {
        if (!(id in this.userStorage)) {
            return Promise.resolve(null)
        }

        return Promise.resolve(this.userStorage[id]);
    };

    save = (user: User) => {
        if (user.id) {
            this.userStorage[user.id] = user;
            return Promise.resolve(user);
        }

        this.incremental++;
        const saved = {
            id: this.incremental,
            ... user
        };
        this.userStorage[saved.id] = saved;

        return Promise.resolve(saved);
    };

    listUsers = () => {
        return Promise.resolve([ ...Object.values(this.userStorage)]);
    }
}