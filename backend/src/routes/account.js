import { Router, raw } from "express";
import { getEnvironmentVariable } from "../utils/environment.util.js";
import { Account, encryptPassword, encryptUsername, validPassword } from "../models/account.js";
import { checkRole, handleError } from "./middleware.js";
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const router = Router();

const resetPasswordCodeDuration = 30;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: getEnvironmentVariable('EMAIL_ADDRESS'),
        pass: getEnvironmentVariable('EMAIL_PASSWORD')
    }
});

function createValidationMail(username, validationCode) {
  const validationLink = `https://localhost:4200/account/validate-email/${validationCode}`;

  const emailTemplate = `
    <h1>Account Validation</h1>
    <p>Thank you for registering an account.</p>
    <p>Please click the following link to validate your account:</p>
    <a href="${validationLink}">${validationLink}</a>
  `;

  const mailOptions = {
    from: getEnvironmentVariable('EMAIL_ADDRESS'),
    to: username,
    subject: 'Account Validation',
    html: emailTemplate
  };

  return mailOptions;
}

function createResetPasswordCodeMail(username, resetPasswordCode) {
  const validationLink = `https://localhost:4200/account/reset-password/${resetPasswordCode}`;

  const emailTemplate = `
    <h1>Reset Password Code</h1>
    <p>Please click the following link to reset you password:</p>
    <a href="${validationLink}">${validationLink}</a>
  `;

  const mailOptions = {
    from: getEnvironmentVariable('EMAIL_ADDRESS'),
    to: username,
    subject: 'Reset Password Code',
    html: emailTemplate
  };

  return mailOptions;
}

router.post('/login', (req, res, next) => {
  const { username, password } = req.body;
  Account.findOne({
      where: {
          username
      }
  }).then(async account => {
      if (!account) {
          return res.status(404).json({ message: 'Account not found' });
      }
      
      if (!(await validPassword(password, account.dataValues.password))) {
          return res.status(403).json({ message: 'Incorrect password' });
      }

      const token = account.generateJWT();
      return res.status(200).json({ token });
  })
  .catch (next);
});

router.post('/change-password', checkRole(['user']), (req, res, next) => {
  const { oldPassword, newPassword, token } = req.body;
  Account.findOne({
      where: {
          username: token.username
      }
  }).then(async result => {
      if (!result) {
          return res.status(404).json({ message: 'Account not found' });
      }
      const account = result.dataValues;
      if (!(await validPassword(oldPassword, account.password))) {
          return res.status(403).json({ message: 'Incorrect password' });
      }
      const hashedPassword = await encryptPassword(newPassword);
      account.password = hashedPassword;
      Account.update(account, {
        where: { id: account.id }
      })
      .then(() => {
        return res.send({message: 'Password successfully changed'});
      })
      .catch (next);
      
  })
  .catch (next);
});

router.post('/register', async (req, res, next) => { 
    const { username, password, name } = req.body;
    const validationCode = uuidv4();
    Account.create({
        name,
        username,
        password,
        authority: 'user',
        validated: 0,
        validationCode
    })
    .then(() => {
      const mailOptions = createValidationMail(username, validationCode);
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          res.status(500).send({ status: 'error', message: "Error sending email"});
        } else {
          res.send({message: 'Account registered. Validation email sent.'});
        }
      });
    })
    .catch (next);
});

router.post('/register-manager', async (req, res, next) => { 
  const { username, password, name } = req.body;
  Account.create({
      name,
      username,
      password,
      authority: 'manager',
      validated: 1,
  })
  .then(() => {
    res.send({message: 'Manager account registered'});
  })
  .catch (next);
});

router.post('/validate-email', async (req, res, next) => { 
  const { validationCode } = req.body;
  try {
    const result = await Account.findAll({
      where: { validationCode },
    });
    if (result.length) {
      const account = result[0].dataValues;
      if (account.validated === 1) {
        return res.status(400).send({ status: 'error', message: "Email was already validated"});
      } else {
        account.validated = 1;
        await Account.update(account, {
          where: { id: account.id }
        });
        return res.send({message: 'Email successfully validated'});
      }
    } else {
      return res.status(400).send({ status: 'error', message: "Validation code is invalid"});
    }
  } catch (error) {
    handleError(error, req, res, next);
  }
});

router.post('/send-reset-password-code', async (req, res, next) => { 
  const { username } = req.body;
  const resetPasswordCode = uuidv4();
  const resetPasswordCodeExpiryDate = new Date();
  resetPasswordCodeExpiryDate.setMinutes(resetPasswordCodeExpiryDate.getMinutes() + resetPasswordCodeDuration);
  Account.update({resetPasswordCode, resetPasswordCodeExpiryDate}, {
    where: { username: encryptUsername(username) }
  }).then(() => {
    const mailOptions = createResetPasswordCodeMail(username, resetPasswordCode);
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        res.status(500).send({ status: 'error', message: "Error sending email"});
      } else {
        res.send({message: 'Reset password code created. Email sent.'});
      }
    });
  })
  .catch (next);
});

router.post('/validate-reset-password-code', async (req, res, next) => { 
  const { resetPasswordCode } = req.body;
  try {
    const result = await Account.findAll({
      where: { resetPasswordCode },
    });
    if (result.length) {
      const account = result[0].dataValues;
      const currentDate = new Date();
      if (currentDate > account.resetPasswordCodeExpiryDate) {
        return res.status(400).send({ status: 'error', message: "The reset password code is expired"});
      } else {
        return res.send({message: 'Reset password code is valid'});
      }
    } else {
      return res.status(400).send({ status: 'error', message: "Reset password code is invalid"});
    }
  } catch (error) {
    handleError(error, req, res, next);
  }
});

router.post('/reset-password', async (req, res, next) => { 
  const { resetPasswordCode, newPassword } = req.body;
  try {
    const result = await Account.findAll({
      where: { resetPasswordCode },
    });
    if (result.length) {
      const account = result[0].dataValues;
      const samePassword = await validPassword(newPassword, account.password);
      if (samePassword) {
        return res.status(400).send({ status: 'error', message: 'The new password is identical to the old one'});
      } else {
        account.resetPasswordCode = null;
        account.resetPasswordCodeExpiryDate = null;
        const hashedPassword = await encryptPassword(newPassword);
        account.password = hashedPassword;
        await Account.update(account, {
          where: { id: account.id }
        });
        return res.send({message: 'Password successfully changed'});
      }
    } else {
      return res.status(400).send({ status: 'error', message: "Reset password code is invalid"});
    }
  } catch (error) {
    handleError(error, req, res, next);
  }
});

export { router as accountRouter };