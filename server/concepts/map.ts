import { ObjectId } from "mongodb";
import { BaseDoc } from "../framework/doc";

export interface MapDoc extends BaseDoc {
  locations: Set<ObjectId>;
  pins: Set<ObjectId>;
}