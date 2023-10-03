import { ObjectId } from "mongodb";
import { BaseDoc } from "../framework/doc";

export interface PinPointDoc extends BaseDoc {
 pin: ObjectId;
 user: ObjectId;
 caption: String;
 media: ObjectId;
}