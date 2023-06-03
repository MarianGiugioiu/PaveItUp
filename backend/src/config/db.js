import { Sequelize } from "sequelize";
import { getEnvironmentVariable } from "../utils/environment.util.js";

export class SequelizeService {
    static #instance;
    
    static getInstance() {
        if (!SequelizeService.instance) {
            SequelizeService.instance = new Sequelize(
                getEnvironmentVariable('DB_NAME'),
                getEnvironmentVariable('DB_USERNAME'),
                getEnvironmentVariable('DB_PASSWORD'),
                {
                    host: getEnvironmentVariable('DB_HOSTNAME'),
                    port: 5432,
                    logging: false,
                    dialect: 'postgres',
                    dialectOptions: {
                        ssl: {
                          require: true,
                          rejectUnauthorized: false
                        }
                    }
                }
            )
        }
        return SequelizeService.instance;
    }
}