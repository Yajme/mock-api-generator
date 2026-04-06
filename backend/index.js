import express from 'express';

import db from './src/config/database.js'
import {env} from './src/config/env.js';

import {notFoundHandler,errorHandler,authenticate,sendResponse,internalOnly} from './src/middleware/index.js';

import api from './src/routes/index.js';
import user from './src/routes/userRoutes.js';
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended : true}));


//Initialize Database 
db.initDatabase();


app.get('/',(req,res)=>{
  res.json({message : "Hello World"});
})

app.use('/api',internalOnly,api,sendResponse);
app.use('/mock',authenticate,user,sendResponse);

app.use(notFoundHandler);
app.use(errorHandler);


const PORT = env.PORT;
const ENV = env.NODE_ENV;
app.listen(PORT,()=>{
  console.log(`[${ENV}] Server listening on http://127.0.0.1:${PORT}`);
});
