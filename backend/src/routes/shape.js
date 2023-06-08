import { Router } from "express";
import { Shape } from "../models/shape.js";
import { checkRole } from "./middleware.js";
import { Account } from "../models/account.js";

const router = Router();

router.get('/', checkRole(['user', 'manager']), async (req, res, next) => {
    const { token } = req.body;
    const { limit, page, accountName, official, mine, validated } = req.query;
    Shape.findAll({
        where: {
            accountName,
            official,
            accountId: mine ? token.id : null,
            valid: token.authority === 'user' ? 1 : validated
        },
        order: [['createdAt', 'DESC']],
        limit,
        offset: page * limit,
        raw:true
    })
    .then(records => {
        res.json(records);
    })
    .catch(next);
});

router.post('/', checkRole(['user', 'manager']), async (req, res, next) => {
    const { id, name, cameraRatioShape, textureType, color, points, token } = req.body;
    Shape.create({
        id,
        accountId: token.id,
        official: token.authority === 'manager' ? 1 : 0,
        cameraRatioShape,
        valid: token.authority === 'manager' ? 1 : 0,
        name,
        accountName: token.name,
        textureType,
        color,
        points,
    })
    .then(() =>{res.status(201).json({ message: 'Record created' })})
    .catch (next);
});

router.patch('/validate/:id', checkRole(['manager']), (req, res, next) => {
    Shape.update({
        valid: 1
    }, {
        where: {
            id: req.params.id
        },
        returning: true
    })
    .then(([ affectedCount ]) => {
        if (affectedCount) res.json({ message: 'Record exported' });
        else res.status(404).json({ message: 'Record not found' });
    })
    .catch (next);
       
});

router.delete('/:id', checkRole(['manager']), (req, res, next) => {
    Shape.destroy({
        where: {
            id: req.params.id
        },
    })
    .then(affectedCount => {
        if (affectedCount) res.json({ message: 'Record deleted' });
        else res.status(404).json({ message: 'Record not found' });
    })
    .catch(next);
});

export { router as shapeRouter };