import { AppDataSource } from "./data-source"
import * as User from './models/user';
import * as Name from './models/name';
import { PgUserRepository as UserRepository } from './repository/user.pg';

AppDataSource.initialize().then(async (dataSource) => {

    const repository = new UserRepository(dataSource.createEntityManager());

    console.log("Inserting a new user into the database...");
    const user = User.newUser(
        Name.makeName('Timber', 'Saw'),
        25
    );
    const saved = await repository.save(user);
    console.log("Saved a new user with id: " + saved.id)

    console.log("Loading users from the database...")
    const users = await repository.listUsers();
    console.log("Loaded users: ", users)

    console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))
