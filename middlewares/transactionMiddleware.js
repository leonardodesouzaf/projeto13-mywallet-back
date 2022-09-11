import joi from 'joi';

export async function transactionMiddleware(req, res, next) {
    const transactionSchema = joi.object({
        description: joi.string().required(),
        value: joi.number().required()
    });
    const validation = transactionSchema.validate(req.body, { abortEarly: true });

    if (validation.error) {
        return res.status(422).send('Digite os seus dados corretamente!');
    };
    next();
}