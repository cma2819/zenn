import { User } from '../models/user';
import * as Name from '../models/name';
import { User as UserEntity } from '../entity/User';
import { UserRepository } from './user';
import { DataSource, EntityManager } from 'typeorm';

export class PgUserRepository implements UserRepository {
    constructor(protected readonly manager: EntityManager) {}

    getUser = async (id: number): Promise<User | null> => {
        const entity = await this.manager.findOneBy(UserEntity, { id });
    
        if (!entity) {
            return null;
        }
        return userFromEntity(entity);
    };
    
    save = async (user: User): Promise<User> => {
        const entity = new UserEntity();
        if (user.id) {
            entity.id = user.id;
        }
        entity.firstName = user.name.first;
        entity.lastName = user.name.last;
        entity.age = user.age;
    
        const savedEntity = await this.manager.save(entity);
    
        return userFromEntity(savedEntity);
    };
    
    listUsers = async (): Promise<User[]> => {
        const entities = await this.manager.find(UserEntity);
    
        return entities.map(userFromEntity);
    };
        
}

const userFromEntity = (entity: UserEntity): User => {
    return {
        id: entity.id,
        name: Name.makeName(entity.firstName, entity.lastName),
        age: entity.age
    };
}