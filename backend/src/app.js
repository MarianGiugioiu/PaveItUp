import express from 'express';
import { SequelizeService } from './config/db.js';
import { handleError } from './routes/middleware.js';
import { accountRouter } from './routes/account.js';
import { workspaceRouter } from './routes/workspace.js';
import cors from 'cors'
import { shapeRouter } from './routes/shape.js';

const app = express();
app.use(express.json());
app.use(cors());

app.get('/health', (req, res) => {
    res.send({
        message: 'Up and running'
    })
});

app.use('/accounts', accountRouter);
app.use('/workspaces', workspaceRouter);
app.use('/shapes', shapeRouter);

app.use(handleError);

let sequelize = SequelizeService.getInstance();
// sequelize.sync()
//   .then(() => {
//     console.log('Database sync successful!');
//   })
//   .catch((error) => {
//     console.error('Database sync error:', error);
//   });

// sequelize.authenticate()
//   .then(() => {
//     console.log('Connection has been established successfully.');
//   })
//   .catch((error) => {
//     console.error('Unable to connect to the database:', error);
//   });

app.listen(3000, (err) => {
    err && console.error(err);
    console.log('Server started on port 3000');
});