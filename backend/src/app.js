import express from 'express';


const app = express();

app.get('/health', (req, res) => {
    res.send({
        message: 'Up and running'
    })
});

app.listen(3000, (err) => {
    err && console.error(err);
    console.log('Server started on port 3000');
});