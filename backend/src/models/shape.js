import { DataTypes, Model } from "sequelize";
import { SequelizeService } from "../config/db.js";

export class Shape extends Model {
  id;
  accountId;
  valid;
  name;
  textureType;
  color;
  points;
}

Shape.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: true,
      defaultValue: DataTypes.UUIDV4,
      field: "id",
    },
    accountId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "account_id",
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "name",
    },
    textureType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "texture_type",
    },
    valid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "valid",
    },
    color: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "color",
    },
    points: {
        type: DataTypes.JSON,
        allowNull: false,
        field: "points",
    },
  },
  {
    sequelize: SequelizeService.getInstance(),
    modelName: "Shape",
    tableName: "shapes",
    createdAt: false,
    updatedAt: false
  }
);