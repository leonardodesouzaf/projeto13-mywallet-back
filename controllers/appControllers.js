import mongo from '../db/db.js';
import dayjs from 'dayjs';

let db = await mongo();

export async function home (req, res){
    try {
        const user = res.locals.user;
        if(user) {
            await db.collection("transactions").find({ userId: user._id }).toArray().then(usersArray => {
                return res.status(201).send(usersArray);
            });
        } else {
            return res.status(401).send('Login não autorizado!'); 
        }
    } catch (error) {
       res.status(500).send('Não foi possível conectar ao servidor!');
    }
};

export async function inTransaction (req, res){
    try {
        const user = res.locals.user;
        if(user) {
            const transaction = req.body;
            db.collection('transactions').insertOne(
                { 
                    value: parseFloat(transaction.value).toFixed(2),
                    description: transaction.description,
                    date: dayjs().format('DD/MM'),
                    userId: user._id,
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
};


export async function outTransaction (req, res){
    try {
        const user = res.locals.user;
        console.log(user);
        if(user) {
            const transaction = req.body;
            db.collection('transactions').insertOne(
                { 
                    value: ((parseFloat(transaction.value))*(-1)).toFixed(2),
                    description: transaction.description,
                    date: dayjs().format('DD/MM'),
                    userId: user._id,
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
};