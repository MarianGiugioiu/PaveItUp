import express from 'express';
import { SequelizeService } from './config/db.js';
import { Account } from './models/account.js';
import { Shape } from './models/shape.js';
import { Workspace } from './models/workspace.js';

const app = express();

app.get('/health', (req, res) => {
    res.send({
        message: 'Up and running'
    })
});

let sequelize = SequelizeService.getInstance();
sequelize.sync()
  .then(() => {
    console.log('Database sync successful!');
  })
  .catch((error) => {
    console.error('Database sync error:', error);
  });

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

app.listen(3000, (err) => {
    err && console.error(err);
    console.log('Server started on port 3000');
});