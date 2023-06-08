import { DataTypes, Model } from "sequelize";
import { SequelizeService } from "../config/db.js";

export class Workspace extends Model {
  id;
  accountId;
  name;
  cameraRatioSurface;
  cameraRatioShape;
  surface;
  shapes;
  parts;
}

Workspace.init(
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
    cameraRatioSurface: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "camera_ratio_surface",
    },
    cameraRatioShape: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "camera_ratio_shape",
    },
    surface: {
      type: DataTypes.JSON,
      allowNull: false,
      field: "surface",
    },
    shapes: {
      type: DataTypes.JSON,
      allowNull: false,
      field: "shapes",
    },
    parts: {
        type: DataTypes.JSON,
        allowNull: false,
        field: "parts",
    },
  },
  {
    sequelize: SequelizeService.getInstance(),
    modelName: "Workspace",
    tableName: "workspaces",
    createdAt: true,
    updatedAt: false
  }
);