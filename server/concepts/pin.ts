import { ObjectId } from "mongodb";
import { BaseDoc } from "../framework/doc";

export interface PinDoc extends BaseDoc {
  location: ObjectId;
}