import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import joi from 'joi';

const userSchema = joi.object({
  name: joi.string().required(),
  age: joi.number().required(),
  email: joi.string().email().required()
});

const user = { name: "Fulano", age: "20", email: "fulano@email.com" }

const validation = userSchema.validate(user, { abortEarly: true });

const token = uuid();

app.post("/sign-up", async (req, res) => {
        // nome, email, senha
    const user = req.body;
    
    const passwordHash = bcrypt.hashSync(user.senha, 10);

    await db.collection('users').insertOne({ ...user, senha: passwordHash }) 

    res.sendStatus(201);
});


dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("meu_lindo_projeto"); //O padrão é test
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/sign-up', function (req,res) {
    const user = req.body;
    if(!user.username || !user.avatar){
        return res.status(400).send('Todos os campos são obrigatórios!');
    }
    return res.status(201).send('OK'); 
});


app.listen(5000);