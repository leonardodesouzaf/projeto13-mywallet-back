import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { v4 as uuid } from 'uuid';
import joi from 'joi';
import bcrypt from 'bcrypt';

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
    await mongoClient.connect();
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
    await mongoClient.connect();
    try {
            const user = req.body;
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




app.listen(5000);