import { DataTypes, Model } from "sequelize";
import { SequelizeService } from "../config/db.js";
import { getEnvironmentVariable } from "../utils/environment.util.js";
import crypto from 'crypto'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const key = getEnvironmentVariable('ENCRYPTION_KEY');

export class Account extends Model {
  id;
  name;
  username;
  password;
  validated;
  validationCode;
  resetPasswordCode;
  resetPasswordCodeExpiryDate
  authority;
}

Account.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      field: "id",
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "name",
    },
    authority: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "authority",
    },
    username: {
      type: DataTypes.STRING(320),
      allowNull: false,
      unique: true,
      field: "username",
    },
    password: {
      type: DataTypes.STRING(60),
      allowNull: false,
      field: "password",
    },
    validated: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "validated",
    },
    validationCode: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "validation_code",
    },
    resetPasswordCode: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "reset_password_code",
    },
    resetPasswordCodeExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "reset_password_code_expiry_date",
    },
  },
  {
    sequelize: SequelizeService.getInstance(),
    modelName: "Account",
    tableName: "accounts",
    createdAt: false,
    updatedAt: false
  }
);

export function encryptUsername(username) {
  const secret = username;
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export async function encryptPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function validPassword(password1, password2) {
  let result = await bcrypt.compare(password1, password2);
  return result;
}

Account.beforeCreate(async (account) => {
  const secret = account.get('username');
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  account.set('username', encrypted);
  account.dataValues.password = await bcrypt.hash(account.dataValues.password, 10);
});

Account.beforeFind((account) => {
  if (account && account.where && account.where.username) {
    const secret = account.where.username;
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    account.where.username = encrypted;
  }
})

Account.afterFind((accounts) => {
  if (accounts) {
    if (!Array.isArray(accounts)) {
      accounts = [accounts];
    }
    for (const account of accounts) {
      const encrypted = account.username;
      if (encrypted) {
        const decipher = crypto.createDecipher('aes-256-cbc', key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        account.username = decrypted;
      }
    }
  }
});

Account.prototype.generateJWT = function () {
  const encrypted = this.dataValues.username;
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  const data = {
    id: this.dataValues.id,
    name: this.dataValues.name,
    username: decrypted,
    authority: this.dataValues.authority
  };
  const secret = getEnvironmentVariable('TOKEN_SECRET');

  const token = jwt.sign(data, secret, {expiresIn: 60 * 300});
  return token;
}