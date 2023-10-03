import { ObjectId } from "mongodb";
import { BaseDoc } from "../framework/doc";

export interface CollectionDoc extends BaseDoc {
  name: string;
  users: Set<ObjectId>;
  pins: Array<ObjectId>;
}