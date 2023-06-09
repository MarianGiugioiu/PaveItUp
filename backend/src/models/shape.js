import { DataTypes, Model } from "sequelize";
import { SequelizeService } from "../config/db.js";

export class Shape extends Model {
  id;
  accountId;
  accountName;
  official;
  cameraRatioShape;
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
    accountName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "account_name",
    },
    cameraRatioShape: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "camera_ratio_shape",
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
    official: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "official",
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
    createdAt: true,
    updatedAt: false
  }
);