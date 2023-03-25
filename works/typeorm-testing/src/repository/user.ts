import { User } from '../models/user';
import { AppDataSource } from '../data-source'
import { User as UserEntity } from '../entity/User';

export const getUser = async (id: number): Promise<User | null> => {
    await AppDataSource.manager.findOneBy(UserEntity)
}