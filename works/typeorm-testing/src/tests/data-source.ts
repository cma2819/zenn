import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entity/User"

export const TestingDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 15432,
    username: "test",
    password: "test",
    database: "testing",
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
})
