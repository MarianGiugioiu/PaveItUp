import { Router } from "express";
import { Workspace } from "../models/workspace.js";
import { checkRole } from "./middleware.js";
import { Account } from "../models/account.js";

const router = Router();
const limit = 3

router.get('/', checkRole(['user', 'manager']), async (req, res, next) => {
    const { token } = req.body;
    Workspace.findAll({
        where: {
            accountId: token.id
        },
        order: [['createdAt', 'DESC']],
        limit,
        offset: req.query.page * limit,
        raw:true
    })
    .then(records => {
        res.json(records);
    })
    .catch(next);
});

router.get('/:id', checkRole(['user', 'manager']), async (req, res, next) => {
    const { token } = req.body;
    Workspace.findAll({
        where: {
            accountId: token.id,
            id: req.params.id
        },
        raw:true
    })
    .then(record => {
        if (record) {
            res.json(record[0]);
        } else {
            res.status(404).json({ message: 'Record not found' })
        }
    })
    .catch(next);
});

router.post('/', checkRole(['user', 'manager']), async (req, res, next) => {
    const { id, name, cameraRatioSurface, cameraRatioShape, surface, shapes, parts, token } = req.body;
    Workspace.create({
        id,
        accountId: token.id,
        name,
        cameraRatioSurface,
        cameraRatioShape,
        surface,
        shapes,
        parts
    })
    .then(() =>{res.status(201).json({ message: 'Record created' })})
    .catch (next);
});

router.patch('/export/:id', checkRole(['manager']), (req, res, next) => {
    const { username, token } = req.body;
    Account.findOne({
        where: {
            username
        }
    }).then(async account => {
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        Workspace.update({
            accountId: account.dataValues.id
        }, {
            where: {
                accountId: token.id,
                id: req.params.id
            },
            returning: true
        })
        .then(([ affectedCount ]) => {
            if (affectedCount) res.json({ message: 'Record exported' });
            else res.status(404).json({ message: 'Record not found' });
        })
        .catch (next);
        
    })
    .catch (next);
});

router.put('/:id', checkRole(['user', 'manager']), (req, res, next) => {
    const { name, cameraRatioSurface, cameraRatioShape, surface, shapes, parts, token } = req.body;
    Workspace.update({
        name,
        cameraRatioSurface,
        cameraRatioShape,
        surface,
        shapes,
        parts
    }, {
        where: {
            accountId: token.id,
            id: req.params.id
        },
        returning: true
    })
    .then(([ affectedCount ]) => {
        if (affectedCount) res.json({ message: 'Record modified' });
        else res.status(404).json({ message: 'Record not found' });
    })
    .catch (next);
});

router.delete('/:id', checkRole(['user', 'manager']), (req, res, next) => {
    const { token } = req.body;
    Workspace.destroy({
        where: {
            accountId: token.id,
            id: req.params.id
        },
    })
    .then(affectedCount => {
        if (affectedCount) res.json({ message: 'Record deleted' });
        else res.status(404).json({ message: 'Record not found' });
    })
    .catch(next);
});

export { router as workspaceRouter };