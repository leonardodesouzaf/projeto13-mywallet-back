import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import joi from 'joi';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db(process.env.DB_NAME);
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/sign-up', async (req,res) => {
    try {
        const user = req.body;
        let haveAlready = true;
        const userSchema = joi.object({
            name: joi.string().required(),
            password: joi.string().required(),
            email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required()
        });
        const validation = userSchema.validate(user, { abortEarly: true });
        if (validation.error) {
            return res.status(422).send('Digite os seus dados corretamente!');
        }
        await db.collection("users").findOne({
            email: user.email
        }).then(user => {
            if(!user){
                haveAlready = false;
            }else{
                return res.status(409).send('Esse email já está sendo utilizado, tente novamente!'); 
            }
        });
        if(haveAlready === false){
            const passwordHash = bcrypt.hashSync(user.password, 10);
            db.collection("users").insertOne({
                name: user.name,
                email: user.email,
                password: passwordHash
            });
        }
        return res.status(201).send('Registro completo!');  
    } catch (error) {
        return res.status(500).send('Não foi possível conectar ao servidor!');
    }  
});

app.post("/sign-in", async (req, res) => {
    try {
            const user = req.body;
            const userSchema = joi.object({
                password: joi.string().required(),
                email: joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required()
            });
            const validation = userSchema.validate(user, { abortEarly: true });
            if (validation.error) {
                return res.status(422).send('Digite os seus dados corretamente!');
            }
            const userDB = await db.collection('users').findOne({ email: user.email });
            if(userDB && bcrypt.compareSync(user.password, userDB.password)) {
                const token = uuid();
                db.collection('sessions').insertOne(
                    { 
                        token: token,
                        userId: userDB._id
                    }
                );
                return res.status(201).send(token);
            } else { 
                return res.status(401).send('Login não autorizado!'); 
            };
        }
    catch (error) {
        return res.status(500).send('Não foi possível conectar ao servidor!');
    }
});

app.get('/home', async function (req,res) {
    try {
        const { authorization } = req.headers;
        const token = authorization?.replace('Bearer ', '');
        if(!token) return res.status(401).send('Login não autorizado!');
        const session = await db.collection("sessions").findOne({ token });       
        if (!session) {
            return res.status(401).send('Login não autorizado!'); 
        }
        const user = await db.collection("users").findOne({ _id: session.userId })
        if(user) {
            await db.collection("transactions").find({ userId: session.userId }).toArray().then(usersArray => {
                return res.status(201).send(usersArray);
            });
        } else {
            return res.status(401).send('Login não autorizado!'); 
        }
     } catch (error) {
        res.status(500).send('Não foi possível conectar ao servidor!');
     }
});

app.post("/in", async (req, res) => {
    try {
            const { authorization } = req.headers;
            const token = authorization?.replace('Bearer ', '');
            if(!token) return res.status(401).send('Login não autorizado!');
            const session = await db.collection("sessions").findOne({ token });       
            if (!session) {
                return res.status(401).send('Login não autorizado!'); 
            }
            const user = await db.collection("users").findOne({ _id: session.userId })
            if(user) {
                const transaction = req.body;
                const transactionSchema = joi.object({
                    description: joi.string().required(),
                    value: joi.number().required()
                });
                const validation = transactionSchema.validate(transaction, { abortEarly: true });
                if (validation.error) {
                    return res.status(422).send('Digite os seus dados corretamente!');
                }
                db.collection('transactions').insertOne(
                    { 
                        value: transaction.value,
                        description: transaction.description,
                        date: dayjs().format('DD/MM'),
                        userId: session.userId,
                        type: 'in'
                    }
                );
                return res.status(201).send('Transação efetuada!');
            } else {
                return res.status(401).send('Login não autorizado!'); 
            }
        }
    catch (error) {
        return res.status(500).send('Não foi possível conectar ao servidor!');
    }
});

app.post("/out", async (req, res) => {
    try {
            const { authorization } = req.headers;
            const token = authorization?.replace('Bearer ', '');
            if(!token) return res.status(401).send('Login não autorizado!');
            const session = await db.collection("sessions").findOne({ token });       
            if (!session) {
                return res.status(401).send('Login não autorizado!'); 
            }
            const user = await db.collection("users").findOne({ _id: session.userId })
            if(user) {
                const transaction = req.body;
                const transactionSchema = joi.object({
                    description: joi.string().required(),
                    value: joi.number().precision(2).required()
                });
                const validation = transactionSchema.validate(transaction, { abortEarly: true });
                if (validation.error) {
                    return res.status(422).send('Digite os seus dados corretamente!');
                }
                db.collection('transactions').insertOne(
                    { 
                        value: transaction.value,
                        description: transaction.description,
                        date: dayjs().format('DD/MM'),
                        userId: session.userId,
                        type: 'out'
                    }
                );
                return res.status(201).send('Transação efetuada!');
            } else {
                return res.status(401).send('Login não autorizado!'); 
            }
        }
    catch (error) {
        return res.status(500).send('Não foi possível conectar ao servidor!');
    }
});

app.listen(5000);