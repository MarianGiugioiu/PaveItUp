import { Router } from "express";
import { Shape } from "../models/shape.js";
import { checkRole } from "./middleware.js";
import { Op } from "sequelize";

const router = Router();

router.get('/', checkRole(['user', 'manager']), async (req, res, next) => {
    const { token } = req.body;
    const { limit, page, accountName, official, mine, validated } = req.query;
    const where = {};
    if (accountName) {
        where.accountName = {
            [Op.like]: `%${accountName}%`,
        };
    }
    if (official !== undefined) {
        where.official = official;
    }
    if (mine !== undefined) {
        where.accountId = token.id;
    }

    where.valid = 1;
    if (validated === '0' && token.authority === 'manager') {
        where.valid = 0;
    }

    Shape.findAll({
        where,
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
        if (affectedCount) res.json({ message: 'Record validated' });
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